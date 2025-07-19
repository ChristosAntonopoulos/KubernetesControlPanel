# Kubernetes Control Panel - Project Structure

## 📁 Project Layout

```
kubernetes-control-panel/
├── README.md                          # Comprehensive documentation
├── package.json                       # Dependencies and scripts
├── start.sh                          # Quick start script
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
│
├── public/
│   └── index.html                     # HTML template
│
├── server/
│   └── index.js                      # Express.js backend server
│
└── src/
    ├── index.js                       # React entry point
    ├── index.css                      # Global styles with Tailwind
    ├── App.js                         # Main application component
    │
    └── components/
        ├── Dashboard.js               # Cluster overview dashboard
        ├── Pods.js                   # Pod management interface
        ├── PodDetails.js             # Detailed pod information
        ├── Logs.js                   # Real-time log streaming
        ├── Metrics.js                # Performance monitoring
        ├── Events.js                 # Cluster events viewer
        └── KubectlTerminal.js        # Interactive kubectl terminal
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the application (recommended)
./start.sh

# Or start manually
npm run dev
```

## 📊 Features Overview

### Core Components

1. **Dashboard** (`src/components/Dashboard.js`)
   - Cluster overview with real-time statistics
   - Pod status distribution charts
   - Recent events timeline
   - Resource usage summaries

2. **Pod Management** (`src/components/Pods.js`)
   - List all pods across namespaces
   - Filter by namespace, status, and search
   - Delete pods with confirmation
   - Smart restart (deployment-aware)
   - Quick access to logs and details

3. **Pod Details** (`src/components/PodDetails.js`)
   - Comprehensive pod information
   - Container details and status
   - Resource metrics (CPU/Memory)
   - Labels, annotations, and conditions
   - Direct actions (restart, delete, logs)

4. **Real-time Logs** (`src/components/Logs.js`)
   - WebSocket-based log streaming
   - Previous logs access
   - Multi-container support
   - Log search and filtering
   - Download functionality

5. **Performance Metrics** (`src/components/Metrics.js`)
   - Pod and node resource usage
   - Historical charts and trends
   - Top resource consumers
   - Visual performance indicators

6. **Events Monitoring** (`src/components/Events.js`)
   - Cluster events with filtering
   - Priority-based sorting
   - Real-time updates
   - Event categorization

7. **Kubectl Terminal** (`src/components/KubectlTerminal.js`)
   - Safe kubectl command execution
   - Command history navigation
   - Output copying and downloading
   - Security restrictions (read-only)

### Backend API (`server/index.js`)

- **RESTful API** for all Kubernetes operations
- **WebSocket** support for real-time log streaming
- **Security**: Input validation and command restrictions
- **Error Handling**: Comprehensive error responses

## 🔧 Configuration

### Environment Variables
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode
- `KUBECONFIG` - Path to kubeconfig file

### Prerequisites
- Node.js 16+
- kubectl installed and configured
- Kubernetes cluster with metrics-server (optional)

## 🏗️ Architecture

### Frontend (React)
- **React 18** with hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **WebSocket** for real-time updates

### Backend (Node.js)
- **Express.js** web framework
- **WebSocket** server for log streaming
- **Child Process** for kubectl execution
- **CORS** enabled for development

### Communication
- REST API for standard operations
- WebSocket for real-time log streaming
- Automatic reconnection handling
- Error boundary implementation

## 🔒 Security Features

- **Command Validation**: Only safe kubectl commands allowed
- **Input Sanitization**: All inputs validated
- **RBAC Awareness**: Respects cluster permissions
- **Error Handling**: No sensitive information leaked
- **Read-only Terminal**: Prevents destructive operations

## 📱 Responsive Design

- **Mobile-friendly** interface
- **Collapsible sidebar** for small screens
- **Responsive tables** with horizontal scrolling
- **Touch-friendly** controls

## 🎨 UI/UX Features

- **Dark terminal** theme for logs
- **Status indicators** with color coding
- **Loading states** for all operations
- **Error messages** with helpful context
- **Confirmation dialogs** for destructive actions
- **Real-time updates** without page refresh

## 🧪 Development

### Scripts
- `npm run dev` - Start both frontend and backend
- `npm start` - Start frontend only
- `npm run server` - Start backend only
- `npm run build` - Build for production

### File Structure
- Components follow single responsibility principle
- Shared utilities and hooks (extendable)
- Consistent error handling patterns
- Modular CSS with Tailwind utilities