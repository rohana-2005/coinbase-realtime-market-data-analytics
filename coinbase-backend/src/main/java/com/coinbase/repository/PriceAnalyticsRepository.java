package com.coinbase.repository;

import com.coinbase.model.PriceAnalytics;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PriceAnalyticsRepository extends MongoRepository<PriceAnalytics, String> {

    List<PriceAnalytics> findBySymbolOrderByTimestampDesc(String symbol, Pageable pageable);

    PriceAnalytics findFirstBySymbolOrderByTimestampDesc(String symbol);

    List<PriceAnalytics> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("{ 'symbol': ?0 }")
    List<PriceAnalytics> findRecentBySymbol(String symbol);

    // For historical range queries — filter by symbol AND timestamp_ms range
    @Query("{ 'symbol': ?0, 'timestamp_ms': { $gte: ?1, $lte: ?2 } }")
    List<PriceAnalytics> findBySymbolAndTimestampMsBetween(String symbol, long start, long end);
}
