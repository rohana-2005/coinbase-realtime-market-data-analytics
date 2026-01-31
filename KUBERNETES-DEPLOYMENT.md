# 🚀 Coinbase Kubernetes Deployment Guide

## ✅ Step 1: Start Minikube

```powershell
minikube start --driver=docker --memory=4096 --cpus=4
```

## ✅ Step 2: Use Minikube's Docker Daemon

**IMPORTANT:** Run this in your terminal (makes Docker build inside Minikube):

```powershell
minikube docker-env --shell powershell | Invoke-Expression
```

## ✅ Step 3: Build Docker Images

```powershell
# Build Backend
cd coinbase-backend
docker build -t coinbase-backend:latest .

# Build Frontend
cd ../coinbase-frontend
docker build -t coinbase-frontend:latest .

cd ..
```

## ✅ Step 4: Deploy to Kubernetes (IN THIS ORDER)

```powershell
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Deploy base infrastructure (MongoDB, Kafka, Zookeeper)
kubectl apply -f k8s/mongodb-statefulset.yaml
kubectl apply -f k8s/mongodb-service.yaml
kubectl apply -f k8s/zookeeper-deployment.yaml
kubectl apply -f k8s/zookeeper-service.yaml
kubectl apply -f k8s/kafka-deployment.yaml
kubectl apply -f k8s/kafka-service.yaml

# Wait for base services to be ready (wait 30-60 seconds)
kubectl get pods -n coinbase -w

# 3. Deploy Backend
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# 4. Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# 5. Deploy Flink (optional for stream processing)
kubectl apply -f k8s/flink-jobmanager-deployment.yaml
kubectl apply -f k8s/flink-jobmanager-service.yaml
kubectl apply -f k8s/flink-taskmanager-deployment.yaml
```

## ✅ Step 5: Check Status

```powershell
kubectl get pods -n coinbase
kubectl get svc -n coinbase
```

## ✅ Step 6: Access the Application

```powershell
# Get Minikube IP
minikube ip

# Open Frontend in browser
minikube service frontend-service -n coinbase

# Access Flink UI
minikube service flink-jobmanager-service -n coinbase
```

## 🔍 Troubleshooting Commands

```powershell
# View logs
kubectl logs -n coinbase <pod-name>

# Describe pod
kubectl describe pod -n coinbase <pod-name>

# Restart deployment
kubectl rollout restart deployment <deployment-name> -n coinbase

# Delete everything and start over
kubectl delete namespace coinbase
```

## 🎯 Quick URLs

- **Frontend**: http://<minikube-ip>:30080
- **Backend API**: http://<minikube-ip>:30080/api
- **Flink UI**: http://<minikube-ip>:30081

## ⚠️ Important Notes

1. MongoDB takes ~30 seconds to start
2. Kafka needs Zookeeper running first
3. Backend needs MongoDB + Kafka ready
4. Frontend proxies API calls to backend
5. Images use `imagePullPolicy: Never` (local images only)
