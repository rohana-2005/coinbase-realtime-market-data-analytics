package main.java.com.coinbase.flink;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

public class CoinbaseFlinkJob {

    public static void main(String[] args) throws Exception {

        System.out.println("🚀 Starting Flink Job...");

        StreamExecutionEnvironment env =
                StreamExecutionEnvironment.getExecutionEnvironment();

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

        stream.print();

        System.out.println("✅ Flink job configured");
        System.out.println("📊 Consuming from: coinbase-market-data");
        System.out.println("🔄 Processing live market data...");

        env.execute("Coinbase Kafka → Flink Job");
    }
}
