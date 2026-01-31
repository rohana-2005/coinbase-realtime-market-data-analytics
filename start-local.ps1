# Start all services locally for development
Write-Host "Starting Coinbase Analytics Platform (Local Development)" -ForegroundColor Green

# Check if Docker is running
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "`nStarting infrastructure services (Kafka, MongoDB, Zookeeper)..." -ForegroundColor Cyan
Set-Location coinbase-docker
docker-compose up -d

Write-Host "`nWaiting for services to be ready (20 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Set-Location ..

Write-Host "`nInfrastructure is ready!" -ForegroundColor Green
Write-Host "`nTo start the backend:" -ForegroundColor Cyan
Write-Host "  1. Open a terminal in coinbase-backend/" -ForegroundColor White
Write-Host "  2. Run: ./mvnw spring-boot:run" -ForegroundColor White

Write-Host "`nTo start the frontend:" -ForegroundColor Cyan
Write-Host "  1. Open a terminal in coinbase-frontend/" -ForegroundColor White
Write-Host "  2. Run: npm install (first time only)" -ForegroundColor White
Write-Host "  3. Run: npm run dev" -ForegroundColor White

Write-Host "`nService URLs:" -ForegroundColor Magenta
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8080" -ForegroundColor White
Write-Host "  MongoDB:   mongodb://localhost:27017" -ForegroundColor White
Write-Host "  Kafka:     localhost:9092" -ForegroundColor White

Write-Host "`nTip: To stop infrastructure, run: cd coinbase-docker && docker-compose down" -ForegroundColor Yellow
