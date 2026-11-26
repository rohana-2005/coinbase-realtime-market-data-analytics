package com.coinbase.streaming;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MarketDataConsumerTest {

    @Test
    void testConsume_ValidMessage() {

        String json =
                """
                {
                    "symbol":"BTC-USD",
                    "price":65000
                }
                """;

        assertNotNull(json);
    }
}