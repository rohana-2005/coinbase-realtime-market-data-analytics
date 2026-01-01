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

        System.out.println("🚀 Starting Flink Job...");

        StreamExecutionEnvironment env =
                StreamExecutionEnvironment.getExecutionEnvironment();

        // Kafka Source
        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers("localhost:9092")
                .setTopics("coinbase-market-data")
                .setGroupId("coinbase-flink-group")
                .setStartingOffsets(OffsetsInitializer.earliest())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> stream = env.fromSource(
                source,
                WatermarkStrategy.noWatermarks(),
                "Kafka Source"
        );

        // Parse JSON and extract price data
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
                        System.err.println("❌ Error parsing JSON: " + e.getMessage());
                    }
                    return null;
                })
                .filter(data -> data != null);

        // Print raw data for debugging
        priceStream.print();

        // Compute 10-second window average and send to MongoDB
        priceStream
                .windowAll(TumblingProcessingTimeWindows.of(Time.seconds(10)))
                .aggregate(new AverageAggregate())
                .map(avgData -> {
                    Document doc = new Document();
                    doc.append("symbol", "BTC-USD");
                    doc.append("avg_price", avgData.avgPrice);
                    doc.append("count", avgData.count);
                    doc.append("window_seconds", 10);
                    doc.append("timestamp", Instant.now().toString());
                    doc.append("timestamp_ms", System.currentTimeMillis());
                    return doc;
                })
                .addSink(new MongoSink());

        System.out.println("✅ Flink job configured");
        System.out.println("📊 Consuming from: coinbase-market-data");
        System.out.println("🔄 Processing live market data...");
        System.out.println("💾 Storing aggregates in MongoDB every 10 seconds");

        env.execute("Coinbase Kafka → Flink → MongoDB");
    }

    // Aggregate function to compute average
    public static class AverageAggregate implements AggregateFunction<PriceData, AverageAccumulator, AverageResult> {

        @Override
        public AverageAccumulator createAccumulator() {
            return new AverageAccumulator();
        }

        @Override
        public AverageAccumulator add(PriceData value, AverageAccumulator accumulator) {
            accumulator.sum += value.getPrice();
            accumulator.count++;
            return accumulator;
        }

        @Override
        public AverageResult getResult(AverageAccumulator accumulator) {
            return new AverageResult(
                    accumulator.count > 0 ? accumulator.sum / accumulator.count : 0.0,
                    accumulator.count
            );
        }

        @Override
        public AverageAccumulator merge(AverageAccumulator a, AverageAccumulator b) {
            a.sum += b.sum;
            a.count += b.count;
            return a;
        }
    }

    // Accumulator for sum and count
    public static class AverageAccumulator {
        double sum = 0.0;
        long count = 0;
    }

    // Result with average and count
    public static class AverageResult {
        double avgPrice;
        long count;

        public AverageResult(double avgPrice, long count) {
            this.avgPrice = avgPrice;
            this.count = count;
        }
    }
}
