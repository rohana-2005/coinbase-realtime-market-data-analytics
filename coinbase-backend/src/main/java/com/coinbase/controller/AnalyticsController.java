package com.coinbase.controller;

import com.coinbase.model.PriceAnalytics;
import com.coinbase.repository.PriceAnalyticsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private PriceAnalyticsRepository repository;

    /**
     * Get the latest analytics record
     */
    @GetMapping("/latest")
    public ResponseEntity<?> getLatest(@RequestParam(defaultValue = "BTC-USD") String symbol) {
        PriceAnalytics latest = repository.findFirstBySymbolOrderByTimestampDesc(symbol);
        if (latest == null) {
            return ResponseEntity.ok(Map.of("message", "No data available"));
        }
        return ResponseEntity.ok(latest);
    }

    /**
     * Get recent analytics records
     */
    @GetMapping("/recent")
    public ResponseEntity<List<PriceAnalytics>> getRecent(
            @RequestParam(defaultValue = "BTC-USD") String symbol,
            @RequestParam(defaultValue = "30") int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<PriceAnalytics> recent = repository.findBySymbolOrderByTimestampDesc(symbol, pageable);
        return ResponseEntity.ok(recent);
    }

    /**
     * Get summary statistics
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(@RequestParam(defaultValue = "BTC-USD") String symbol) {
        PriceAnalytics latest = repository.findFirstBySymbolOrderByTimestampDesc(symbol);
        
        if (latest == null) {
            return ResponseEntity.ok(Map.of("message", "No data available"));
        }

        // Get last 10 records to calculate total updates and average price
        Pageable pageable = PageRequest.of(0, 10);
        List<PriceAnalytics> recentData = repository.findBySymbolOrderByTimestampDesc(symbol, pageable);
        
        // Calculate average price from recent data
        double avgPrice = recentData.stream()
                .filter(p -> p.getPrice() != null)
                .mapToDouble(PriceAnalytics::getPrice)
                .average()
                .orElse(latest.getPrice() != null ? latest.getPrice() : 0.0);
        
        // Total updates is the count of recent records
        int totalUpdates = recentData.size();

        Map<String, Object> summary = new HashMap<>();
        summary.put("avgPrice", avgPrice);
        summary.put("totalUpdates", totalUpdates);
        summary.put("lastUpdate", latest.getTimestamp());
        summary.put("timestamp", latest.getTimestampMillis());

        return ResponseEntity.ok(summary);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        long count = repository.count();
        return ResponseEntity.ok(Map.of(
            "status", "OK",
            "totalRecords", String.valueOf(count)
        ));
    }
}
