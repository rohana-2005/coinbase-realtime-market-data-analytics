package com.coinbase.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.Instant;

@Document(collection = "market_data")
public class PriceAnalytics {
    
    @Id
    private String id;
    private String symbol;
    
    @Field("avg_price")
    private Double avgPrice;
    
    private Integer count;
    
    @Field("window_seconds")
    private Integer windowSeconds;
    
    private String timestamp;

    public PriceAnalytics() {}

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public Double getAvgPrice() {
        return avgPrice;
    }

    public void setAvgPrice(Double avgPrice) {
        this.avgPrice = avgPrice;
    }

    public Integer getCount() {
        return count;
    }

    public void setCount(Integer count) {
        this.count = count;
    }

    public Integer getWindowSeconds() {
        return windowSeconds;
    }

    public void setWindowSeconds(Integer windowSeconds) {
        this.windowSeconds = windowSeconds;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
    
    public Long getTimestampMillis() {
        if (timestamp != null) {
            try {
                return Instant.parse(timestamp).toEpochMilli();
            } catch (Exception e) {
                return System.currentTimeMillis();
            }
        }
        return System.currentTimeMillis();
    }

    @Override
    public String toString() {
        return "PriceAnalytics{" +
                "id='" + id + '\'' +
                ", symbol='" + symbol + '\'' +
                ", windowSeconds=" + windowSeconds +
                ", timestamp='" + timestamp
                ", timestamp=" + timestamp +
                ", formattedTime='" + formattedTime + '\'' +
                '}';
    }
}
