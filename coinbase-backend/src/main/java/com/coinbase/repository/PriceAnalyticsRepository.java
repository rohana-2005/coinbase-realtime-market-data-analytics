package com.coinbase.repository;

import com.coinbase.model.PriceAnalytics;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PriceAnalyticsRepository extends MongoRepository<PriceAnalytics, String> {
    
    // Find by symbol, ordered by timestamp descending
    List<PriceAnalytics> findBySymbolOrderByTimestampDesc(String symbol, Pageable pageable);
    
    // Find the latest record by symbol
    PriceAnalytics findFirstBySymbolOrderByTimestampDesc(String symbol);
    
    // Find all ordered by timestamp descending
    List<PriceAnalytics> findAllByOrderByTimestampDesc(Pageable pageable);
    
    // Find recent records by symbol (no time filter, just get recent)
    @Query("{ 'symbol': ?0 }")
    List<PriceAnalytics> findRecentBySymbol(String symbol);
}
