package com.coinbase.streaming.kafka;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class MarketDataProducer {

    private static final String TOPIC = "coinbase-market-data";

    private final KafkaTemplate<String, String> kafkaTemplate;

    public MarketDataProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void send(String message) {
        kafkaTemplate.send(TOPIC, message);
        System.out.println("📤 Sent to Kafka");
    }
}
