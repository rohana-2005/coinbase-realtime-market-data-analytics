# Local Development Setup

## Prerequisites
- Docker Desktop installed and running
- Java 17+ installed
- Node.js 18+ installed
- Maven installed (or use included mvnw)

## Quick Start

### 1. Start Infrastructure Services
Run the PowerShell script to start Kafka, MongoDB, and Zookeeper:
```powershell
.\start-local.ps1
```

Or manually:
```powershell
cd coinbase-docker
docker-compose up -d
cd ..
```

### 2. Start Backend
In a new terminal:
```powershell
cd coinbase-backend
.\mvnw spring-boot:run
```

The backend will:
- Connect to Coinbase WebSocket feed
- Receive real-time BTC-USD price data
- Send data to Kafka topic `coinbase-market-data`
- Consume from Kafka and save to MongoDB
- Expose REST API on http://localhost:8080

### 3. Start Frontend
In another terminal:
```powershell
cd coinbase-frontend
npm install  # First time only
npm run dev
```

Frontend will be available at http://localhost:5173

## Troubleshooting

### "Failed to fetch data" Error
This usually means:
1. **Infrastructure not running**: Run `docker-compose up -d` in coinbase-docker/
2. **Backend not started**: Start backend with `./mvnw spring-boot:run`
3. **No data in MongoDB yet**: Wait 10-20 seconds for data to flow through the system

### Check if services are running:
```powershell
# Check Docker containers
docker ps

# Should see: zookeeper, kafka, mongodb

# Check backend logs
# Look for:
# ✅ Connected to Coinbase WebSocket
# 📨 Subscription sent
# 📈 Coinbase Data: ...
# 📤 Sent to Kafka
# 💾 Saved to MongoDB: BTC-USD @ $...
```

### Verify MongoDB has data:
```powershell
docker exec -it mongodb mongosh
use coinbase_analytics
db.market_data.find().limit(5)
exit
```

### Data Flow
```
Coinbase WebSocket → Backend (Producer) → Kafka Topic → Backend (Consumer) → MongoDB → REST API → Frontend
```

## Stop Everything
```powershell
# Stop backend: Ctrl+C in backend terminal
# Stop frontend: Ctrl+C in frontend terminal
# Stop infrastructure:
cd coinbase-docker
docker-compose down
```

## Service Endpoints

| Service | URL |
|---------|-----|
| Frontend Dashboard | http://localhost:5173 |
| Backend API | http://localhost:8080/api/analytics |
| Health Check | http://localhost:8080/api/analytics/health |
| Latest Data | http://localhost:8080/api/analytics/latest |
| Recent Data | http://localhost:8080/api/analytics/recent?limit=30 |
| Summary | http://localhost:8080/api/analytics/summary |
| MongoDB | mongodb://localhost:27017 |
| Kafka | localhost:9092 |

## Development Tips

- Backend auto-reloads with Spring DevTools
- Frontend auto-reloads with Vite HMR
- Check backend console for real-time data flow
- MongoDB data persists between restarts
- Clear MongoDB data: `docker exec -it mongodb mongosh` → `use coinbase_analytics` → `db.market_data.drop()`
