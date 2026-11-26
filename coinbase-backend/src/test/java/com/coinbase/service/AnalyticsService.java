package com.coinbase.service;

import com.coinbase.model.PriceAnalytics;
import com.coinbase.repository.PriceAnalyticsRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnalyticsService {

    @Autowired
    private PriceAnalyticsRepository repository;

    public PriceAnalytics getLatest(String symbol) {
        return repository
                .findFirstBySymbolOrderByTimestampDesc(symbol);
    }

    public List<PriceAnalytics> getRecent(
            String symbol,
            int limit
    ) {
        return repository
                .findRecentBySymbol(symbol)
                .stream()
                .limit(limit)
                .toList();
    }

    public String getTradingSignal(String symbol) {

        List<PriceAnalytics> prices =
                repository.findRecentBySymbol(symbol);

        if (prices.size() < 30) {
            return "HOLD";
        }

        double shortMA =
                prices.stream()
                        .limit(5)
                        .mapToDouble(PriceAnalytics::getPrice)
                        .average()
                        .orElse(0);

        double longMA =
                prices.stream()
                        .limit(20)
                        .mapToDouble(PriceAnalytics::getPrice)
                        .average()
                        .orElse(0);

        double currentPrice =
                prices.get(0).getPrice();

        if (currentPrice > shortMA &&
                shortMA > longMA) {
            return "BUY";
        }

        if (currentPrice < shortMA &&
                shortMA < longMA) {
            return "SELL";
        }

        return "HOLD";
    }
}