#!/bin/bash

echo "🚀 Starting Kubernetes Control Panel..."
echo "======================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    echo "Please install kubectl and configure it to connect to your cluster"
    exit 1
fi

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ kubectl is not configured or cannot connect to cluster"
    echo "Please configure kubectl to connect to your Kubernetes cluster"
    exit 1
fi

echo "✅ kubectl is configured and connected"

# Check current context
CONTEXT=$(kubectl config current-context)
echo "📊 Current context: $CONTEXT"

echo ""
echo "Starting the application..."
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start both frontend and backend
npm run dev