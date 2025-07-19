const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Store active log streams
const activeLogStreams = new Map();

// Utility function to execute kubectl commands
const executeKubectl = (command) => {
  return new Promise((resolve, reject) => {
    exec(`kubectl ${command}`, (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr });
        return;
      }
      resolve(stdout);
    });
  });
};

// Get all namespaces
app.get('/api/namespaces', async (req, res) => {
  try {
    const output = await executeKubectl('get namespaces -o json');
    const namespaces = JSON.parse(output);
    res.json(namespaces.items.map(ns => ({
      name: ns.metadata.name,
      status: ns.status.phase,
      age: ns.metadata.creationTimestamp
    })));
  } catch (error) {
    res.status(500).json({ error: error.error || error.message });
  }
});

// Get all pods in a namespace
app.get('/api/pods/:namespace?', async (req, res) => {
  try {
    const namespace = req.params.namespace || 'default';
    const command = namespace === 'all' 
      ? 'get pods --all-namespaces -o json'
      : `get pods -n ${namespace} -o json`;
    
    const output = await executeKubectl(command);
    const pods = JSON.parse(output);
    
    const formattedPods = pods.items.map(pod => ({
      name: pod.metadata.name,
      namespace: pod.metadata.namespace,
      status: pod.status.phase,
      ready: `${pod.status.containerStatuses?.filter(c => c.ready).length || 0}/${pod.spec.containers.length}`,
      restarts: pod.status.containerStatuses?.reduce((sum, c) => sum + c.restartCount, 0) || 0,
      age: pod.metadata.creationTimestamp,
      node: pod.spec.nodeName,
      ip: pod.status.podIP,
      containers: pod.spec.containers.map(c => c.name),
      labels: pod.metadata.labels || {},
      conditions: pod.status.conditions || []
    }));
    
    res.json(formattedPods);
  } catch (error) {
    res.status(500).json({ error: error.error || error.message });
  }
});

// Get pod details
app.get('/api/pod/:namespace/:name', async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const output = await executeKubectl(`get pod ${name} -n ${namespace} -o json`);
    const pod = JSON.parse(output);
    res.json(pod);
  } catch (error) {
    res.status(500).json({ error: error.error || error.message });
  }
});

// Delete pod
app.delete('/api/pod/:namespace/:name', async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const output = await executeKubectl(`delete pod ${name} -n ${namespace}`);
    res.json({ message: output.trim(), success: true });
  } catch (error) {
    res.status(500).json({ error: error.error || error.message, success: false });
  }
});

// Restart pod (delete and let deployment recreate)
app.post('/api/pod/:namespace/:name/restart', async (req, res) => {
  try {
    const { namespace, name } = req.params;
    
    // Get pod info first to check if it's managed by a deployment
    const podInfo = await executeKubectl(`get pod ${name} -n ${namespace} -o json`);
    const pod = JSON.parse(podInfo);
    
    let restartCommand;
    const ownerReferences = pod.metadata.ownerReferences;
    
    if (ownerReferences && ownerReferences.length > 0) {
      const owner = ownerReferences[0];
      if (owner.kind === 'ReplicaSet') {
        // Get the deployment name from ReplicaSet
        const rsInfo = await executeKubectl(`get replicaset ${owner.name} -n ${namespace} -o json`);
        const rs = JSON.parse(rsInfo);
        const deploymentName = rs.metadata.ownerReferences?.[0]?.name;
        
        if (deploymentName) {
          restartCommand = `rollout restart deployment/${deploymentName} -n ${namespace}`;
        } else {
          restartCommand = `delete pod ${name} -n ${namespace}`;
        }
      } else if (owner.kind === 'DaemonSet') {
        restartCommand = `rollout restart daemonset/${owner.name} -n ${namespace}`;
      } else if (owner.kind === 'StatefulSet') {
        restartCommand = `rollout restart statefulset/${owner.name} -n ${namespace}`;
      } else {
        restartCommand = `delete pod ${name} -n ${namespace}`;
      }
    } else {
      restartCommand = `delete pod ${name} -n ${namespace}`;
    }
    
    const output = await executeKubectl(restartCommand);
    res.json({ message: output.trim(), success: true, command: restartCommand });
  } catch (error) {
    res.status(500).json({ error: error.error || error.message, success: false });
  }
});

// Get pod logs
app.get('/api/pod/:namespace/:name/logs', async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const { container, lines = '100', previous = false } = req.query;
    
    let command = `logs ${name} -n ${namespace} --tail=${lines}`;
    if (container) command += ` -c ${container}`;
    if (previous === 'true') command += ' --previous';
    
    const output = await executeKubectl(command);
    res.json({ logs: output, success: true });
  } catch (error) {
    res.status(500).json({ error: error.error || error.message, success: false });
  }
});

// Get pod metrics (requires metrics-server)
app.get('/api/pod/:namespace/:name/metrics', async (req, res) => {
  try {
    const { namespace, name } = req.params;
    const output = await executeKubectl(`top pod ${name} -n ${namespace} --no-headers`);
    
    const metrics = output.trim().split(/\s+/);
    if (metrics.length >= 3) {
      res.json({
        cpu: metrics[1],
        memory: metrics[2],
        success: true
      });
    } else {
      res.json({ error: 'Unable to parse metrics', success: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.error || error.message, success: false });
  }
});

// Get node metrics
app.get('/api/nodes/metrics', async (req, res) => {
  try {
    const output = await executeKubectl('top nodes --no-headers');
    const nodes = output.trim().split('\n').map(line => {
      const parts = line.split(/\s+/);
      return {
        name: parts[0],
        cpu: parts[1],
        cpuPercent: parts[2],
        memory: parts[3],
        memoryPercent: parts[4]
      };
    });
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.error || error.message });
  }
});

// Get cluster info
app.get('/api/cluster/info', async (req, res) => {
  try {
    const [versionOutput, clusterInfoOutput] = await Promise.all([
      executeKubectl('version --client=false -o json').catch(() => 'N/A'),
      executeKubectl('cluster-info').catch(() => 'N/A')
    ]);
    
    let version = 'N/A';
    try {
      const versionData = JSON.parse(versionOutput);
      version = versionData.serverVersion?.gitVersion || 'N/A';
    } catch (e) {
      // Fallback if JSON parsing fails
    }
    
    res.json({
      version,
      clusterInfo: clusterInfoOutput
    });
  } catch (error) {
    res.status(500).json({ error: error.error || error.message });
  }
});

// Get events
app.get('/api/events/:namespace?', async (req, res) => {
  try {
    const namespace = req.params.namespace || 'default';
    const command = namespace === 'all' 
      ? 'get events --all-namespaces -o json --sort-by=.metadata.creationTimestamp'
      : `get events -n ${namespace} -o json --sort-by=.metadata.creationTimestamp`;
    
    const output = await executeKubectl(command);
    const events = JSON.parse(output);
    
    const formattedEvents = events.items.slice(-50).map(event => ({
      type: event.type,
      reason: event.reason,
      object: `${event.involvedObject.kind}/${event.involvedObject.name}`,
      message: event.message,
      time: event.firstTimestamp || event.eventTime,
      namespace: event.namespace,
      count: event.count || 1
    }));
    
    res.json(formattedEvents);
  } catch (error) {
    res.status(500).json({ error: error.error || error.message });
  }
});

// Execute custom kubectl command
app.post('/api/kubectl', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    // Security: Only allow safe read commands
    const safeCommands = ['get', 'describe', 'logs', 'top', 'version', 'cluster-info'];
    const firstWord = command.trim().split(' ')[0];
    
    if (!safeCommands.includes(firstWord)) {
      return res.status(403).json({ error: 'Command not allowed. Only read operations are permitted.' });
    }
    
    const output = await executeKubectl(command);
    res.json({ output, success: true });
  } catch (error) {
    res.status(500).json({ error: error.error || error.message, success: false });
  }
});

// WebSocket for real-time pod logs
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe_logs') {
        const { namespace, pod, container } = data;
        const streamId = `${namespace}/${pod}/${container || 'default'}`;
        
        // Stop existing stream if any
        if (activeLogStreams.has(streamId)) {
          activeLogStreams.get(streamId).kill();
        }
        
        // Start new log stream
        let command = ['logs', '-f', pod, '-n', namespace, '--tail=50'];
        if (container) command.push('-c', container);
        
        const logProcess = spawn('kubectl', command);
        
        logProcess.stdout.on('data', (data) => {
          ws.send(JSON.stringify({
            type: 'log',
            data: data.toString(),
            streamId
          }));
        });
        
        logProcess.stderr.on('data', (data) => {
          ws.send(JSON.stringify({
            type: 'error',
            data: data.toString(),
            streamId
          }));
        });
        
        logProcess.on('close', () => {
          activeLogStreams.delete(streamId);
          ws.send(JSON.stringify({
            type: 'stream_closed',
            streamId
          }));
        });
        
        activeLogStreams.set(streamId, logProcess);
      }
      
      if (data.type === 'unsubscribe_logs') {
        const { streamId } = data;
        if (activeLogStreams.has(streamId)) {
          activeLogStreams.get(streamId).kill();
          activeLogStreams.delete(streamId);
        }
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        data: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    // Clean up any active streams for this client
    for (const [streamId, process] of activeLogStreams) {
      process.kill();
    }
    activeLogStreams.clear();
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Kubernetes Control Panel Server running on port ${PORT}`);
});