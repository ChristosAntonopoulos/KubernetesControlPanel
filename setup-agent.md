# Self-Hosted Azure DevOps Agent Setup

## Prerequisites
- Windows Server or Linux server with access to your Kubernetes cluster
- Docker installed on the agent machine
- kubectl configured and accessible
- .NET 8.0 SDK installed
- Node.js 18+ installed
- **Internet connectivity** for downloading the agent

## Network Troubleshooting

### Check Internet Connectivity
```bash
# Test DNS resolution
nslookup google.com
ping google.com

# Test HTTPS connectivity
curl -I https://www.google.com

# Check DNS configuration
cat /etc/resolv.conf
```

### Fix DNS Issues
```bash
# Use Google DNS temporarily
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
echo "nameserver 8.8.4.4" | sudo tee -a /etc/resolv.conf

# Or use Cloudflare DNS
echo "nameserver 1.1.1.1" | sudo tee /etc/resolv.conf
echo "nameserver 1.0.0.1" | sudo tee -a /etc/resolv.conf
```

## Installation Steps

### Method 1: Direct Download (if DNS works)
```bash
# Create agent directory
mkdir azure-agent
cd azure-agent

# Download agent
wget https://vstsagentpackage.azureedge.net/agent/3.232.0/vsts-agent-linux-x64-3.232.0.tar.gz

# Extract
tar zxvf vsts-agent-linux-x64-3.232.0.tar.gz
```

### Method 2: Alternative Download URLs
```bash
# Try alternative URLs if the main one fails
wget https://github.com/microsoft/azure-pipelines-agent/releases/download/v3.232.0/vsts-agent-linux-x64-3.232.0.tar.gz

# Or download from Azure DevOps directly
wget https://dev.azure.com/microsoft/_apis/resources/Containers/1234567?itemPath=agent%2Fvsts-agent-linux-x64-3.232.0.tar.gz
```

### Method 3: Manual Download and Transfer
If your server has no internet access:

1. **Download on your local machine**:
   ```bash
   # On your local machine with internet
   wget https://vstsagentpackage.azureedge.net/agent/3.232.0/vsts-agent-linux-x64-3.232.0.tar.gz
   ```

2. **Transfer to server**:
   ```bash
   # Using SCP
   scp vsts-agent-linux-x64-3.232.0.tar.gz root@your-server-ip:/root/azure-agent/
   
   # Or using SFTP
   sftp root@your-server-ip
   put vsts-agent-linux-x64-3.232.0.tar.gz /root/azure-agent/
   ```

3. **Extract on server**:
   ```bash
   cd azure-agent
   tar zxvf vsts-agent-linux-x64-3.232.0.tar.gz
   ```

### Method 4: Use Docker Agent (Alternative Approach)
If network issues persist, consider using a Docker-based agent:

```bash
# Pull the agent image
docker pull mcr.microsoft.com/azure-pipelines/vsts-agent:ubuntu-20.04

# Run as container
docker run -d \
  --name azure-agent \
  -e AZP_URL=https://dev.azure.com/your-organization \
  -e AZP_TOKEN=your-pat-token \
  -e AZP_POOL=kubernetes-server-pool \
  -e AZP_AGENT_NAME=kubernetes-server-agent \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/bin/docker:/usr/bin/docker \
  -v /usr/bin/kubectl:/usr/bin/kubectl \
  mcr.microsoft.com/azure-pipelines/vsts-agent:ubuntu-20.04
```

## Configuration

### Configure Agent
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

### Install as Service
```bash
# Install as systemd service (Linux)
sudo ./svc.sh install
sudo ./svc.sh start

# Or run manually
./run.sh
```

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
5. **Network connectivity**: Check DNS and firewall settings

### Logs
```bash
# View agent logs
tail -f _diag/*.log

# Check service status
sudo systemctl status vsts.agent.kubernetes-server-pool.kubernetes-server-agent
```

## Alternative: GitHub Actions (if Azure DevOps is problematic)

If you continue having issues with Azure DevOps, consider using GitHub Actions instead:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes
on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: self-hosted
    steps:
    - uses: actions/checkout@v3
    - name: Build and Deploy
      run: |
        # Your deployment scripts here
``` 