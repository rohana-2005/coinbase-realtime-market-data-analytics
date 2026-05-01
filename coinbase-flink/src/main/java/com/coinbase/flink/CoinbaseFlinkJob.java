package com.coinbase.flink;

import com.coinbase.flink.model.PriceData;
import com.coinbase.flink.sink.MongoSink;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.bson.Document;

import java.time.Instant;

public class CoinbaseFlinkJob {

    public static void main(String[] args) throws Exception {

        System.out.println("[START] Starting Flink Job (Multi-Coin)...");

        StreamExecutionEnvironment env =
                StreamExecutionEnvironment.getExecutionEnvironment();

        // Kafka Source
        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers("localhost:9092")
                .setTopics("coinbase-market-data")
                .setGroupId("coinbase-flink-group")
                .setStartingOffsets(OffsetsInitializer.latest())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> stream = env.fromSource(
                source,
                WatermarkStrategy.noWatermarks(),
                "Kafka Source"
        );

        // Parse JSON and extract price data (all coins pass through)
        ObjectMapper mapper = new ObjectMapper();

        DataStream<PriceData> priceStream = stream
                .map(json -> {
                    try {
                        JsonNode node = mapper.readTree(json);
                        if (node.has("price") && node.has("product_id")) {
                            String symbol = node.get("product_id").asText();
                            Double price = node.get("price").asDouble();
                            Long timestamp = System.currentTimeMillis();
                            return new PriceData(symbol, price, timestamp);
                        }
                    } catch (Exception e) {
                        System.err.println("[ERROR] Error parsing JSON: " + e.getMessage());
                    }
                    return null;
                })
                .filter(data -> data != null);

        // Print raw data for debugging
        priceStream.print();

        // KEY CHANGE: Group by symbol so each coin gets its own independent 10-second window
        priceStream
                .keyBy(data -> data.getSymbol())
                .window(TumblingProcessingTimeWindows.of(Time.seconds(10)))
                .aggregate(new AverageAggregate())
                .map(avgData -> {
                    Document doc = new Document();
                    doc.append("symbol", avgData.symbol);          // ← dynamic, from keyBy
                    doc.append("avg_price", avgData.avgPrice);
                    doc.append("count", avgData.count);
                    doc.append("window_seconds", 10);
                    doc.append("timestamp", Instant.now().toString());
                    doc.append("timestamp_ms", System.currentTimeMillis());
                    return doc;
                })
                .addSink(new MongoSink());

        System.out.println("[OK] Flink job configured for multi-coin processing");
        System.out.println("[INFO] Consuming from: coinbase-market-data");
        System.out.println("[INFO] Processing: BTC-USD, ETH-USD, SOL-USD, DOGE-USD");
        System.out.println("[INFO] Each coin gets its own independent 10-second window");
        System.out.println("[INFO] Storing per-coin aggregates in MongoDB every 10 seconds");

        env.execute("Coinbase Multi-Coin: Kafka → Flink → MongoDB");
    }

    // Aggregate function — accumulator carries symbol so it survives the window
    public static class AverageAggregate implements AggregateFunction<PriceData, AverageAccumulator, AverageResult> {

        @Override
        public AverageAccumulator createAccumulator() {
            return new AverageAccumulator();
        }

        @Override
        public AverageAccumulator add(PriceData value, AverageAccumulator accumulator) {
            accumulator.symbol = value.getSymbol(); // carry symbol through
            accumulator.sum += value.getPrice();
            accumulator.count++;
            return accumulator;
        }

        @Override
        public AverageResult getResult(AverageAccumulator accumulator) {
            return new AverageResult(
                    accumulator.symbol,
                    accumulator.count > 0 ? accumulator.sum / accumulator.count : 0.0,
                    accumulator.count
            );
        }

        @Override
        public AverageAccumulator merge(AverageAccumulator a, AverageAccumulator b) {
            a.sum += b.sum;
            a.count += b.count;
            if (a.symbol == null) a.symbol = b.symbol;
            return a;
        }
    }

    // Accumulator — now carries symbol
    public static class AverageAccumulator {
        String symbol = null;
        double sum = 0.0;
        long count = 0;
    }

    // Result — now carries symbol
    public static class AverageResult {
        String symbol;
        double avgPrice;
        long count;

        public AverageResult(String symbol, double avgPrice, long count) {
            this.symbol = symbol;
            this.avgPrice = avgPrice;
            this.count = count;
        }
    }
}
