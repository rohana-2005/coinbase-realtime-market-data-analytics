package com.coinbase.streaming.websocket;

import com.coinbase.streaming.kafka.MarketDataProducer;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class CoinbaseWebSocketClient {

    private static final String COINBASE_WS_URL =
            "wss://ws-feed.exchange.coinbase.com";

    private final MarketDataProducer producer;

    public CoinbaseWebSocketClient(MarketDataProducer producer) {
        this.producer = producer;
    }

    @PostConstruct
    public void init() {
        System.out.println("🚀 Coinbase WebSocket Client initialized");
        connect();
    }

    @Async
    public void connect() {
        try {
            System.out.println("🔌 Connecting to Coinbase WebSocket...");

            StandardWebSocketClient client = new StandardWebSocketClient();

            client.execute(new TextWebSocketHandler() {

                @Override
                public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                    System.out.println("✅ Connected to Coinbase WebSocket");

                    String subscribeMessage = """
                    {
                      "type": "subscribe",
                      "channels": [
                        {
                          "name": "ticker",
                          "product_ids": ["BTC-USD"]
                        }
                      ]
                    }
                    """;

                    session.sendMessage(new TextMessage(subscribeMessage));
                    System.out.println("📨 Subscription sent");
                }

                @Override
                protected void handleTextMessage(WebSocketSession session, TextMessage message) {
                    String payload = message.getPayload();
                    System.out.println("📈 Coinbase Data: " + payload);
                    producer.send(payload);
                }

                @Override
                public void handleTransportError(WebSocketSession session, Throwable exception) {
                    System.err.println("❌ WebSocket error");
                    exception.printStackTrace();
                }

                @Override
                public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
                    System.out.println("❌ WebSocket closed: " + status);
                }

            }, COINBASE_WS_URL);

        } catch (Exception e) {
            System.err.println("❌ Connection failed");
            e.printStackTrace();
        }
    }
}
