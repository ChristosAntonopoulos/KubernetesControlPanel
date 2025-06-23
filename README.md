# Kubernetes Control Panel

A modern, user-friendly web-based control panel for monitoring and managing Kubernetes clusters. This application provides real-time insights into cluster health, pod status, node information, and namespace management.

## Features

- 📊 **Dashboard**: Real-time cluster overview with health status and metrics
- 🐳 **Pod Management**: View, filter, and manage pods across all namespaces
- 🖥️ **Node Monitoring**: Monitor node health and resource allocation
- 📁 **Namespace Overview**: Manage and view namespace resources
- 🔄 **Real-time Updates**: Live status updates using SignalR
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔐 **Secure Access**: Service account-based authentication

## Technology Stack

### Backend
- **ASP.NET Core 8.0** - Web API framework
- **Kubernetes Client Library** - Official .NET client for K8s API
- **SignalR** - Real-time communication
- **Serilog** - Structured logging
- **AutoMapper** - Object mapping

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI (MUI)** - UI component library
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

### Infrastructure
- **Docker** - Containerization
- **Kubernetes** - Deployment platform
- **Azure DevOps** - CI/CD pipeline

## Project Structure

```
KubernetesControlPanel/
├── src/
│   ├── Frontend/          # React TypeScript application
│   └── Backend/           # ASP.NET Core Web API
├── k8s/                   # Kubernetes manifests
├── docker/               # Docker configurations
├── azure-pipelines.yml   # Azure DevOps pipeline
└── README.md
```

## Quick Start

### Prerequisites

- .NET 8.0 SDK
- Node.js 18+ and npm
- Docker
- Kubernetes cluster access
- Azure DevOps account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd KubernetesControlPanel
   ```

2. **Backend Setup**
   ```bash
   cd src/Backend
   dotnet restore
   dotnet run
   ```

3. **Frontend Setup**
   ```bash
   cd src/Frontend
   npm install
   npm start
   ```

4. **Access the application**
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:5000/swagger

### Kubernetes Deployment

1. **Create namespace**
   ```bash
   kubectl create namespace k8s-control-panel
   ```

2. **Apply RBAC**
   ```bash
   kubectl apply -f k8s/rbac.yaml
   ```

3. **Deploy the application**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KUBERNETES_SERVICE_HOST` | K8s API server host | Auto-detected |
| `KUBERNETES_SERVICE_PORT` | K8s API server port | Auto-detected |
| `LOG_LEVEL` | Logging level | Information |
| `CORS_ORIGINS` | Allowed CORS origins | * |

### Service Account

The application requires a Kubernetes service account with the following permissions:
- `pods` - read, list, watch
- `nodes` - read, list, watch
- `namespaces` - read, list, watch
- `events` - read, list, watch

## API Endpoints

### Dashboard
- `GET /api/dashboard/overview` - Cluster overview
- `GET /api/dashboard/metrics` - Resource metrics

### Pods
- `GET /api/pods` - List all pods
- `GET /api/pods/{namespace}` - Pods by namespace
- `GET /api/pods/{namespace}/{name}` - Pod details
- `GET /api/pods/{namespace}/{name}/logs` - Pod logs

### Nodes
- `GET /api/nodes` - List all nodes
- `GET /api/nodes/{name}` - Node details

### Namespaces
- `GET /api/namespaces` - List all namespaces
- `GET /api/namespaces/{name}` - Namespace details

## Development

### Adding New Features

1. **Backend**: Add controllers, services, and models in the appropriate folders
2. **Frontend**: Add components and pages in the React application
3. **Testing**: Write unit and integration tests
4. **Documentation**: Update API documentation and README

### Code Style

- Follow C# and TypeScript coding conventions
- Use meaningful variable and function names
- Implement proper error handling
- Write comprehensive tests
- Document public APIs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

## Roadmap

- [ ] Advanced pod management (scale, restart, delete)
- [ ] Resource quota management
- [ ] Custom metrics integration
- [ ] Multi-cluster support
- [ ] Role-based access control (RBAC) management
- [ ] Backup and restore functionality
- [ ] Performance monitoring and alerts 