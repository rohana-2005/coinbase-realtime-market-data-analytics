# Quick Deploy Script for Windows PowerShell
# Run this after Minikube is started

Write-Host "Starting Coinbase Kubernetes Deployment..." -ForegroundColor Green

# Step 1: Configure Docker to use Minikube
Write-Host "`nConfiguring Docker to use Minikube's daemon..." -ForegroundColor Yellow
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Step 2: Build Docker Images
Write-Host "`nBuilding Backend Docker Image..." -ForegroundColor Yellow
Set-Location coinbase-backend
docker build -t coinbase-backend:latest .

Write-Host "`nBuilding Frontend Docker Image..." -ForegroundColor Yellow
Set-Location ..\coinbase-frontend
docker build -t coinbase-frontend:latest .
Set-Location ..

# Step 3: Create Namespace
Write-Host "`nCreating Kubernetes Namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/namespace.yaml

# Step 4: Deploy Base Infrastructure
Write-Host "`nDeploying MongoDB..." -ForegroundColor Yellow
kubectl apply -f k8s/mongodb-statefulset.yaml
kubectl apply -f k8s/mongodb-service.yaml

Write-Host "`nDeploying Zookeeper..." -ForegroundColor Yellow
kubectl apply -f k8s/zookeeper-deployment.yaml
kubectl apply -f k8s/zookeeper-service.yaml

Write-Host "`nDeploying Kafka..." -ForegroundColor Yellow
kubectl apply -f k8s/kafka-deployment.yaml
kubectl apply -f k8s/kafka-service.yaml

Write-Host "`nWaiting 30 seconds for base services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Step 5: Deploy Backend
Write-Host "`nDeploying Backend..." -ForegroundColor Yellow
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

Write-Host "`nWaiting 20 seconds for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 20

# Step 6: Deploy Frontend
Write-Host "`nDeploying Frontend..." -ForegroundColor Yellow
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Step 7: Deploy Flink
Write-Host "`nDeploying Flink..." -ForegroundColor Yellow
kubectl apply -f k8s/flink-jobmanager-deployment.yaml
kubectl apply -f k8s/flink-jobmanager-service.yaml
kubectl apply -f k8s/flink-taskmanager-deployment.yaml

# Step 8: Show Status
Write-Host "`nDeployment Complete! Checking Status..." -ForegroundColor Green
Write-Host "`nPods Status:" -ForegroundColor Cyan
kubectl get pods -n coinbase

Write-Host "`nServices:" -ForegroundColor Cyan
kubectl get svc -n coinbase

# Step 9: Get Access URLs
Write-Host "`nAccess Your Application:" -ForegroundColor Green
$minikubeIP = minikube ip
Write-Host "Frontend: http://${minikubeIP}:30080" -ForegroundColor White
Write-Host "Flink UI: http://${minikubeIP}:30081" -ForegroundColor White

Write-Host "`nTo open in browser, run:" -ForegroundColor Yellow
Write-Host "   minikube service frontend-service -n coinbase" -ForegroundColor White

Write-Host "`nTo view logs:" -ForegroundColor Yellow
Write-Host "   kubectl logs -n coinbase <pod-name>" -ForegroundColor White
