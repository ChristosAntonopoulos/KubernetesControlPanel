#!/bin/bash

# Kubernetes Control Panel Deployment Script
# This script deploys the Kubernetes Control Panel to your cluster

set -e

echo "🚀 Starting Kubernetes Control Panel deployment..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if we can connect to the cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Connected to Kubernetes cluster"

# Create namespace
echo "📁 Creating namespace..."
kubectl create namespace k8s-control-panel --dry-run=client -o yaml | kubectl apply -f -

# Apply RBAC
echo "🔐 Applying RBAC configuration..."
kubectl apply -f k8s/rbac.yaml

# Build and deploy the application
echo "🔨 Building and deploying application..."

# For local development, you can build the Docker image locally
# docker build -t k8s-control-panel:latest -f docker/Dockerfile .

# Apply Kubernetes manifests
echo "📋 Applying Kubernetes manifests..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/k8s-control-panel -n k8s-control-panel

# Get service information
echo "📊 Getting service information..."
kubectl get svc k8s-control-panel-service -n k8s-control-panel

# Get pod information
echo "📦 Getting pod information..."
kubectl get pods -n k8s-control-panel

# Check if the application is running
echo "🔍 Checking application health..."
kubectl port-forward svc/k8s-control-panel-service 8080:80 -n k8s-control-panel &
PORT_FORWARD_PID=$!

# Wait a moment for port-forward to establish
sleep 5

# Test the health endpoint
if curl -f http://localhost:8080/health &> /dev/null; then
    echo "✅ Application is healthy!"
    echo "🌐 Access the control panel at: http://localhost:8080"
else
    echo "❌ Application health check failed"
fi

# Kill port-forward
kill $PORT_FORWARD_PID

echo "🎉 Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Access the control panel at: http://localhost:8080"
echo "2. Use kubectl port-forward svc/k8s-control-panel-service 8080:80 -n k8s-control-panel"
echo "3. Check logs with: kubectl logs -f deployment/k8s-control-panel -n k8s-control-panel"
echo ""
echo "🔧 To uninstall:"
echo "kubectl delete namespace k8s-control-panel" 