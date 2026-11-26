package com.coinbase.controller;

import com.coinbase.model.PriceAnalytics;
import com.coinbase.repository.PriceAnalyticsRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/copilot")
@CrossOrigin(origins = "*")
public class CopilotController {

    private static final List<String> SUPPORTED_SYMBOLS =
            List.of("BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD");

    private final PriceAnalyticsRepository repository;
    private final RestClient restClient = RestClient.create();

    @Value("${GEMINI_API_KEY:}")
    private String apiKey;

    @Value("${GEMINI_MODEL:gemini-3.5-flash-lite}")
    private String model;

    public CopilotController(PriceAnalyticsRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody ChatRequest request) {
        String question = request.message() == null ? "" : request.message().trim();
        if (question.length() > 400) {
            question = question.substring(0, 400);
        }
        String symbol = resolveSymbol(question, request.symbol());

        MarketSnapshot snapshot = snapshot(symbol);
        String fallback = demoAnswer(question, snapshot);
        String answer = fallback;
        String mode = "demo";

        if (apiKey != null && !apiKey.isBlank()) {
            try {
                answer = askGemini(question, snapshot);
                mode = "gemini";
            } catch (Exception exception) {
                answer = "Gemini could not answer right now. The live market data is available, but the AI request failed.";
                mode = "error";
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("answer", answer);
        response.put("symbol", symbol);
        response.put("mode", mode);
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    private String askGemini(String question, MarketSnapshot snapshot) {
        Map<String, Object> body = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text",
                        "You are CryptoLens, a concise crypto market data assistant. Use only the supplied live analytics. " +
                                "Never invent prices and never give financial advice. Reply in 2-4 short sentences."))),
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text",
                                "Live analytics: " + snapshot.context() + "\nUser question: " + question)))),
                "generationConfig", Map.of("temperature", 0.2, "maxOutputTokens", 180)
        );

        JsonNode result = restClient.post()
                .uri("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", model)
                .header("x-goog-api-key", apiKey)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        if (result == null) {
            throw new IllegalStateException("Empty AI response");
        }
        for (JsonNode candidate : result.path("candidates")) {
            for (JsonNode part : candidate.path("content").path("parts")) {
                String text = part.path("text").asText("");
                if (!text.isBlank()) return text;
            }
        }
        throw new IllegalStateException("No text in AI response");
    }

    private MarketSnapshot snapshot(String symbol) {
        List<PriceAnalytics> rows = repository.findBySymbolOrderByTimestampDesc(symbol, PageRequest.of(0, 30));
        if (rows.isEmpty()) return new MarketSnapshot(symbol, null, null, null, null, null, null, 0);

        PriceAnalytics latest = rows.get(0);
        PriceAnalytics indicator = repository.findFirstBySymbolAndRsiIsNotNullOrderByTimestampDesc(symbol);
        double latestPrice = priceOf(latest);
        double oldestPrice = priceOf(rows.get(rows.size() - 1));
        Double change = oldestPrice == 0 ? null : ((latestPrice - oldestPrice) / oldestPrice) * 100;
        double high = rows.stream().mapToDouble(this::priceOf).max().orElse(latestPrice);
        double low = rows.stream().mapToDouble(this::priceOf).min().orElse(latestPrice);
        return new MarketSnapshot(symbol, latestPrice, change, high, low,
                indicator == null ? null : indicator.getRsi(),
                indicator == null ? null : indicator.getEma(), rows.size());
    }

    private String demoAnswer(String question, MarketSnapshot s) {
        if (s.price() == null) return "I do not have enough live data for " + s.symbol() + " yet.";
        String q = question.toLowerCase(Locale.ROOT);
        String price = money(s.price(), s.symbol());
        String movement = s.change() == null ? "unavailable" : String.format(Locale.US, "%+.3f%%", s.change());

        if (q.contains("rsi")) {
            if (s.rsi() == null) return "RSI is still warming up for " + s.symbol() + ". It normally needs several windows of data.";
            String state = s.rsi() > 70 ? "overbought territory" : s.rsi() < 30 ? "oversold territory" : "the neutral range";
            return String.format(Locale.US, "%s RSI is %.1f, which is in %s. This is a momentum indicator, not a buy or sell instruction.", s.symbol(), s.rsi(), state);
        }
        if (q.contains("ema") || q.contains("trend") || q.contains("signal") || q.contains("why")) {
            if (s.ema() == null) return s.symbol() + " is trading at " + price + ", but EMA is still warming up.";
            String relation = s.price() >= s.ema() ? "above" : "below";
            return String.format(Locale.US, "%s is at %s, %s its EMA of %s. Its recent movement is %s, suggesting %s short-term momentum.",
                    s.symbol(), price, relation, money(s.ema(), s.symbol()), movement,
                    s.price() >= s.ema() ? "positive" : "negative");
        }
        if (q.contains("high") || q.contains("low") || q.contains("range")) {
            return String.format("Across the latest %d windows, %s ranged from %s to %s. The latest value is %s.",
                    s.points(), s.symbol(), money(s.low(), s.symbol()), money(s.high(), s.symbol()), price);
        }
        return String.format("%s is currently %s, with a recent move of %s. The observed range is %s–%s across %d live windows.",
                s.symbol(), price, movement, money(s.low(), s.symbol()), money(s.high(), s.symbol()), s.points());
    }

    private double priceOf(PriceAnalytics row) {
        if (row.getAvgPrice() != null) return row.getAvgPrice();
        return row.getPrice() == null ? 0 : row.getPrice();
    }

    private String money(Double value, String symbol) {
        if (value == null) return "unavailable";
        int decimals = "DOGE-USD".equals(symbol) ? 4 : 2;
        return String.format(Locale.US, "$%,." + decimals + "f", value);
    }

    private String normaliseSymbol(String symbol) {
        String candidate = symbol == null ? "BTC-USD" : symbol.toUpperCase(Locale.ROOT);
        return SUPPORTED_SYMBOLS.contains(candidate) ? candidate : "BTC-USD";
    }

    private String resolveSymbol(String question, String selectedSymbol) {
        String q = question.toLowerCase(Locale.ROOT);
        if (q.matches(".*\\b(bitcoin|btc)\\b.*")) return "BTC-USD";
        if (q.matches(".*\\b(ethereum|eth)\\b.*")) return "ETH-USD";
        if (q.matches(".*\\b(solana|sol)\\b.*")) return "SOL-USD";
        if (q.matches(".*\\b(dogecoin|doge)\\b.*")) return "DOGE-USD";
        return normaliseSymbol(selectedSymbol);
    }

    public record ChatRequest(String message, String symbol) {}

    private record MarketSnapshot(String symbol, Double price, Double change, Double high,
                                  Double low, Double rsi, Double ema, int points) {
        String context() {
            return "symbol=" + symbol + ", price=" + price + ", changePercent=" + change +
                    ", high=" + high + ", low=" + low + ", rsi=" + rsi + ", ema=" + ema +
                    ", windows=" + points;
        }
    }
}
