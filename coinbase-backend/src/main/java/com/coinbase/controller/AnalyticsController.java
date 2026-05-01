package com.coinbase.controller;

import com.coinbase.model.PriceAnalytics;
import com.coinbase.repository.PriceAnalyticsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
     * Get 5-minute aggregated data from MongoDB
     */
    @GetMapping("/hourly")
    public ResponseEntity<List<Map<String, Object>>> getHourlyData(
            @RequestParam(defaultValue = "BTC-USD") String symbol,
            @RequestParam(defaultValue = "24") int hours) {
        
        // Get recent records - fetch more to have enough data
        // For 5-minute intervals: 1 hour = 60 records (if we have data every 10s, 6 per minute * 5 = 30 per 5-min window)
        int limit = Math.max(360, hours * 60); // At least 360 records, or hours * 60 for longer periods
        Pageable pageable = PageRequest.of(0, limit);
        List<PriceAnalytics> allData = repository.findBySymbolOrderByTimestampDesc(symbol, pageable);
        
        if (allData.isEmpty()) {
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }
        
        // Group by 5-minute intervals and aggregate
        Map<Long, List<PriceAnalytics>> fiveMinGroups = new java.util.LinkedHashMap<>();
        
        for (PriceAnalytics record : allData) {
            try {
                long timestamp = record.getTimestampMillis();
                // Round down to the nearest 5-minute interval (5 minutes = 5 * 60 * 1000 ms)
                long fiveMinKey = (timestamp / (5 * 60 * 1000)) * (5 * 60 * 1000);
                
                fiveMinGroups.computeIfAbsent(fiveMinKey, k -> new java.util.ArrayList<>()).add(record);
            } catch (Exception e) {
                // Skip records with invalid timestamps
                continue;
            }
        }
        
        // Create aggregated response
        List<Map<String, Object>> fiveMinData = new java.util.ArrayList<>();
        
        for (Map.Entry<Long, List<PriceAnalytics>> entry : fiveMinGroups.entrySet()) {
            List<PriceAnalytics> intervalRecords = entry.getValue();
            
            double avgPrice = intervalRecords.stream()
                .filter(p -> p.getPrice() != null)
                .mapToDouble(PriceAnalytics::getPrice)
                .average()
                .orElse(0.0);
            
            int totalCount = intervalRecords.stream()
                .mapToInt(p -> p.getCount() != null ? p.getCount() : 0)
                .sum();
            
            Map<String, Object> intervalData = new HashMap<>();
            intervalData.put("timestamp", entry.getKey());
            intervalData.put("avgPrice", Math.round(avgPrice * 100.0) / 100.0);
            intervalData.put("count", totalCount);
            intervalData.put("records", intervalRecords.size());
            
            fiveMinData.add(intervalData);
        }
        
        // Sort by timestamp ascending
        fiveMinData.sort((a, b) -> Long.compare((Long)a.get("timestamp"), (Long)b.get("timestamp")));
        
        return ResponseEntity.ok(fiveMinData);
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
        
        // Total updates is the sum of all count fields from recent records
        int totalUpdates = recentData.stream()
                .mapToInt(p -> p.getCount() != null ? p.getCount() : 0)
                .sum();

        Map<String, Object> summary = new HashMap<>();
        summary.put("avgPrice", avgPrice);
        summary.put("totalUpdates", totalUpdates);
        summary.put("lastUpdate", latest.getTimestamp());
        summary.put("timestamp", latest.getTimestampMillis());

        return ResponseEntity.ok(summary);
    }

    /**
     * Get trading signal (BUY/SELL/HOLD)
     */
    @GetMapping("/signal")
    public ResponseEntity<Map<String, Object>> getTradingSignal(@RequestParam(defaultValue = "BTC-USD") String symbol) {
        // Get last 30 records (5 minutes of data at 10-sec intervals)
        Pageable pageable30 = PageRequest.of(0, 30);
        List<PriceAnalytics> recent30 = repository.findBySymbolOrderByTimestampDesc(symbol, pageable30);
        
        if (recent30.size() < 30) {
            return ResponseEntity.ok(Map.of(
                "signal", "HOLD",
                "reason", "Insufficient data for analysis",
                "confidence", "Low"
            ));
        }
        
        // Calculate 5-min moving average (last 30 records)
        double shortMA = recent30.stream()
                .filter(p -> p.getPrice() != null)
                .mapToDouble(PriceAnalytics::getPrice)
                .average()
                .orElse(0.0);
        
        // Get last 90 records for 15-min moving average
        Pageable pageable90 = PageRequest.of(0, 90);
        List<PriceAnalytics> recent90 = repository.findBySymbolOrderByTimestampDesc(symbol, pageable90);
        
        double longMA = recent90.stream()
                .filter(p -> p.getPrice() != null)
                .mapToDouble(PriceAnalytics::getPrice)
                .average()
                .orElse(shortMA);
        
        double currentPrice = recent30.get(0).getPrice() != null ? recent30.get(0).getPrice() : 0.0;
        
        String signal;
        String reason;
        String confidence;
        
        // Trading logic based on moving average crossover
        if (currentPrice > shortMA && shortMA > longMA) {
            signal = "BUY";
            reason = "Price trending upward (above both moving averages)";
            confidence = "Medium";
        } else if (currentPrice < shortMA && shortMA < longMA) {
            signal = "SELL";
            reason = "Price trending downward (below both moving averages)";
            confidence = "Medium";
        } else if (currentPrice > shortMA) {
            signal = "HOLD";
            reason = "Short-term momentum positive, waiting for confirmation";
            confidence = "Low";
        } else {
            signal = "HOLD";
            reason = "No clear trend detected";
            confidence = "Low";
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("signal", signal);
        response.put("reason", reason);
        response.put("confidence", confidence);
        response.put("currentPrice", currentPrice);
        response.put("ma5min", Math.round(shortMA * 100.0) / 100.0);
        response.put("ma15min", Math.round(longMA * 100.0) / 100.0);
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
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

    // ─────────────────────────────────────────────────────────────────────────
    // Historical chart data — auto-selects bucket size based on range duration
    // GET /api/analytics/historical?symbol=BTC-USD&start=<epochMs>&end=<epochMs>
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/historical")
    public ResponseEntity<List<Map<String, Object>>> getHistorical(
            @RequestParam(defaultValue = "BTC-USD") String symbol,
            @RequestParam long start,
            @RequestParam long end) {

        List<PriceAnalytics> raw = repository.findBySymbolAndTimestampMsBetween(symbol, start, end);

        if (raw.isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        // Sort ascending
        raw.sort(Comparator.comparingLong(PriceAnalytics::getTimestampMillis));

        // Choose bucket size based on range length
        long rangeMs  = end - start;
        long oneHour  = 3_600_000L;
        long oneDay   = 86_400_000L;
        long oneWeek  = 7 * oneDay;
        long oneMonth = 30L * oneDay;

        long bucketMs;
        if      (rangeMs <= oneHour)   bucketMs = 60_000L;         // 1-min buckets for ≤1H
        else if (rangeMs <= oneDay)    bucketMs = 15 * 60_000L;    // 15-min for ≤1D
        else if (rangeMs <= oneWeek)   bucketMs = 60 * 60_000L;    // 1-hr  for ≤7D
        else if (rangeMs <= oneMonth)  bucketMs = 4 * 60 * 60_000L;// 4-hr  for ≤1M
        else                           bucketMs = 24 * 60 * 60_000L;// 1-day for >1M

        // Group records into time buckets
        Map<Long, List<PriceAnalytics>> buckets = new LinkedHashMap<>();
        for (PriceAnalytics r : raw) {
            long key = (r.getTimestampMillis() / bucketMs) * bucketMs;
            buckets.computeIfAbsent(key, k -> new ArrayList<>()).add(r);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<Long, List<PriceAnalytics>> entry : buckets.entrySet()) {
            List<PriceAnalytics> group = entry.getValue();

            double avg = group.stream()
                    .filter(p -> p.getAvgPrice() != null)
                    .mapToDouble(PriceAnalytics::getAvgPrice)
                    .average().orElse(0.0);

            double ema = group.stream()
                    .filter(p -> p.getEma() != null)
                    .mapToDouble(PriceAnalytics::getEma)
                    .average().orElse(0.0);

            int count = group.stream()
                    .mapToInt(p -> p.getCount() != null ? p.getCount() : 0).sum();

            Map<String, Object> point = new HashMap<>();
            point.put("timestamp", entry.getKey());
            point.put("avgPrice",  Math.round(avg  * 100.0) / 100.0);
            point.put("ema",       Math.round(ema  * 100.0) / 100.0);
            point.put("count",     count);
            result.add(point);
        }

        result.sort((a, b) -> Long.compare((Long) a.get("timestamp"), (Long) b.get("timestamp")));
        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Range summary — OHLC + volume + volatility for any start→end window
    // GET /api/analytics/range-summary?symbol=BTC-USD&start=<epochMs>&end=<epochMs>
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/range-summary")
    public ResponseEntity<Map<String, Object>> getRangeSummary(
            @RequestParam(defaultValue = "BTC-USD") String symbol,
            @RequestParam long start,
            @RequestParam long end) {

        List<PriceAnalytics> raw = repository.findBySymbolAndTimestampMsBetween(symbol, start, end);

        if (raw.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No data in selected range"));
        }

        raw.sort(Comparator.comparingLong(PriceAnalytics::getTimestampMillis));

        List<Double> prices = raw.stream()
                .map(p -> p.getAvgPrice() != null ? p.getAvgPrice() : p.getPrice())
                .filter(p -> p != null && p > 0)
                .toList();

        double open  = prices.get(0);
        double close = prices.get(prices.size() - 1);
        double high  = prices.stream().mapToDouble(d -> d).max().orElse(open);
        double low   = prices.stream().mapToDouble(d -> d).min().orElse(open);
        long   totalTrades = raw.stream().mapToLong(p -> p.getCount() != null ? p.getCount() : 0).sum();
        double volatility  = high > 0 ? ((high - low) / high) * 100.0 : 0.0;
        double change      = open > 0 ? ((close - open) / open) * 100.0 : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("open",        Math.round(open       * 100.0) / 100.0);
        summary.put("close",       Math.round(close      * 100.0) / 100.0);
        summary.put("high",        Math.round(high       * 100.0) / 100.0);
        summary.put("low",         Math.round(low        * 100.0) / 100.0);
        summary.put("totalTrades", totalTrades);
        summary.put("volatility",  Math.round(volatility * 100.0) / 100.0);
        summary.put("change",      Math.round(change     * 100.0) / 100.0);
        summary.put("dataPoints",  raw.size());
        summary.put("start",       start);
        summary.put("end",         end);

        return ResponseEntity.ok(summary);
    }
}

