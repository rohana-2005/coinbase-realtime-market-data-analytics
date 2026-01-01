package com.coinbase.flink.sink;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.sink.RichSinkFunction;
import org.bson.Document;

import java.io.Serializable;

public class MongoSink extends RichSinkFunction<Document> implements Serializable {

    private static final long serialVersionUID = 1L;
    
    private transient MongoClient mongoClient;
    private transient MongoCollection<Document> collection;

    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        try {
            // Initialize MongoDB connection
            mongoClient = MongoClients.create("mongodb://localhost:27017");
            MongoDatabase database = mongoClient.getDatabase("coinbase_analytics");
            collection = database.getCollection("market_data");
            System.out.println("✅ MongoDB connection established (Task: " + getRuntimeContext().getTaskNameWithSubtasks() + ")");
        } catch (Exception e) {
            System.err.println("❌ Failed to connect to MongoDB: " + e.getMessage());
            throw e;
        }
    }

    @Override
    public void invoke(Document value, Context context) throws Exception {
        try {
            // Insert document into MongoDB
            collection.insertOne(value);
            System.out.println("💾 Saved to MongoDB: " + value.toJson());
        } catch (Exception e) {
            System.err.println("❌ Failed to save to MongoDB: " + e.getMessage());
            // Don't throw - just log and continue
        }
    }

    @Override
    public void close() throws Exception {
        super.close();
        if (mongoClient != null) {
            try {
                mongoClient.close();
                System.out.println("🔌 MongoDB connection closed (Task: " + getRuntimeContext().getTaskNameWithSubtasks() + ")");
            } catch (Exception e) {
                System.err.println("Warning: Error closing MongoDB connection: " + e.getMessage());
            }
        }
    }
}
