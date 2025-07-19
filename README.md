# Kubernetes Control Panel

A comprehensive, modern web-based control panel for managing your Kubernetes cluster. Built with React and Node.js, this application provides an intuitive interface for monitoring and managing your Kubernetes resources.

## Features

### 🚀 Core Functionality
- **Pod Management**: View, delete, and restart pods with intelligent deployment detection
- **Real-time Log Streaming**: Stream pod logs in real-time with WebSocket connections
- **Performance Metrics**: Monitor CPU and memory usage for pods and nodes
- **Event Monitoring**: Track cluster events with filtering and real-time updates
- **Interactive Terminal**: Execute safe kubectl commands through a web terminal

### 📊 Dashboard & Monitoring
- **Cluster Overview**: Real-time dashboard with pod counts, status distribution, and cluster health
- **Performance Charts**: Visual representations of resource usage and trends
- **Node Metrics**: Monitor node-level CPU and memory consumption
- **Event Timeline**: Track cluster events with priority-based sorting

### 🔧 Advanced Features
- **Smart Pod Restart**: Automatically detects deployment/statefulset/daemonset ownership for proper restarts
- **Multi-container Support**: Handle pods with multiple containers
- **Previous Log Access**: View logs from previous container instances
- **Log Download**: Export logs and terminal sessions
- **Real-time Updates**: Automatic refresh of data with configurable intervals

### 🔒 Security
- **Read-only Operations**: Terminal restricted to safe kubectl commands only
- **Input Validation**: All inputs validated on both client and server
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Prerequisites

- Node.js 16 or higher
- kubectl configured and connected to your cluster
- Kubernetes cluster with metrics-server installed (for performance metrics)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kubernetes-control-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

4. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Installation Options

### Development Mode
```bash
# Start both backend and frontend in development mode
npm run dev
```

### Production Mode
```bash
# Build the frontend
npm run build

# Start the backend server
npm run server
```

### Individual Components
```bash
# Start only the backend
npm run server

# Start only the frontend (in development)
npm start
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Kubernetes Configuration
KUBECONFIG=/path/to/your/kubeconfig
```

### Kubernetes Permissions

Ensure your kubectl context has the necessary permissions:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: k8s-control-panel
rules:
- apiGroups: [""]
  resources: ["pods", "namespaces", "nodes", "events"]
  verbs: ["get", "list", "delete"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets", "statefulsets", "daemonsets"]
  verbs: ["get", "patch"]
- apiGroups: ["metrics.k8s.io"]
  resources: ["pods", "nodes"]
  verbs: ["get", "list"]
```

## API Endpoints

### Pods
- `GET /api/pods/:namespace?` - List pods in namespace (or all)
- `GET /api/pod/:namespace/:name` - Get pod details
- `DELETE /api/pod/:namespace/:name` - Delete pod
- `POST /api/pod/:namespace/:name/restart` - Restart pod
- `GET /api/pod/:namespace/:name/logs` - Get pod logs
- `GET /api/pod/:namespace/:name/metrics` - Get pod metrics

### Cluster
- `GET /api/namespaces` - List namespaces
- `GET /api/nodes/metrics` - Get node metrics
- `GET /api/cluster/info` - Get cluster information
- `GET /api/events/:namespace?` - Get events

### Terminal
- `POST /api/kubectl` - Execute kubectl command (read-only)

### WebSocket
- Real-time log streaming on `/` path

## Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charts and data visualization
- **Lucide React** - Beautiful icons
- **date-fns** - Date manipulation

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **WebSocket** - Real-time communication
- **kubectl** - Kubernetes CLI integration

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Common Issues

1. **"kubectl not found" error**
   - Ensure kubectl is installed and in your PATH
   - Verify your kubeconfig is properly configured

2. **"Metrics not available" message**
   - Install metrics-server in your cluster:
     ```bash
     kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
     ```

3. **WebSocket connection failed**
   - Check if port 3001 is accessible
   - Verify firewall settings

4. **Permission denied errors**
   - Ensure your kubectl context has proper RBAC permissions
   - Check the cluster role configuration above

### Debug Mode

Enable debug logging:
```bash
DEBUG=kubernetes-control-panel npm run server
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security Considerations

- This application should only be deployed in trusted environments
- Consider adding authentication and authorization for production use
- Regularly update dependencies to patch security vulnerabilities
- Use HTTPS in production deployments

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Kubernetes community for excellent documentation
- React and Node.js communities for robust ecosystems
- Tailwind CSS for beautiful, responsive design system