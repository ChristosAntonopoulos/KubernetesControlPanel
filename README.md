# Kubernetes Control Panel

A comprehensive Kubernetes monitoring and management control panel deployed as a pod inside a Kubernetes cluster running on Ubuntu server. This project follows GitOps principles where all Kubernetes configurations are version-controlled in YAML files and automatically deployed through Azure DevOps CI/CD pipeline.

## 🎯 Project Overview

This Kubernetes control panel provides:
- **Real-time cluster monitoring** with live status updates via SignalR
- **Pod management** with detailed views, logs, and actions
- **Node monitoring** with resource allocation and health status
- **Namespace management** with resource quotas and pod distribution
- **User-friendly web interface** built with React and Material-UI
- **Secure API** built with ASP.NET Core and proper RBAC

## 🏗️ Architecture

### GitOps Deployment Model
- **Source of Truth**: All Kubernetes configurations are stored in `k8s/` directory
- **Automated Deployment**: Azure DevOps pipeline automatically applies changes
- **Target Environment**: Ubuntu server running Kubernetes cluster
- **Version Control**: All infrastructure changes are tracked in Git

### Technology Stack
- **Frontend**: React with TypeScript, Material-UI components
- **Backend**: ASP.NET Core Web API with C#
- **Real-time Updates**: SignalR for live cluster status
- **Authentication**: Kubernetes service account with RBAC
- **Container**: Multi-stage Docker build with .NET 8.0
- **CI/CD**: Azure DevOps pipeline with automated deployment

## 🚀 Deployment Flow

1. **Development**: Make changes to application code or Kubernetes YAML files
2. **Commit & Push**: Changes are committed to Git repository
3. **Pipeline Trigger**: Azure DevOps pipeline automatically starts
4. **Build**: Application is built and containerized
5. **Deploy**: Kubernetes manifests are applied to Ubuntu server cluster
6. **Verification**: Health checks and status verification

## 📁 Project Structure

```
KubernetesControlPanel/
├── k8s/                          # Kubernetes manifests (Source of Truth)
│   ├── deployment.yaml           # Application deployment
│   ├── service.yaml              # Service configuration
│   ├── ingress.yaml              # Ingress rules
│   └── rbac.yaml                 # RBAC permissions
├── src/
│   ├── Frontend/                 # React TypeScript application
│   └── Backend/                  # ASP.NET Core Web API
├── docker/
│   └── Dockerfile                # Multi-stage container build
├── azure-pipelines.yml           # CI/CD pipeline configuration
└── README.md                     # This file
```

## 🔧 Configuration Management

### Kubernetes Configuration
All Kubernetes resources are defined in YAML files under `k8s/`:
- **deployment.yaml**: Application deployment with health checks and resource limits
- **service.yaml**: NodePort service exposing HTTP/HTTPS ports
- **ingress.yaml**: Ingress configuration for external access
- **rbac.yaml**: Service account, roles, and role bindings

### Environment Configuration
- **Development**: Local development with hot reload
- **Production**: Kubernetes deployment with proper resource limits
- **Configuration**: Environment-specific settings via Kubernetes ConfigMaps/Secrets

## 🔐 Security Features

- **RBAC**: Proper service account with minimal required permissions
- **Network Security**: Ingress with SSL/TLS support
- **Resource Isolation**: Namespace-based isolation
- **Health Monitoring**: Liveness and readiness probes

## 📊 Monitoring & Observability

- **Health Checks**: Built-in health endpoints
- **Logging**: Structured logging with volume mounts
- **Metrics**: Resource usage monitoring
- **Real-time Updates**: Live cluster status via SignalR

## 🛠️ Development Workflow

### Making Changes
1. **Application Changes**: Modify source code in `src/` directory
2. **Kubernetes Changes**: Update YAML files in `k8s/` directory
3. **Commit Changes**: Commit to Git repository
4. **Pipeline Execution**: Azure DevOps automatically deploys changes

### Local Development
```bash
# Frontend development
cd src/Frontend
npm install
npm start

# Backend development
cd src/Backend/KubernetesControlPanel.API
dotnet run
```

### Kubernetes Deployment
```bash
# Manual deployment (if needed)
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## 🌐 Access Points

### Production Access
- **NodePort Service**: `http://<ubuntu-server-ip>:30080`
- **HTTPS Service**: `https://<ubuntu-server-ip>:30443`
- **Ingress Access**: Configured through ingress controller

### Development Access
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

## 📈 Scaling & Performance

- **Horizontal Scaling**: Deployment supports multiple replicas
- **Resource Management**: CPU and memory limits configured
- **Caching**: In-memory caching for cluster data
- **Optimization**: Efficient API calls and real-time updates

## 🔄 Update Process

### Application Updates
1. Modify application code
2. Commit and push to repository
3. Pipeline builds new container image
4. Kubernetes deployment is updated automatically

### Infrastructure Updates
1. Modify YAML files in `k8s/` directory
2. Commit and push to repository
3. Pipeline applies new Kubernetes configurations
4. Changes are deployed to Ubuntu server cluster

## 🚨 Troubleshooting

### Common Issues
- **Pod Startup Issues**: Check health endpoint implementation
- **RBAC Permission Errors**: Verify service account permissions
- **Image Pull Issues**: Ensure image is available in registry
- **Network Connectivity**: Verify service and ingress configuration

### Debug Commands
```bash
# Check deployment status
kubectl get pods -n k8s-control-panel

# View application logs
kubectl logs -n k8s-control-panel -l app=k8s-control-panel

# Check service endpoints
kubectl get endpoints -n k8s-control-panel

# Verify RBAC permissions
kubectl auth can-i get pods --as=system:serviceaccount:k8s-control-panel:k8s-control-panel
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally and in pipeline
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 