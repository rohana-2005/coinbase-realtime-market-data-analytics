package com.coinbase.repository;

import com.coinbase.model.PriceAnalytics;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import static org.junit.jupiter.api.Assertions.*;

@DataMongoTest
@ActiveProfiles("repository-test")
@ContextConfiguration(classes = PriceAnalyticsRepositoryTest.TestApplication.class)
class PriceAnalyticsRepositoryTest {

    @Configuration
    @Profile("repository-test")
    @EnableMongoRepositories(basePackageClasses = PriceAnalyticsRepository.class)
    static class TestApplication {
    }

    @Autowired
    private PriceAnalyticsRepository repository;

    @Test
    void testSaveAndFindLatestBySymbol() {

        PriceAnalytics data =
                new PriceAnalytics();

        data.setSymbol("BTC-USD");
        data.setPrice(65000.0);

        repository.save(data);

        PriceAnalytics latest =
                repository
                .findFirstBySymbolOrderByTimestampDesc(
                        "BTC-USD"
                );

        assertNotNull(latest);

        assertEquals(
                "BTC-USD",
                latest.getSymbol()
        );
    }
}
