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
    private Double price;
    
    @Field("volume_24h")
    private Double volume24h;
    
    @Field("high_24h")
    private Double high24h;
    
    @Field("low_24h")
    private Double low24h;
    
    @Field("best_bid")
    private Double bestBid;
    
    @Field("best_ask")
    private Double bestAsk;
    
    @Field("avg_price")
    private Double avgPrice;
    
    private Integer count;
    
    @Field("window_seconds")
    private Integer windowSeconds;

    private Double ema;

    private Double rsi;

    @Field("whale_alert")
    private Boolean whaleAlert;

    @Field("whale_reason")
    private String whaleReason;

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

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getVolume24h() {
        return volume24h;
    }

    public void setVolume24h(Double volume24h) {
        this.volume24h = volume24h;
    }

    public Double getHigh24h() {
        return high24h;
    }

    public void setHigh24h(Double high24h) {
        this.high24h = high24h;
    }

    public Double getLow24h() {
        return low24h;
    }

    public void setLow24h(Double low24h) {
        this.low24h = low24h;
    }

    public Double getBestBid() {
        return bestBid;
    }

    public void setBestBid(Double bestBid) {
        this.bestBid = bestBid;
    }

    public Double getBestAsk() {
        return bestAsk;
    }

    public void setBestAsk(Double bestAsk) {
        this.bestAsk = bestAsk;
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

    public Double getEma() { return ema; }
    public void setEma(Double ema) { this.ema = ema; }

    public Double getRsi() { return rsi; }
    public void setRsi(Double rsi) { this.rsi = rsi; }

    public Boolean getWhaleAlert() { return whaleAlert; }
    public void setWhaleAlert(Boolean whaleAlert) { this.whaleAlert = whaleAlert; }

    public String getWhaleReason() { return whaleReason; }
    public void setWhaleReason(String whaleReason) { this.whaleReason = whaleReason; }

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
                ", price=" + price +
                ", volume24h=" + volume24h +
                ", high24h=" + high24h +
                ", low24h=" + low24h +
                ", bestBid=" + bestBid +
                ", bestAsk=" + bestAsk +
                ", avgPrice=" + avgPrice +
                ", count=" + count +
                ", windowSeconds=" + windowSeconds +
                ", timestamp='" + timestamp + '\'' +
                '}';
    }
}
