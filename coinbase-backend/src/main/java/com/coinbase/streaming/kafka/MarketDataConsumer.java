package com.coinbase.streaming.kafka;

import com.coinbase.model.PriceAnalytics;
import com.coinbase.repository.PriceAnalyticsRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class MarketDataConsumer {

    private final PriceAnalyticsRepository repository;
    private final ObjectMapper objectMapper;

    public MarketDataConsumer(PriceAnalyticsRepository repository) {
        this.repository = repository;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(topics = "coinbase-market-data", groupId = "analytics-group")
    public void consume(String message) {
        try {
            JsonNode data = objectMapper.readTree(message);
            
            // Only process ticker messages
            if (!"ticker".equals(data.get("type").asText())) {
                return;
            }

            PriceAnalytics analytics = new PriceAnalytics();
            analytics.setSymbol(data.get("product_id").asText());
            analytics.setPrice(data.get("price").asDouble());
            analytics.setAvgPrice(data.get("price").asDouble()); // Set avgPrice same as price for now
            analytics.setVolume24h(data.get("volume_24h").asDouble());
            analytics.setHigh24h(data.get("high_24h").asDouble());
            analytics.setLow24h(data.get("low_24h").asDouble());
            analytics.setBestBid(data.get("best_bid").asDouble());
            analytics.setBestAsk(data.get("best_ask").asDouble());
            analytics.setTimestamp(data.get("time").asText());
            analytics.setCount(1); // Each message is 1 update

            repository.save(analytics);
            System.out.println("💾 Saved to MongoDB: " + analytics.getSymbol() + " @ $" + analytics.getPrice());

        } catch (Exception e) {
            System.err.println("❌ Error processing message: " + e.getMessage());
        }
    }
}
