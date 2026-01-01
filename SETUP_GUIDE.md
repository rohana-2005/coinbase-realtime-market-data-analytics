# 🚀 Coinbase Real-Time Analytics Dashboard

A real-time cryptocurrency market analytics dashboard built with **React**, **Spring Boot**, **Apache Flink**, **Kafka**, and **MongoDB**.

## 📋 Features

- ✅ Real-time BTC-USD price analytics
- ✅ Live updates every 5 seconds
- ✅ Interactive charts (Line & Bar)
- ✅ Price trend indicators
- ✅ Responsive Tailwind CSS UI
- ✅ REST API with Spring Boot
- ✅ MongoDB data persistence
- ✅ Apache Flink stream processing

## 🏗️ Architecture

```
Coinbase WebSocket → Kafka → Apache Flink → MongoDB → Spring Boot API → React Dashboard
```

## 🛠️ Tech Stack

### Backend
- **Spring Boot 3.2.0** - REST API
- **Apache Flink** - Stream processing
- **Apache Kafka** - Message broker
- **MongoDB** - Data storage

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Charts
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📦 Prerequisites

1. **Java 17+**
2. **Node.js 18+**
3. **Maven 3.6+**
4. **Docker** (for Kafka, Zookeeper, MongoDB)

## 🚀 Quick Start

### 1️⃣ Start Infrastructure (Docker)

```bash
cd coinbase-docker
docker-compose up -d
```

This starts:
- Kafka (localhost:9092)
- Zookeeper (localhost:2181)
- MongoDB (localhost:27017)

### 2️⃣ Start Backend (Spring Boot)

```bash
cd coinbase-backend
mvn clean install
mvn spring-boot:run
```

API runs on: http://localhost:8080

### 3️⃣ Start Flink Job

```bash
cd coinbase-flink
mvn clean package
.\run-flink.bat
```

### 4️⃣ Start Frontend (React)

```bash
cd coinbase-frontend
npm install
npm run dev
```

Dashboard opens on: http://localhost:5173

## 🌐 API Endpoints

### Analytics API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/latest` | GET | Get latest analytics |
| `/api/analytics/recent?limit=30` | GET | Get recent records |
| `/api/analytics/summary` | GET | Get summary stats |
| `/api/analytics/health` | GET | Health check |

### Example Response

```json
{
  "id": "67744...",
  "symbol": "BTC-USD",
  "avgPrice": 88012.45,
  "count": 1345,
  "timestamp": 1735739520000,
  "formattedTime": "2026-01-01T13:32:00Z"
}
```

## 📁 Project Structure

```
Coinbase/
├── coinbase-backend/          # Spring Boot REST API
│   ├── src/main/java/
│   │   └── com/coinbase/
│   │       ├── model/         # Data models
│   │       ├── repository/    # MongoDB repos
│   │       ├── controller/    # REST controllers
│   │       ├── config/        # Config classes
│   │       └── streaming/     # WebSocket & Kafka
│   └── pom.xml
│
├── coinbase-flink/            # Apache Flink job
│   ├── src/main/java/
│   │   └── com/coinbase/flink/
│   │       ├── model/         # Data models
│   │       ├── sink/          # MongoDB sink
│   │       └── CoinbaseFlinkJob.java
│   └── pom.xml
│
├── coinbase-frontend/         # React dashboard
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Dashboard page
│   │   ├── services/          # API service
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── coinbase-docker/           # Docker Compose
    └── docker-compose.yml
```

## 🎨 UI Components

### StatCard
Displays key metrics (price, updates, timestamp)

### PriceChart (Line Chart)
Shows BTC-USD average price over time

### CountChart (Bar Chart)
Displays price update frequency

### UpdatesTable
Lists recent price updates with trends

## 🔄 Real-Time Updates

The dashboard uses **polling** to fetch data every 5 seconds:

```javascript
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);
}, []);
```

## 🎯 Data Flow

1. **WebSocket Client** connects to Coinbase
2. **Kafka Producer** publishes messages
3. **Flink Job** processes stream (10s windows)
4. **MongoDB** stores aggregated data
5. **Spring Boot API** serves data
6. **React Dashboard** polls and displays

## 🐛 Troubleshooting

### Frontend shows "Failed to fetch data"
- ✅ Ensure backend is running on port 8080
- ✅ Check CORS settings in WebConfig.java
- ✅ Verify MongoDB has data

### Backend connection refused
- ✅ Ensure MongoDB is running (docker ps)
- ✅ Check application.yml connection string
- ✅ Verify port 27017 is open

### Flink job not processing
- ✅ Ensure Kafka is running
- ✅ Check topic name matches
- ✅ Verify WebSocket client is sending data

## 📊 MongoDB Schema

Collection: `price_analytics`

```javascript
{
  "_id": ObjectId("..."),
  "symbol": "BTC-USD",
  "avgPrice": 88012.45,
  "count": 1345,
  "timestamp": 1735739520000,
  "formattedTime": "2026-01-01T13:32:00Z"
}
```

## 🔧 Configuration

### Backend (application.yml)
```yaml
server:
  port: 8080

spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/coinbase_analytics
  kafka:
    bootstrap-servers: localhost:9092
```

### Frontend (api.js)
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

## 🚢 Deployment

### Production Checklist
- [ ] Update API URLs
- [ ] Configure CORS properly
- [ ] Set up MongoDB authentication
- [ ] Enable Kafka SSL
- [ ] Build frontend: `npm run build`
- [ ] Package backend: `mvn package`

## 📝 License

MIT

## 👥 Contributors

Built with ❤️ by Rohan

---

**Happy Coding! 🎉**
