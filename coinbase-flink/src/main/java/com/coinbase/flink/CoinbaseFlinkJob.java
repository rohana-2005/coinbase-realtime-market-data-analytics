package com.coinbase.flink;

import com.coinbase.flink.model.PriceData;
import com.coinbase.flink.sink.MongoSink;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.common.state.ListState;
import org.apache.flink.api.common.state.ListStateDescriptor;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.Collector;
import org.bson.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class CoinbaseFlinkJob {

    public static void main(String[] args) throws Exception {

        System.out.println("[START] Starting Flink Job - Multi-Coin with Indicators...");

        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers("localhost:9092")
                .setTopics("coinbase-market-data")
                .setGroupId("coinbase-flink-indicators-group")
                .setStartingOffsets(OffsetsInitializer.latest())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> stream = env.fromSource(
                source, WatermarkStrategy.noWatermarks(), "Kafka Source");

        ObjectMapper mapper = new ObjectMapper();

        // Step 1: Parse raw Kafka JSON into PriceData objects
        DataStream<PriceData> priceStream = stream
                .map(json -> {
                    try {
                        JsonNode node = mapper.readTree(json);
                        if (node.has("price") && node.has("product_id")) {
                            String symbol = node.get("product_id").asText();
                            double price = node.get("price").asDouble();
                            return new PriceData(symbol, price, System.currentTimeMillis());
                        }
                    } catch (Exception e) {
                        System.err.println("[ERROR] JSON parse failed: " + e.getMessage());
                    }
                    return null;
                })
                .filter(data -> data != null);

        // Step 2: 10-second tumbling window per coin — computes avg price + count
        DataStream<AverageResult> windowedStream = priceStream
                .keyBy(PriceData::getSymbol)
                .window(TumblingProcessingTimeWindows.of(Time.seconds(10)))
                .aggregate(new AverageAggregate());

        // Step 3: Stateful per-coin indicator computation (EMA, RSI, Whale Detection)
        windowedStream
                .keyBy(result -> result.symbol)
                .process(new IndicatorProcessFunction())
                .addSink(new MongoSink());

        System.out.println("[OK] Pipeline: Kafka -> 10s Window -> EMA/RSI/Whale -> MongoDB");
        env.execute("Coinbase Multi-Coin: Kafka -> Flink Indicators -> MongoDB");
    }

    // ── Window Aggregate: computes avg price + count per 10s per coin ──────────

    public static class AverageAccumulator {
        String symbol = null;
        double sum = 0.0;
        long count = 0;
    }

    public static class AverageResult {
        public String symbol;
        public double avgPrice;
        public long count;

        public AverageResult() {}
        public AverageResult(String symbol, double avgPrice, long count) {
            this.symbol = symbol;
            this.avgPrice = avgPrice;
            this.count = count;
        }
    }

    public static class AverageAggregate
            implements AggregateFunction<PriceData, AverageAccumulator, AverageResult> {

        @Override public AverageAccumulator createAccumulator() { return new AverageAccumulator(); }

        @Override
        public AverageAccumulator add(PriceData v, AverageAccumulator acc) {
            acc.symbol = v.getSymbol();
            acc.sum += v.getPrice();
            acc.count++;
            return acc;
        }

        @Override
        public AverageResult getResult(AverageAccumulator acc) {
            return new AverageResult(acc.symbol, acc.count > 0 ? acc.sum / acc.count : 0.0, acc.count);
        }

        @Override
        public AverageAccumulator merge(AverageAccumulator a, AverageAccumulator b) {
            a.sum += b.sum;
            a.count += b.count;
            if (a.symbol == null) a.symbol = b.symbol;
            return a;
        }
    }

    // ── Stateful Indicator Processor ────────────────────────────────────────────
    // Receives one AverageResult every 10 seconds per coin.
    // Maintains state across windows to compute EMA, RSI, and Whale alerts.

    public static class IndicatorProcessFunction
            extends KeyedProcessFunction<String, AverageResult, Document> {

        // Tuning constants
        private static final int    EMA_PERIOD      = 14;  // 14-period EMA
        private static final int    RSI_LOOKBACK    = 15;  // 15 prices = 14 price changes for RSI
        private static final int    WHALE_LOOKBACK  = 5;   // rolling avg over last 5 windows
        private static final double WHALE_THRESHOLD = 3.0; // 300% spike = whale

        // Flink-managed state (survives across windows, keyed per coin)
        private transient ValueState<Double>  emaState;
        private transient ListState<Double>   priceHistoryState;
        private transient ListState<Long>     countHistoryState;

        @Override
        public void open(Configuration parameters) throws Exception {
            emaState = getRuntimeContext().getState(
                    new ValueStateDescriptor<>("ema", Double.class));
            priceHistoryState = getRuntimeContext().getListState(
                    new ListStateDescriptor<>("price-history", Double.class));
            countHistoryState = getRuntimeContext().getListState(
                    new ListStateDescriptor<>("count-history", Long.class));
        }

        @Override
        public void processElement(AverageResult value, Context ctx, Collector<Document> out)
                throws Exception {

            String symbol       = value.symbol;
            double currentPrice = value.avgPrice;
            long   currentCount = value.count;

            // ── EMA-14 ────────────────────────────────────────────────────────
            // Formula: EMA = (Price - prevEMA) * multiplier + prevEMA
            // multiplier = 2 / (period + 1)
            final double mult = 2.0 / (EMA_PERIOD + 1.0); // 0.1333
            Double prevEma = emaState.value();
            double ema = (prevEma == null || prevEma == 0.0)
                    ? currentPrice                          // seed on first data point
                    : (currentPrice - prevEma) * mult + prevEma;
            emaState.update(ema);

            // ── RSI-14 ────────────────────────────────────────────────────────
            // RSI = 100 - 100/(1 + avgGain/avgLoss) over last 14 price changes
            List<Double> prices = new ArrayList<>();
            for (Double p : priceHistoryState.get()) prices.add(p);
            prices.add(currentPrice);
            if (prices.size() > RSI_LOOKBACK)
                prices = prices.subList(prices.size() - RSI_LOOKBACK, prices.size());
            priceHistoryState.update(prices);

            double rsi = 50.0; // neutral default during warm-up
            if (prices.size() >= 3) {
                double totalGain = 0, totalLoss = 0;
                int periods = prices.size() - 1;
                for (int i = 1; i < prices.size(); i++) {
                    double change = prices.get(i) - prices.get(i - 1);
                    if (change > 0) totalGain += change;
                    else            totalLoss += Math.abs(change);
                }
                double avgGain = totalGain / periods;
                double avgLoss = totalLoss / periods;
                if (avgLoss == 0.0) {
                    rsi = (avgGain > 0) ? 100.0 : 50.0;
                } else {
                    rsi = 100.0 - (100.0 / (1.0 + avgGain / avgLoss));
                }
            }

            // ── Whale Detection ───────────────────────────────────────────────
            // If current 10s trade count > 3× rolling average → whale activity
            List<Long> counts = new ArrayList<>();
            for (Long c : countHistoryState.get()) counts.add(c);

            boolean whaleAlert  = false;
            String  whaleReason = "";
            if (counts.size() >= 3) {
                double avgCount = counts.stream().mapToLong(Long::longValue).average().orElse(0);
                if (avgCount > 0 && currentCount > avgCount * WHALE_THRESHOLD) {
                    whaleAlert = true;
                    long multiple = Math.round((double) currentCount / avgCount);
                    whaleReason = multiple + "x volume spike ("
                            + currentCount + " vs avg " + Math.round(avgCount) + ")";
                    System.out.println("[WHALE] " + symbol + " - " + whaleReason);
                }
            }
            counts.add(currentCount);
            if (counts.size() > WHALE_LOOKBACK)
                counts = counts.subList(counts.size() - WHALE_LOOKBACK, counts.size());
            countHistoryState.update(counts);

            // ── Emit MongoDB Document ─────────────────────────────────────────
            Document doc = new Document()
                    .append("symbol",         symbol)
                    .append("avg_price",      r2(currentPrice))
                    .append("count",          (int) Math.min(currentCount, Integer.MAX_VALUE))
                    .append("window_seconds", 10)
                    .append("timestamp",      Instant.now().toString())
                    .append("timestamp_ms",   System.currentTimeMillis())
                    .append("ema",            r2(ema))
                    .append("rsi",            r2(rsi))
                    .append("whale_alert",    whaleAlert)
                    .append("whale_reason",   whaleReason);

            out.collect(doc);
        }

        private double r2(double v) { return Math.round(v * 100.0) / 100.0; }
    }
}
