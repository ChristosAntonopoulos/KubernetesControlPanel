import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Send, 
  RotateCcw, 
  Copy, 
  Download,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react';

const KubectlTerminal = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on component mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Auto scroll to bottom when new output is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const addToHistory = (type, content, command = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setHistory(prev => [...prev, {
      id: Date.now(),
      type, // 'command', 'output', 'error', 'info'
      content,
      command,
      timestamp
    }]);
  };

  const executeCommand = async () => {
    if (!command.trim()) return;

    const trimmedCommand = command.trim();
    
    // Add command to history
    addToHistory('command', trimmedCommand);
    setCommandHistory(prev => [trimmedCommand, ...prev.slice(0, 49)]); // Keep last 50 commands
    setHistoryIndex(-1);

    // Validate command
    const safeCommands = ['get', 'describe', 'logs', 'top', 'version', 'cluster-info'];
    const firstWord = trimmedCommand.split(' ')[0];

    if (!safeCommands.includes(firstWord)) {
      addToHistory('error', `Command '${firstWord}' is not allowed. Only read operations are permitted: ${safeCommands.join(', ')}`);
      setCommand('');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/kubectl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: trimmedCommand }),
      });

      const result = await response.json();

      if (result.success) {
        addToHistory('output', result.output);
      } else {
        addToHistory('error', result.error);
      }
    } catch (error) {
      addToHistory('error', `Network error: ${error.message}`);
    } finally {
      setLoading(false);
      setCommand('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const clearTerminal = () => {
    setHistory([]);
    addToHistory('info', 'Terminal cleared');
  };

  const copyOutput = (content) => {
    navigator.clipboard.writeText(content);
    // You could add a toast notification here
  };

  const downloadHistory = () => {
    const content = history.map(item => {
      const prefix = item.type === 'command' ? '$ kubectl ' : 
                   item.type === 'error' ? 'ERROR: ' :
                   item.type === 'info' ? 'INFO: ' : '';
      return `[${item.timestamp}] ${prefix}${item.content}`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kubectl-session-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'command':
        return <Terminal className="h-4 w-4 text-radiant-purple-400" />;
      case 'output':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'info':
        return <Info className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const commonCommands = [
    'get pods',
    'get pods --all-namespaces',
    'get nodes',
    'get services',
    'get deployments',
    'get namespaces',
    'describe pod',
    'top nodes',
    'top pods',
    'cluster-info',
    'version'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">Kubectl Terminal</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Execute safe kubectl commands (read-only operations only)
        </p>
      </div>

      {/* Common Commands */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Common Commands</h3>
        <div className="flex flex-wrap gap-2">
          {commonCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => setCommand(cmd)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              kubectl {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal */}
      <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-2 text-sm text-gray-300">kubectl terminal</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearTerminal}
              className="text-gray-400 hover:text-white p-1"
              title="Clear Terminal"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={downloadHistory}
              disabled={history.length === 0}
              className="text-gray-400 hover:text-white p-1 disabled:opacity-50"
              title="Download History"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Terminal Output */}
        <div 
          ref={terminalRef}
          className="h-96 overflow-y-auto p-4 font-mono text-sm text-green-400 bg-gray-900"
        >
          {history.length === 0 && (
            <div className="text-gray-500">
              Welcome to the Kubectl Terminal. Type kubectl commands to get started.
              <br />
              Only read operations are allowed for security reasons.
              <br />
              Use ↑/↓ arrows to navigate command history.
            </div>
          )}
          
          {history.map((item) => (
            <div key={item.id} className="mb-2">
              <div className="flex items-start space-x-2">
                {getItemIcon(item.type)}
                <div className="flex-1">
                  {item.type === 'command' && (
                    <div className="text-radiant-purple-400">
                      <span className="text-gray-500">[{item.timestamp}]</span> $ kubectl {item.content}
                    </div>
                  )}
                  {item.type === 'output' && (
                    <div className="relative group">
                      <button
                        onClick={() => copyOutput(item.content)}
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-1"
                        title="Copy Output"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <pre className="text-green-400 whitespace-pre-wrap text-xs leading-relaxed">
                        {item.content}
                      </pre>
                    </div>
                  )}
                  {item.type === 'error' && (
                    <div className="text-red-400">
                      <span className="text-gray-500">[{item.timestamp}]</span> ERROR: {item.content}
                    </div>
                  )}
                  {item.type === 'info' && (
                    <div className="text-gray-400">
                      <span className="text-gray-500">[{item.timestamp}]</span> {item.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
              <span>Executing command...</span>
            </div>
          )}
        </div>

        {/* Command Input */}
        <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-green-400 font-mono">$</span>
            <span className="text-radiant-purple-400 font-mono">kubectl</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Enter kubectl command..."
              className="flex-1 bg-transparent text-green-400 font-mono placeholder-gray-500 border-none outline-none disabled:opacity-50"
            />
            <button
              onClick={executeCommand}
              disabled={!command.trim() || loading}
              className="text-radiant-purple-400 hover:text-radiant-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Execute Command"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Press Enter to execute • Use ↑/↓ for command history • Only read operations allowed
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="bg-radiant-purple-50 border border-radiant-purple-200 rounded-md p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-radiant-purple-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-radiant-purple-800">Security Notice</h3>
            <div className="mt-2 text-sm text-radiant-purple-700">
              <p>For security reasons, only read operations are allowed in this terminal.</p>
              <p className="mt-1">
                Permitted commands: <code>get</code>, <code>describe</code>, <code>logs</code>, <code>top</code>, <code>version</code>, <code>cluster-info</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KubectlTerminal;