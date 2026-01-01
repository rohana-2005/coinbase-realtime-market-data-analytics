# Coinbase Real-Time Market Data Analytics

A distributed real-time data streaming and analytics platform for Coinbase market data using Spring Boot, Apache Kafka, Apache Flink, and MongoDB.

## 🏗️ Architecture

```
Coinbase WebSocket → Spring Boot → Kafka → Flink → MongoDB
                                         ↓
                                    Analytics & Processing
```

## 📦 Project Structure

```
Coinbase/
├── coinbase-backend/      # Spring Boot application (WebSocket → Kafka)
├── coinbase-flink/        # Apache Flink stream processing
├── coinbase-docker/       # Docker Compose infrastructure
└── coinbase-frontend/     # Frontend application (optional)
```

## 🚀 Technologies

- **Java 17**
- **Spring Boot 3.2.0** - Backend framework
- **Apache Kafka** - Message streaming
- **Apache Flink 1.18** - Stream processing
- **MongoDB** - Data persistence
- **Docker** - Containerization

## 🔧 Prerequisites

- Java 17+
- Maven 3.9+
- Docker & Docker Compose
- Git

## 📋 Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/coinbase-analytics.git
cd coinbase-analytics
```

### 2. Start Infrastructure (Kafka, MongoDB, Flink)

```bash
cd coinbase-docker
docker-compose up -d
```

This starts:
- Zookeeper (port 2181)
- Kafka (port 9092)
- MongoDB (port 27017)
- Flink JobManager (port 8081)
- Flink TaskManager

### 3. Run Spring Boot Backend

```bash
cd coinbase-backend
mvn clean install
mvn spring-boot:run
```

The backend will:
- Connect to Coinbase WebSocket
- Subscribe to BTC-USD market data
- Stream data to Kafka topic: `coinbase-market-data`

### 4. Run Flink Processing Job

```bash
cd coinbase-flink
mvn clean package
mvn exec:java -Dexec.mainClass="com.coinbase.flink.CoinbaseFlinkJob"
```

Or run directly from IDE:
- Open `CoinbaseFlinkJob.java`
- Right-click → Run As → Java Application

## 🎯 Features

- ✅ Real-time WebSocket connection to Coinbase
- ✅ BTC-USD market data streaming
- ✅ Kafka message broker integration
- ✅ Apache Flink stream processing
- ✅ MongoDB data persistence (configured)
- 🔄 Scalable microservices architecture

## 📊 Monitoring

- **Flink Dashboard**: http://localhost:8081
- **Spring Boot**: http://localhost:8080
- **MongoDB**: mongodb://localhost:27017/coinbase_analytics

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| Zookeeper | 2181 | Kafka coordination |
| Kafka | 9092 | Message streaming |
| MongoDB | 27017 | Database |
| Flink JobManager | 8081 | Stream processing UI |

## 🛠️ Development

### Build All Projects

```bash
# Backend
cd coinbase-backend
mvn clean install

# Flink
cd coinbase-flink
mvn clean package
```

### Stop Infrastructure

```bash
cd coinbase-docker
docker-compose down
```

## 📝 Configuration

### Backend (application.yml)
```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
  data:
    mongodb:
      uri: mongodb://localhost:27017/coinbase_analytics
```

### Flink
- Kafka topic: `coinbase-market-data`
- Consumer group: `coinbase-flink-group`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Your Name - [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- Coinbase Pro WebSocket API
- Apache Kafka
- Apache Flink
- Spring Boot
