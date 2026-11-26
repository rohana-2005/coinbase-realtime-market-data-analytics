# 🪙 Coinbase Real-Time Analytics Platform - Technical Architecture & Pipeline Documentation

## 📑 Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [End-to-End Technical Data Pipeline](#3-end-to-end-technical-data-pipeline)
4. [Component Deep Dives](#4-component-deep-dives)
   - [4.1 Backend Data Ingestion & Kafka Producer](#41-backend-data-ingestion--kafka-producer)
   - [4.2 Raw Data Consumer & Database Persistence](#42-raw-data-consumer--database-persistence)
   - [4.3 Apache Flink Stream Processing & Indicators](#43-apache-flink-stream-processing--indicators)
   - [4.4 REST API & Technical Signal Engine](#44-rest-api--technical-signal-engine)
   - [4.5 Frontend Real-Time Visualizer](#45-frontend-real-time-visualizer)
5. [Data Schemas & Transformations](#5-data-schemas--transformations)
6. [Deployment & Container Orchestration](#6-deployment--container-orchestration)
   - [6.1 Local Development (Docker Compose)](#61-local-development-docker-compose)
   - [6.2 Kubernetes Deployment (Minikube)](#62-kubernetes-deployment-minikube)
   - [6.3 CI/CD Pipeline](#63-cicd-pipeline)
7. [API Reference Directory](#7-api-reference-directory)

---

## 1. System Architecture Overview

The **Coinbase Real-Time Market Data & Analytics Platform** is an enterprise-grade microservices system designed for low-latency ingestion, stream processing, indicator calculation, and real-time visualization of cryptocurrency market data.

The system streams live ticker updates directly from the official Coinbase WebSocket API, publishes the data through Apache Kafka, processes tumbling windows with Apache Flink for financial indicators (EMA, RSI, Whale volume spikes), stores processed analytics in MongoDB, and exposes REST API endpoints for a React dashboard.

### Architecture Diagram

```mermaid
graph TB
    subgraph "External Data Source"
        CB[Coinbase WebSocket API<br/>wss://ws-feed.exchange.coinbase.com]
    end

    subgraph "Ingestion & Streaming Layer (Spring Boot & Kafka)"
        WS[Spring Boot WebSocket Client<br/>StandardWebSocketClient]
        KP[Kafka Producer<br/>KafkaTemplate]
        KB[Kafka Broker<br/>Topic: coinbase-market-data]
        ZK[Zookeeper<br/>Port 2181]
    end

    subgraph "Stream Processing Engine (Apache Flink)"
        FKS[Flink Kafka Source<br/>Group: coinbase-flink-indicators-group]
        TW[10s Tumbling Window<br/>AverageAggregate]
        SIP[Stateful Indicator Processor<br/>KeyedProcessFunction]
        MS[MongoSink<br/>BSON Document Collector]
    end

    subgraph "Storage Layer"
        MDB[(MongoDB 6<br/>DB: coinbase_analytics<br/>Coll: price_analytics)]
    end

    subgraph "API & Presentation Layer"
        KC[Backend Kafka Consumer<br/>Group: analytics-group]
        REST[Spring Boot REST Controller<br/>AnalyticsController]
        FE[React 19 + Vite Frontend<br/>Recharts + Lucide + Tailwind]
    end

    CB -->|WebSocket Ticker Stream| WS
    WS -->|Hand-off Payload| KP
    KP -->|Publish Raw JSON| KB
    KB -.->|Cluster Coordination| ZK

    KB -->|Consume Raw Stream| KC
    KC -->|Save Raw Ticker| MDB

    KB -->|Consume Real-Time Stream| FKS
    FKS -->|Parse JSON to PriceData| TW
    TW -->|AverageResult (10s window)| SIP
    SIP -->|Compute EMA, RSI, Whale Alerts| MS
    MS -->|Insert BSON Documents| MDB

    MDB -->|Query Aggregates & History| REST
    REST -->|REST JSON Endpoints| FE
    FE -->|Poll API every 5s| REST
```

---

## 2. Technology Stack

| Layer | Component / Tech | Version | Purpose & Description |
|-------|------------------|---------|-----------------------|
| **Ingestion Source** | Coinbase WebSocket | Feed API | Real-time market tick streams (`BTC-USD`, `ETH-USD`, `SOL-USD`, `DOGE-USD`) |
| **Backend Core** | Java | 17 | Core runtime for backend microservices and stream processor |
| **Framework** | Spring Boot | 3.2.0 | REST API layer, WebSocket execution, Spring Kafka |
| **Message Broker** | Apache Kafka | 3.x (Confluent/Bitnami) | Event streaming backbone (`coinbase-market-data` topic) |
| **Stream Engine** | Apache Flink | 1.18.0 | Stateful stream processing, tumbling windows, indicators |
| **Database** | MongoDB | 6.0 | Document store for raw ticks and aggregated indicator data |
| **Frontend UI** | React | 19.x | Declarative, component-based user interface |
| **Bundler & Tooling** | Vite | 6.x | High-speed frontend build tool and dev server |
| **Styling** | Tailwind CSS | 3.x | Utility-first responsive dark theme design |
| **Charts** | Recharts | 2.x | Data visualization (Line charts, Bar charts) |
| **Containerization** | Docker / Docker Compose | 24.x+ | Local multi-container infrastructure execution |
| **Orchestration** | Kubernetes (Minikube) | 1.30+ | Container orchestration with StatefulSets, Deployments, and NodePorts |

---

## 3. End-to-End Technical Data Pipeline

```
[Coinbase WS] ➔ [Spring Boot Client] ➔ [Kafka Producer] ➔ [Kafka Broker]
                                                             │
                              ┌──────────────────────────────┴──────────────────────────────┐
                              ▼                                                             ▼
                   [Spring Boot Consumer]                                          [Flink Stream Processor]
                              │                                                             │
                       (Raw Tick Insert)                                             (10s Tumbling Window)
                              │                                                             │
                              │                                                    (Stateful Indicators:
                              │                                                     EMA-14, RSI-14, Whale Spike)
                              │                                                             │
                              └──────────────────────────────┬──────────────────────────────┘
                                                             ▼
                                                    [MongoDB Storage]
                                                             │
                                                             ▼
                                                 [Spring REST Controller]
                                                  (Signal Logic: MA5/MA15)
                                                             │
                                                             ▼
                                                  [React Dashboard UI]
```

### Technical Execution Pipeline Sequence

1. **Connection & Subscription**:
   - On application startup, Spring Boot invokes `CoinbaseWebSocketClient.init()`.
   - Establishes an asynchronous WebSocket connection to `wss://ws-feed.exchange.coinbase.com`.
   - Sends subscription payload for the `ticker` channel across `BTC-USD`, `ETH-USD`, `SOL-USD`, and `DOGE-USD`.

2. **Ingestion & Broker Invalidation**:
   - Inbound WebSocket messages trigger `handleTextMessage`.
   - Payload string is passed to `MarketDataProducer.send(payload)`.
   - `KafkaTemplate` publishes raw JSON strings to the topic `coinbase-market-data`.

3. **Dual Consumption Pathways**:
   - **Pathway A (Raw Backup Ingestion)**: `MarketDataConsumer` listens on consumer group `analytics-group`, converts JSON tickers into `PriceAnalytics` entities, and persists raw ticker records into MongoDB.
   - **Pathway B (Stream Aggregation & Analytics)**: `CoinbaseFlinkJob` attaches a `KafkaSource` (group: `coinbase-flink-indicators-group`), listening to `coinbase-market-data`.

4. **Flink Processing Window & Indicators**:
   - **JSON Mapping**: Maps raw string to `PriceData` (symbol, price, timestamp).
   - **Keying**: Groups stream by `PriceData::getSymbol`.
   - **Tumbling Processing Window**: Collects ticks into 10-second tumbling windows (`TumblingProcessingTimeWindows.of(Time.seconds(10))`).
   - **Window Aggregation**: Computes average price (`sum / count`) and tick count (`count`).
   - **Stateful Processing (`IndicatorProcessFunction`)**:
     - *EMA-14*: Standard Exponential Moving Average updated using Flink `ValueState<Double>`.
     - *RSI-14*: Relative Strength Index derived from last 15 prices (14 intervals) stored in Flink `ListState<Double>`.
     - *Whale Volume Detection*: Monitors rolling 5-window tick count average stored in `ListState<Long>`. If current 10s count > 3.0× average, flags a `whale_alert`.
   - **Sink Execution**: Emits BSON `Document` to custom `MongoSink`, writing to MongoDB collection `price_analytics`.

5. **REST Serving & Technical Signal Generation**:
   - Spring Boot `AnalyticsController` exposes endpoints to fetch recent indicator records, aggregated hourly data, and trading signals.
   - `getTradingSignal` fetches 5-minute (last 30 records) and 15-minute (last 90 records) moving averages, computing crossover trend signals (`BUY`, `SELL`, `HOLD`).

6. **Visualization**:
   - The React frontend polls `/api/analytics/*` every 5 seconds.
   - Updates `StatCard` metrics, `PriceChart` line graphs, `CountChart` volume bars, trading signal banner, and `UpdatesTable` in real time.

---

## 4. Component Deep Dives

### 4.1 Backend Data Ingestion & Kafka Producer

- **File Link**: [CoinbaseWebSocketClient.java](file:///c:/Users/rohan/OneDrive/Desktop/Java%20Projects/Coinbase/coinbase-backend/src/main/java/com/coinbase/streaming/websocket/CoinbaseWebSocketClient.java)
- **Framework**: `org.springframework.web.socket.client.standard.StandardWebSocketClient`
- **Behavior**:
  - Annotated with `@Component` and `@Async`. Initializes on `@PostConstruct`.
  - Connects to `wss://ws-feed.exchange.coinbase.com`.
  - On open, sends JSON payload subscribing to ticker feed for `BTC-USD`, `ETH-USD`, `SOL-USD`, and `DOGE-USD`.
  - On message receipt, forwards raw payload to `MarketDataProducer`.

- **File Link**: [MarketDataProducer.java](file:///c:/Users/rohan/OneDrive/Desktop/Java%20Projects/Coinbase/coinbase-backend/src/main/java/com/coinbase/streaming/kafka/MarketDataProducer.java)
- **Uses**: `KafkaTemplate<String, String>`
- **Topic**: `coinbase-market-data`

### 4.2 Raw Data Consumer & Database Persistence

- **File Link**: [MarketDataConsumer.java](file:///c:/Users/rohan/OneDrive/Desktop/Java%20Projects/Coinbase/coinbase-backend/src/main/java/com/coinbase/streaming/kafka/MarketDataConsumer.java)
- **Annotation**: `@KafkaListener(topics = "coinbase-market-data", groupId = "analytics-group")`
- **Logic**: Filters JSON messages where `type == "ticker"`. Extracts fields (`product_id`, `price`, `volume_24h`, `high_24h`, `low_24h`, `best_bid`, `best_ask`, `time`) and saves to MongoDB repository `PriceAnalyticsRepository`.

### 4.3 Apache Flink Stream Processing & Indicators

- **File Link**: [CoinbaseFlinkJob.java](file:///c:/Users/rohan/OneDrive/Desktop/Java%20Projects/Coinbase/coinbase-flink/src/main/java/com/coinbase/flink/CoinbaseFlinkJob.java)

#### 1. Flink Pipeline Architecture
```java
DataStream<String> stream = env.fromSource(source, WatermarkStrategy.noWatermarks(), "Kafka Source");

DataStream<PriceData> priceStream = stream
    .map(json -> parseJsonToPriceData(json))
    .filter(Objects::nonNull);

DataStream<AverageResult> windowedStream = priceStream
    .keyBy(PriceData::getSymbol)
    .window(TumblingProcessingTimeWindows.of(Time.seconds(10)))
    .aggregate(new AverageAggregate());

windowedStream
    .keyBy(result -> result.symbol)
    .process(new IndicatorProcessFunction())
    .addSink(new MongoSink());
```

#### 2. Indicator Mathematical Formulas & Implementation

- **Exponential Moving Average (EMA-14)**:
  $$\text{Multiplier} = \frac{2}{\text{Period} + 1} = \frac{2}{14 + 1} \approx 0.1333$$
  $$\text{EMA}_{\text{current}} = (\text{Price}_{\text{current}} - \text{EMA}_{\text{previous}}) \times \text{Multiplier} + \text{EMA}_{\text{previous}}$$
  *(Seeded with current price on first observation).*

- **Relative Strength Index (RSI-14)**:
  $$\text{RS} = \frac{\text{Average Gain}}{\text{Average Loss}}$$
  $$\text{RSI} = 100 - \frac{100}{1 + \text{RS}}$$
  Maintains a lookback of 15 prices (14 price change intervals). Calculates average gain and loss over positive and negative price differences.

- **Whale Volume Spike Detection**:
  Maintains rolling history of trade counts over the last 5 windows (50 seconds).
  $$\text{Whale Alert} = \begin{cases} \text{true} & \text{if } \text{Count}_{\text{current}} > 3.0 \times \text{Avg}(\text{Count}_{\text{history}}) \\ \text{false} & \text{otherwise} \end{cases}$$

#### 3. Custom MongoDB Sink
- **File Link**: [MongoSink.java](file:///c:/Users/rohan/OneDrive/Desktop/Java%20Projects/Coinbase/coinbase-flink/src/main/java/com/coinbase/flink/sink/MongoSink.java)
- Opens direct `MongoClient` connection to `mongodb://localhost:27017`.
- Writes BSON documents directly into target collection `price_analytics` inside database `coinbase_analytics`.

### 4.4 REST API & Technical Signal Engine

- **File Link**: [AnalyticsController.java](file:///c:/Users/rohan/OneDrive/Desktop/Java%20Projects/Coinbase/coinbase-backend/src/main/java/com/coinbase/controller/AnalyticsController.java)

#### Signal Crossover Algorithm (`GET /api/analytics/signal`)
1. Fetches last 30 records (representing ~5 minutes of 10s windowed data) and last 90 records (~15 minutes of data).
2. Calculates $MA_{5min} = \text{Average}(\text{Price}_{30})$ and $MA_{15min} = \text{Average}(\text{Price}_{90})$.
3. Evaluates Signal Rules:
   - **BUY**: $\text{Current Price} > MA_{5min} \text{ AND } MA_{5min} > MA_{15min}$ (Uptrend confirmation).
   - **SELL**: $\text{Current Price} < MA_{5min} \text{ AND } MA_{5min} < MA_{15min}$ (Downtrend confirmation).
   - **HOLD**: Price fluctuates between moving averages or insufficient data history (< 30 records).

### 4.5 Frontend Real-Time Visualizer

- **File Link**: [Dashboard.jsx](file:///c:/Users/rohan/OneDrive/Desktop/Java%20Projects/Coinbase/coinbase-frontend/src/pages/Dashboard.jsx)
- Built with React 19, Tailwind CSS, Lucide Icons, and Recharts.
- Uses `setInterval` polling every 5000ms executing concurrent `Promise.all` API queries.
- Components:
  - `Trading Signal Card`: Dynamic color gradient (Green for BUY, Red for SELL, Amber for HOLD) displaying confidence levels and MA metrics.
  - `StatCard`: Visualizes key metrics like Average Price, 10s Updates Count, and Last Update Timestamp.
  - `PriceChart`: Interactive line graph displaying real-time 10-second price ticks.
  - `CountChart`: Bar graph showcasing update density grouped in 5-minute intervals over the past hour.
  - `UpdatesTable`: Data table displaying recent ticks with price change indicators (↗️ up / ↘️ down).

---

## 5. Data Schemas & Transformations

### Raw Coinbase Ticker Schema (JSON)
```json
{
  "type": "ticker",
  "sequence": 984512347,
  "product_id": "BTC-USD",
  "price": "90046.15",
  "open_24h": "88500.00",
  "volume_24h": "12450.45",
  "low_24h": "88100.00",
  "high_24h": "91200.00",
  "best_bid": "90046.10",
  "best_ask": "90046.20",
  "side": "buy",
  "time": "2026-01-03T10:15:00.000000Z"
}
```

### Processed Analytics MongoDB Document (`price_analytics` Collection)
```json
{
  "_id": { "$oid": "6777b7891234567890abcdef" },
  "symbol": "BTC-USD",
  "avg_price": 90046.15,
  "count": 13978,
  "window_seconds": 10,
  "timestamp": "2026-01-03T10:15:00Z",
  "timestamp_ms": 1735902900000,
  "ema": 90050.25,
  "rsi": 45.5,
  "whale_alert": true,
  "whale_reason": "4x volume spike (13978 vs avg 3450)"
}
```

---

## 6. Deployment & Container Orchestration

### 6.1 Local Development (Docker Compose)

The local docker orchestration file is located at `coinbase-docker/docker-compose.yml`.

- **Services**:
  - `zookeeper`: Port `2181` (Kafka cluster state management)
  - `kafka`: Port `9092` (Bootstrap server for message streaming)
  - `mongodb`: Port `27017` (Database instance)

### 6.2 Kubernetes Deployment (Minikube)

All Kubernetes manifests reside in the `k8s/` directory.

| Component | Manifest File | Resource Type | Port Mapping |
|-----------|---------------|---------------|--------------|
| Namespace | `k8s/namespace.yaml` | Namespace | `coinbase` |
| MongoDB | `k8s/mongodb-statefulset.yaml`, `mongodb-service.yaml` | StatefulSet + Service | `27017` |
| Zookeeper | `k8s/zookeeper-deployment.yaml`, `zookeeper-service.yaml` | Deployment + Service | `2181` |
| Kafka | `k8s/kafka-deployment.yaml`, `kafka-service.yaml` | Deployment + Service | `9092` |
| Backend | `k8s/backend-deployment.yaml`, `backend-service.yaml`, `backend-configmap.yaml` | Deployment + Service + ConfigMap | NodePort `30080` (Internal `8080`) |
| Frontend | `k8s/frontend-deployment.yaml`, `frontend-service.yaml` | Deployment + Service | NodePort `30090` (Internal `80`) |
| Flink JobManager | `k8s/flink-jobmanager-deployment.yaml`, `flink-jobmanager-service.yaml` | Deployment + Service | NodePort `30081` (Internal `8081`) |
| Flink TaskManager | `k8s/flink-taskmanager-deployment.yaml` | Deployment | Dynamic Worker |

### 6.3 CI/CD Pipeline

The repository includes an automated GitHub Actions workflow (`.github/workflows/build.yml`) that triggers on push/pull request to main branches:
- **Java Build & Test Step**: Uses JDK 17, executes `mvn clean test` for backend and Flink projects.
- **Frontend Build Step**: Uses Node.js 18, executes `npm install` and `npm run build`.

---

## 7. API Reference Directory

Base URL: `http://localhost:8080/api/analytics` (Development) or `/api/analytics` (Kubernetes/Production Nginx)

| Endpoint | Method | Query Parameters | Description |
|----------|--------|------------------|-------------|
| `/latest` | GET | `symbol` (default: `BTC-USD`) | Returns the most recent analytics record |
| `/recent` | GET | `symbol`, `limit` (default: `30`) | Returns array of recent 10-second indicator records |
| `/hourly` | GET | `symbol`, `hours` (default: `24`) | Returns 5-minute aggregated bucket records for chart plotting |
| `/summary` | GET | `symbol` | Calculates average price and update counts from recent 10 records |
| `/signal` | GET | `symbol` | Generates moving average crossover trading signal (`BUY`, `SELL`, `HOLD`) |
| `/health` | GET | None | System health check returning overall database record count |

---
*Documentation compiled automatically for rohana-2005/coinbase-realtime-market-data-analytics.*
