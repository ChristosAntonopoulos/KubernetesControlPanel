# Kubernetes Control Panel - Ubuntu Server Deployment Guide

## 🎯 Overview

This guide explains how to deploy the Kubernetes Control Panel to your Ubuntu server using Azure DevOps pipeline with local Docker image building.

## 🏗️ Architecture

```
Azure DevOps Agent (Local) → Build Docker Image → Deploy to Ubuntu Server Kubernetes
```

### Key Components:
- **Azure DevOps Agent**: Builds the application and Docker image locally
- **Docker Image**: `k8s-control-panel:latest` built on the agent
- **Ubuntu Server**: Runs Kubernetes cluster
- **Kubernetes Resources**: Deployed via YAML files in `k8s/` directory

## 📋 Prerequisites

### Ubuntu Server Requirements:
- [ ] Kubernetes cluster running (kubeadm, minikube, or cloud provider)
- [ ] kubectl configured and accessible
- [ ] Docker daemon running
- [ ] Network connectivity between agent and server

### Azure DevOps Agent Requirements:
- [ ] .NET 8.0 SDK
- [ ] Node.js 18+ and npm
- [ ] Docker CLI
- [ ] kubectl configured to connect to Ubuntu server cluster

## 🔧 Configuration Steps

### 1. Configure kubectl on Azure DevOps Agent

The agent needs to connect to your Ubuntu server's Kubernetes cluster:

```bash
# On the Azure DevOps agent, configure kubectl to point to your Ubuntu server
kubectl config set-cluster ubuntu-cluster --server=https://YOUR_UBUNTU_SERVER_IP:6443
kubectl config set-credentials ubuntu-user --token=YOUR_SERVICE_ACCOUNT_TOKEN
kubectl config set-context ubuntu-context --cluster=ubuntu-cluster --user=ubuntu-user
kubectl config use-context ubuntu-context
```

### 2. Verify Connection

```bash
# Test connection to Ubuntu server cluster
kubectl cluster-info
kubectl get nodes
```

### 3. Docker Image Sharing

Since the agent builds the image locally, ensure your Ubuntu server can access it:

**Option A: Docker Registry (Recommended for Production)**
```bash
# Push to a registry that both agent and server can access
docker tag k8s-control-panel:latest your-registry/k8s-control-panel:latest
docker push your-registry/k8s-control-panel:latest
```

**Option B: Image Transfer (Development)**
```bash
# Save image on agent
docker save k8s-control-panel:latest > k8s-control-panel.tar

# Transfer to Ubuntu server
scp k8s-control-panel.tar user@ubuntu-server:/tmp/

# Load image on Ubuntu server
docker load < /tmp/k8s-control-panel.tar
```

## 🚀 Deployment Process

### 1. Pipeline Execution

When you commit changes, the Azure DevOps pipeline will:

1. **Build Stage**: Compile .NET and React applications
2. **Package Stage**: Build Docker image `k8s-control-panel:latest`
3. **Deploy Stage**: Apply Kubernetes manifests to Ubuntu server

### 2. Kubernetes Resources Applied

The pipeline applies these resources in order:

```bash
# 1. Create namespace
kubectl create namespace k8s-control-panel

# 2. Apply RBAC (Service Account, Roles, Role Bindings)
kubectl apply -f k8s/rbac.yaml

# 3. Apply core resources
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 3. Resource Details

#### **Namespace**: `k8s-control-panel`
- Isolated environment for the control panel

#### **Service Account**: `k8s-control-panel`
- Minimal RBAC permissions for cluster monitoring
- Can read pods, nodes, namespaces, events
- Can delete pods (for restart functionality)

#### **Deployment**: `k8s-control-panel`
- 1 replica (configurable)
- Resource limits: 512Mi memory, 500m CPU
- Health checks on `/health` endpoint
- Volume mount for logs

#### **Service**: `k8s-control-panel-service`
- NodePort type
- HTTP: Port 30080
- HTTPS: Port 30443

#### **Ingress**: `k8s-control-panel-ingress`
- Routes external traffic to the service
- Requires ingress controller on Ubuntu server

## 🌐 Access Points

### From Ubuntu Server:
```bash
# Get node IP
kubectl get nodes -o wide

# Access via NodePort
curl http://NODE_IP:30080/health
```

### From External Network:
```bash
# If ingress is configured
curl http://YOUR_DOMAIN_OR_IP/

# Direct NodePort access
curl http://UBUNTU_SERVER_IP:30080/
```

## 🔍 Verification Commands

### Check Deployment Status:
```bash
# Verify all resources
kubectl get all -n k8s-control-panel

# Check pod status
kubectl get pods -n k8s-control-panel

# Check service endpoints
kubectl get endpoints -n k8s-control-panel

# Check ingress
kubectl get ingress -n k8s-control-panel
```

### Check Application Health:
```bash
# Test health endpoint
kubectl exec -n k8s-control-panel deployment/k8s-control-panel -- curl -f http://localhost/health

# View application logs
kubectl logs -n k8s-control-panel -l app=k8s-control-panel

# Describe pod for troubleshooting
kubectl describe pod -n k8s-control-panel -l app=k8s-control-panel
```

### Verify RBAC:
```bash
# Test service account permissions
kubectl auth can-i get pods --as=system:serviceaccount:k8s-control-panel:k8s-control-panel -n k8s-control-panel
kubectl auth can-i get nodes --as=system:serviceaccount:k8s-control-panel:k8s-control-panel
```

## 🚨 Troubleshooting

### Common Issues:

#### **1. Image Pull Errors**
```bash
# Check if image exists on Ubuntu server
docker images | grep k8s-control-panel

# If missing, transfer image from agent
docker save k8s-control-panel:latest | ssh user@ubuntu-server 'docker load'
```

#### **2. Pod Startup Issues**
```bash
# Check pod events
kubectl describe pod -n k8s-control-panel -l app=k8s-control-panel

# Check application logs
kubectl logs -n k8s-control-panel -l app=k8s-control-panel

# Verify health endpoint
kubectl exec -n k8s-control-panel deployment/k8s-control-panel -- curl -f http://localhost/health
```

#### **3. RBAC Permission Errors**
```bash
# Check service account
kubectl get serviceaccount -n k8s-control-panel

# Verify role binding
kubectl get clusterrolebinding k8s-control-panel-binding

# Test permissions
kubectl auth can-i get pods --as=system:serviceaccount:k8s-control-panel:k8s-control-panel
```

#### **4. Network Connectivity**
```bash
# Check service endpoints
kubectl get endpoints -n k8s-control-panel

# Test service connectivity
kubectl run test-pod --image=busybox --rm -it --restart=Never -- wget -O- http://k8s-control-panel-service:80/health

# Check ingress controller
kubectl get pods -n ingress-nginx
```

## 🔄 Update Process

### Making Changes:

1. **Application Changes**: Modify code in `src/` directory
2. **Kubernetes Changes**: Update YAML files in `k8s/` directory
3. **Commit & Push**: Trigger Azure DevOps pipeline
4. **Automatic Deployment**: Pipeline builds and deploys to Ubuntu server

### Manual Updates (if needed):
```bash
# Update deployment with new image
kubectl set image deployment/k8s-control-panel k8s-control-panel-api=k8s-control-panel:latest -n k8s-control-panel

# Apply YAML changes
kubectl apply -f k8s/deployment.yaml

# Check rollout status
kubectl rollout status deployment/k8s-control-panel -n k8s-control-panel
```

## 📊 Monitoring

### Health Checks:
- **Liveness Probe**: `/health` endpoint every 10 seconds
- **Readiness Probe**: `/health` endpoint every 5 seconds
- **Resource Monitoring**: CPU and memory limits enforced

### Logging:
- Application logs available via `kubectl logs`
- Log volume mounted at `/app/logs`
- Structured logging with Serilog

### Metrics:
- Resource usage via Kubernetes metrics API
- Real-time updates via SignalR
- Dashboard metrics refresh every 30 seconds

## 🔐 Security Considerations

### RBAC Permissions:
- Minimal required permissions for monitoring
- No write access to cluster configuration
- Pod deletion limited to restart functionality

### Network Security:
- Service isolated in dedicated namespace
- Ingress with SSL/TLS support (configure as needed)
- Internal service communication only

### Resource Limits:
- Memory: 128Mi request, 512Mi limit
- CPU: 100m request, 500m limit
- Prevents resource exhaustion

## 📝 Next Steps

1. **Configure kubectl** on Azure DevOps agent to connect to Ubuntu server
2. **Set up image sharing** between agent and server
3. **Test deployment** with current pipeline
4. **Configure ingress controller** on Ubuntu server (if needed)
5. **Set up monitoring** and alerting
6. **Configure SSL/TLS** for production use

## 🆘 Support

For issues:
1. Check pipeline logs in Azure DevOps
2. Verify kubectl connection to Ubuntu server
3. Check pod logs and events
4. Verify image availability on Ubuntu server
5. Test network connectivity between components 