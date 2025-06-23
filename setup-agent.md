# Self-Hosted Azure DevOps Agent Setup

## Prerequisites
- Windows Server or Linux server with access to your Kubernetes cluster
- Docker installed on the agent machine
- kubectl configured and accessible
- .NET 8.0 SDK installed
- Node.js 18+ installed

## Installation Steps

### 1. Download Agent
```bash
# Create agent directory
mkdir azure-agent
cd azure-agent

# Download agent (replace with your organization URL)
wget https://vstsagentpackage.azureedge.net/agent/3.232.0/vsts-agent-linux-x64-3.232.0.tar.gz

# Extract
tar zxvf vsts-agent-linux-x64-3.232.0.tar.gz
```

### 2. Configure Agent
```bash
# Run configuration
./config.sh

# You'll need these details from Azure DevOps:
# - Server URL: https://dev.azure.com/your-organization
# - Authentication type: Personal Access Token (PAT)
# - Agent pool: kubernetes-server-pool
# - Agent name: kubernetes-server-agent
# - Work folder: _work
```

### 3. Install as Service
```bash
# Install as systemd service (Linux)
sudo ./svc.sh install
sudo ./svc.sh start

# Or run manually
./run.sh
```

### 4. Verify Installation
- Go to Azure DevOps → Project Settings → Agent pools
- Check that your agent appears and is online
- Test with a simple pipeline

## Agent Requirements

### Software Dependencies
- Docker 20.10+
- kubectl (configured for your cluster)
- .NET 8.0 SDK
- Node.js 18+
- Git

### Network Access
- Outbound HTTPS to Azure DevOps
- Access to your Kubernetes cluster API
- Access to container registry (if using private registry)

### Permissions
- Docker daemon access
- Kubernetes cluster access
- File system write permissions

## Troubleshooting

### Common Issues
1. **Agent not connecting**: Check network connectivity and PAT token
2. **Docker permission denied**: Add user to docker group
3. **kubectl not found**: Install and configure kubectl
4. **Build failures**: Verify .NET SDK and Node.js installation

### Logs
```bash
# View agent logs
tail -f _diag/*.log

# Check service status
sudo systemctl status vsts.agent.kubernetes-server-pool.kubernetes-server-agent
``` 