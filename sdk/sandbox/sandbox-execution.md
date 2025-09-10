# Sandbox Execution

Secure code execution environments with E2B integration for isolated development and testing.

## MCP Tools for Sandbox Management

Flow Nexus provides 10 specialized MCP tools for sandbox operations:

- `mcp__flow-nexus__sandbox_create` - Create new sandboxes
- `mcp__flow-nexus__sandbox_execute` - Execute code in sandboxes
- `mcp__flow-nexus__sandbox_list` - List all sandboxes
- `mcp__flow-nexus__sandbox_status` - Get sandbox status
- `mcp__flow-nexus__sandbox_configure` - Configure environments
- `mcp__flow-nexus__sandbox_upload` - Upload files to sandbox
- `mcp__flow-nexus__sandbox_logs` - Get execution logs
- `mcp__flow-nexus__sandbox_stop` - Stop running sandboxes
- `mcp__flow-nexus__sandbox_delete` - Delete sandboxes

## Sandbox Creation

### Basic Sandbox Setup

Create isolated execution environments:

```javascript
// Create Python sandbox
const sandbox = await client.sandboxes.create({
  template: 'python',
  name: 'data-analysis-env',
  timeout: 1800, // 30 minutes
  env_vars: {
    API_KEY: 'your_api_key',
    DEBUG: 'true',
    DATABASE_URL: 'postgresql://...'
  }
});

console.log('Sandbox created:', sandbox);
```

**SDK Response Example:**
```javascript
{
  success: true,
  sandbox_id: 'sandbox_abc123',
  e2b_sandbox_id: 'sandbox_abc123',
  name: 'data-analysis-env',
  template: 'python',
  status: 'running',
  env_vars_configured: 3,
  anthropic_key_configured: false,
  packages_to_install: [],
  startup_script_configured: false,
  timeout: 1800,
  metadata: {},
  url: 'https://sandbox_abc123.flow-nexus.io',
  created_at: '2024-12-10T15:00:00Z'
}
```

### Advanced Sandbox Configuration

```javascript
// Create comprehensive development environment
const devSandbox = await client.sandboxes.create({
  template: 'nodejs',
  name: 'full-stack-dev',
  timeout: 3600,
  env_vars: {
    NODE_ENV: 'development',
    API_BASE_URL: 'https://api.example.com',
    ANTHROPIC_API_KEY: 'your_anthropic_key'
  },
  install_packages: [
    'express',
    'react',
    '@anthropic-ai/claude-code',
    'jest',
    'typescript'
  ],
  startup_script: `
    npm install
    npm run setup
    echo "Development environment ready"
  `,
  metadata: {
    project: 'web-app',
    team: 'frontend',
    environment: 'development'
  }
});
```

### Available Templates

Flow Nexus supports multiple sandbox templates:

- **node** - Node.js development environment
- **python** - Python with common data science libraries
- **react** - React development with build tools
- **nextjs** - Next.js framework environment
- **vanilla** - Basic HTML/CSS/JavaScript
- **base** - Minimal Ubuntu environment
- **claude-code** - Claude Code integration environment

```javascript
// Specialized templates
const reactSandbox = await client.sandboxes.create({
  template: 'react',
  name: 'ui-components',
  install_packages: ['styled-components', 'storybook']
});

const dataScienceSandbox = await client.sandboxes.create({
  template: 'python',
  name: 'ml-experiments',
  install_packages: ['pandas', 'scikit-learn', 'matplotlib']
});
```

## Code Execution

### Execute Python Code

Run Python scripts in isolated environments:

```javascript
// Execute Python data analysis
const result = await client.sandboxes.execute({
  sandbox_id: 'sandbox_abc123',
  code: `
import pandas as pd
import numpy as np

# Generate sample data
data = np.random.randn(1000, 3)
df = pd.DataFrame(data, columns=['A', 'B', 'C'])

# Basic statistics
stats = df.describe()
print("Dataset shape:", df.shape)
print("Summary statistics:")
print(stats)

# Calculate correlations
correlations = df.corr()
print("\\nCorrelations:")
print(correlations)
  `,
  language: 'python',
  timeout: 60,
  capture_output: true
});

console.log('Execution result:', result);
```

**SDK Response Example:**
```javascript
{
  success: true,
  execution_id: 'exec_def456',
  sandbox_id: 'sandbox_abc123',
  output: `Dataset shape: (1000, 3)
Summary statistics:
              A          B          C
count  1000.000000  1000.000000  1000.000000
mean     -0.045234    0.023891   -0.012456
std       0.987654    1.012345    0.998765
min      -3.234567   -3.456789   -3.123456
25%      -0.678901   -0.654321   -0.689012
50%      -0.034567    0.012345   -0.001234
75%       0.612345    0.698765    0.634567
max       3.145678    3.267890    3.098765

Correlations:
          A         B         C
A  1.000000  0.034567 -0.012345
B  0.034567  1.000000  0.045678
C -0.012345  0.045678  1.000000`,
  error: null,
  exit_code: 0,
  status: 'completed',
  language: 'python',
  env_vars_used: 0,
  timeout: 60,
  execution_time: 2.3,
  memory_used: '45.6 MB',
  cpu_time: 1.8
}
```

### Execute JavaScript/Node.js Code

```javascript
// Execute Node.js application
const nodeResult = await client.sandboxes.execute({
  sandbox_id: 'node_sandbox_456',
  code: `
const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/data', (req, res) => {
  const data = Array.from({length: 10}, (_, i) => ({
    id: i + 1,
    value: Math.random() * 100,
    label: \`Item \${i + 1}\`
  }));
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
  
  // Test the endpoints
  const http = require('http');
  
  http.get(\`http://localhost:\${PORT}/api/health\`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Health check response:', data);
      process.exit(0);
    });
  });
});
  `,
  language: 'javascript',
  timeout: 120,
  working_dir: '/app'
});
```

### Multi-language Support

```javascript
// Execute different languages in same sandbox
const multiLangResults = await Promise.all([
  // Python script
  client.sandboxes.execute({
    sandbox_id: 'multi_sandbox',
    code: 'print("Hello from Python")',
    language: 'python'
  }),
  
  // Shell commands
  client.sandboxes.execute({
    sandbox_id: 'multi_sandbox',
    code: 'echo "Hello from Bash" && ls -la',
    language: 'bash'
  }),
  
  // Node.js
  client.sandboxes.execute({
    sandbox_id: 'multi_sandbox',
    code: 'console.log("Hello from Node.js")',
    language: 'javascript'
  })
]);
```

## File Management

### Upload Files to Sandbox

Transfer files to sandbox environments:

```javascript
// Upload configuration file
const uploadResult = await client.sandboxes.upload({
  sandbox_id: 'sandbox_abc123',
  file_path: '/app/config.json',
  content: JSON.stringify({
    database: {
      host: 'localhost',
      port: 5432,
      name: 'appdb'
    },
    api: {
      version: 'v1',
      timeout: 30000
    }
  }, null, 2)
});

console.log('File uploaded:', uploadResult);
```

**SDK Response Example:**
```javascript
{
  success: true,
  sandbox_id: 'sandbox_abc123',
  file_path: '/app/config.json',
  size_bytes: 156,
  upload_time: 0.8,
  checksum: 'sha256:abc123def456...',
  permissions: '644',
  created_at: '2024-12-10T15:05:00Z'
}
```

### Upload Multiple Files

```javascript
// Upload project files
const projectFiles = [
  {
    path: '/app/package.json',
    content: JSON.stringify({
      name: 'my-app',
      version: '1.0.0',
      dependencies: {
        express: '^4.18.0'
      }
    })
  },
  {
    path: '/app/server.js',
    content: `
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
    `
  }
];

const uploadResults = await Promise.all(
  projectFiles.map(file => 
    client.sandboxes.upload({
      sandbox_id: 'sandbox_abc123',
      file_path: file.path,
      content: file.content
    })
  )
);
```

## Sandbox Configuration

### Environment Variables

Configure runtime environment:

```javascript
// Configure sandbox environment
const configResult = await client.sandboxes.configure({
  sandbox_id: 'sandbox_abc123',
  env_vars: {
    API_URL: 'https://api.production.com',
    LOG_LEVEL: 'info',
    CACHE_TTL: '3600',
    ANTHROPIC_API_KEY: 'your_api_key'
  },
  install_packages: [
    'redis',
    'postgresql',
    'nginx'
  ],
  run_commands: [
    'pip install --upgrade pip',
    'npm install -g pm2',
    'mkdir -p /app/logs'
  ]
});

console.log('Configuration applied:', configResult);
```

**SDK Response Example:**
```javascript
{
  success: true,
  sandbox_id: 'sandbox_abc123',
  env_vars_updated: 4,
  packages_installed: 3,
  commands_executed: 3,
  configuration_time: 45.2,
  status: 'configured',
  anthropic_key_configured: true,
  restart_required: false
}
```

### Package Installation

```javascript
// Install development tools
const packageInstall = await client.sandboxes.configure({
  sandbox_id: 'dev_sandbox',
  install_packages: [
    // Python packages
    'fastapi[all]',
    'uvicorn',
    'sqlalchemy',
    'alembic',
    
    // Node.js packages  
    'typescript',
    '@types/node',
    'eslint',
    'prettier'
  ]
});
```

## Monitoring and Logs

### Get Execution Logs

Monitor sandbox activity:

```javascript
// Get recent logs
const logs = await client.sandboxes.getLogs({
  sandbox_id: 'sandbox_abc123',
  lines: 100, // Last 100 lines
  include_timestamps: true,
  log_level: 'all' // 'error', 'warn', 'info', 'debug', 'all'
});

console.log('Sandbox logs:', logs);
```

**SDK Response Example:**
```javascript
{
  success: true,
  sandbox_id: 'sandbox_abc123',
  logs: [
    {
      timestamp: '2024-12-10T15:10:23.456Z',
      level: 'info',
      source: 'system',
      message: 'Sandbox started successfully'
    },
    {
      timestamp: '2024-12-10T15:10:45.789Z', 
      level: 'info',
      source: 'execution',
      message: 'Python script execution started'
    },
    {
      timestamp: '2024-12-10T15:10:48.123Z',
      level: 'info', 
      source: 'stdout',
      message: 'Dataset shape: (1000, 3)'
    },
    {
      timestamp: '2024-12-10T15:10:48.456Z',
      level: 'error',
      source: 'stderr', 
      message: 'Warning: deprecated function usage'
    }
  ],
  total_lines: 156,
  log_file_size: '2.3 MB',
  oldest_entry: '2024-12-10T15:00:00.000Z'
}
```

### Real-time Log Streaming

```javascript
// Stream logs in real-time
const logStream = await client.sandboxes.streamLogs({
  sandbox_id: 'sandbox_abc123',
  follow: true,
  callback: (logEntry) => {
    console.log(`[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.message}`);
    
    if (logEntry.level === 'error') {
      // Handle errors immediately
      handleError(logEntry);
    }
  }
});

// Stop streaming after 5 minutes
setTimeout(() => {
  logStream.stop();
}, 300000);
```

## Sandbox Status and Management

### Check Sandbox Status

Monitor sandbox health and resources:

```javascript
// Get detailed sandbox status
const status = await client.sandboxes.getStatus('sandbox_abc123');

console.log('Sandbox status:', status);
```

**SDK Response Example:**
```javascript
{
  success: true,
  sandbox: {
    id: 'sandbox_abc123',
    name: 'data-analysis-env',
    status: 'running',
    template: 'python',
    uptime: 1847, // seconds
    resource_usage: {
      cpu_percent: 12.5,
      memory_used: '256 MB',
      memory_limit: '2 GB',
      disk_used: '145 MB',
      disk_limit: '10 GB',
      network_io: {
        bytes_sent: 1024000,
        bytes_received: 2048000
      }
    },
    environment: {
      python_version: '3.11.6',
      pip_packages: 45,
      env_vars: 8,
      working_directory: '/home/user'
    },
    executions: {
      total: 23,
      successful: 21,
      failed: 2,
      average_duration: 4.2
    },
    last_activity: '2024-12-10T15:08:45Z',
    expires_at: '2024-12-10T15:30:00Z'
  }
}
```

### List All Sandboxes

```javascript
// List user's sandboxes with filtering
const sandboxes = await client.sandboxes.list({
  status: 'running',
  template: 'python',
  limit: 20,
  sort_by: 'created_at',
  order: 'desc'
});

console.log('Available sandboxes:', sandboxes);
```

**SDK Response Example:**
```javascript
{
  success: true,
  sandboxes: [
    {
      id: 'sandbox_abc123',
      name: 'data-analysis-env',
      template: 'python',
      status: 'running',
      uptime: 1847,
      created_at: '2024-12-10T15:00:00Z',
      last_activity: '2024-12-10T15:08:45Z',
      resource_usage: {
        cpu_percent: 12.5,
        memory_used: '256 MB'
      }
    },
    {
      id: 'sandbox_def456',
      name: 'web-dev-env',
      template: 'nodejs',
      status: 'running', 
      uptime: 3245,
      created_at: '2024-12-10T14:15:00Z',
      last_activity: '2024-12-10T15:09:12Z',
      resource_usage: {
        cpu_percent: 8.3,
        memory_used: '180 MB'
      }
    }
  ],
  total_count: 15,
  running_count: 8,
  stopped_count: 7
}
```

## Lifecycle Management

### Stop Sandbox

Gracefully stop running sandboxes:

```javascript
// Stop sandbox to save resources
const stopResult = await client.sandboxes.stop('sandbox_abc123');

console.log('Sandbox stopped:', stopResult);
```

**SDK Response Example:**
```javascript
{
  success: true,
  sandbox_id: 'sandbox_abc123',
  previous_status: 'running',
  current_status: 'stopped',
  uptime: 1847,
  final_resource_usage: {
    cpu_hours: 0.12,
    memory_hours: 0.45,
    total_executions: 23
  },
  stopped_at: '2024-12-10T15:15:00Z',
  data_preserved: true
}
```

### Delete Sandbox

Permanently remove sandboxes:

```javascript
// Delete sandbox and cleanup resources
const deleteResult = await client.sandboxes.delete('sandbox_abc123');

console.log('Sandbox deleted:', deleteResult);
```

**SDK Response Example:**
```javascript
{
  success: true,
  sandbox_id: 'sandbox_abc123',
  deleted_at: '2024-12-10T15:20:00Z',
  resources_cleaned: {
    files_removed: 156,
    disk_space_freed: '145 MB',
    processes_terminated: 3
  },
  backup_created: false,
  total_cost: 2.45 // credits
}
```

## Error Handling

```javascript
try {
  await client.sandboxes.execute({
    sandbox_id: 'invalid_id',
    code: 'print("hello")'
  });
} catch (error) {
  switch (error.code) {
    case 'SANDBOX_NOT_FOUND':
      console.log('Specified sandbox does not exist');
      break;
    case 'SANDBOX_NOT_RUNNING':
      console.log('Sandbox is stopped or crashed');
      break;
    case 'EXECUTION_TIMEOUT':
      console.log('Code execution timed out');
      break;
    case 'EXECUTION_ERROR':
      console.log('Code execution failed:', error.details);
      break;
    case 'INSUFFICIENT_RESOURCES':
      console.log('Sandbox out of memory or CPU');
      break;
    case 'PERMISSION_DENIED':
      console.log('Insufficient permissions for operation');
      break;
    case 'QUOTA_EXCEEDED':
      console.log('Sandbox usage quota exceeded');
      break;
    default:
      console.error('Sandbox error:', error.message);
  }
}
```

## Best Practices

### 1. Resource Management

```javascript
// Monitor resource usage
async function monitorSandboxResources(sandboxId) {
  const status = await client.sandboxes.getStatus(sandboxId);
  
  if (status.sandbox.resource_usage.memory_percent > 90) {
    console.warn('High memory usage detected');
    // Consider restarting or upgrading sandbox
  }
  
  if (status.sandbox.resource_usage.cpu_percent > 80) {
    console.warn('High CPU usage detected');
    // Optimize code or scale resources
  }
}
```

### 2. Sandbox Lifecycle Management

```javascript
// Implement sandbox lifecycle management
class SandboxManager {
  constructor() {
    this.activeSandboxes = new Map();
  }
  
  async createSandbox(config) {
    const sandbox = await client.sandboxes.create(config);
    
    // Set automatic cleanup
    setTimeout(() => {
      this.cleanupSandbox(sandbox.sandbox_id);
    }, config.timeout * 1000);
    
    this.activeSandboxes.set(sandbox.sandbox_id, {
      ...sandbox,
      created_at: new Date()
    });
    
    return sandbox;
  }
  
  async cleanupSandbox(sandboxId) {
    try {
      await client.sandboxes.stop(sandboxId);
      await client.sandboxes.delete(sandboxId);
      this.activeSandboxes.delete(sandboxId);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
  
  async cleanupAll() {
    const cleanupPromises = Array.from(this.activeSandboxes.keys())
      .map(id => this.cleanupSandbox(id));
    
    await Promise.all(cleanupPromises);
  }
}
```

### 3. Error Recovery

```javascript
// Implement robust error recovery
async function executeWithRetry(sandboxId, code, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.sandboxes.execute({
        sandbox_id: sandboxId,
        code: code,
        timeout: 60
      });
    } catch (error) {
      if (error.code === 'EXECUTION_TIMEOUT' && attempt < maxRetries) {
        console.log(`Attempt ${attempt} timed out, retrying...`);
        continue;
      }
      
      if (error.code === 'SANDBOX_NOT_RUNNING') {
        // Try to restart sandbox
        await client.sandboxes.configure({
          sandbox_id: sandboxId,
          restart: true
        });
        continue;
      }
      
      throw error;
    }
  }
}
```

### 4. Performance Optimization

```javascript
// Optimize sandbox performance
async function optimizeSandbox(sandboxId) {
  // Pre-install common packages
  await client.sandboxes.configure({
    sandbox_id: sandboxId,
    install_packages: [
      'numpy',
      'pandas', 
      'requests',
      'matplotlib'
    ]
  });
  
  // Warm up Python environment
  await client.sandboxes.execute({
    sandbox_id: sandboxId,
    code: `
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
print("Environment warmed up")
    `,
    language: 'python'
  });
}
```

## Advanced Features

### Multi-Sandbox Orchestration

```javascript
// Coordinate multiple sandboxes
async function orchestrateDataPipeline() {
  // Create specialized sandboxes
  const extractorSandbox = await client.sandboxes.create({
    template: 'python',
    name: 'data-extractor'
  });
  
  const processorSandbox = await client.sandboxes.create({
    template: 'python', 
    name: 'data-processor'
  });
  
  const analyzerSandbox = await client.sandboxes.create({
    template: 'python',
    name: 'data-analyzer'
  });
  
  // Execute pipeline stages
  const extractionResult = await client.sandboxes.execute({
    sandbox_id: extractorSandbox.sandbox_id,
    code: 'print("Data extracted")'
  });
  
  const processingResult = await client.sandboxes.execute({
    sandbox_id: processorSandbox.sandbox_id,
    code: 'print("Data processed")'
  });
  
  const analysisResult = await client.sandboxes.execute({
    sandbox_id: analyzerSandbox.sandbox_id,
    code: 'print("Analysis complete")'
  });
  
  return {
    extraction: extractionResult,
    processing: processingResult,
    analysis: analysisResult
  };
}
```

### Sandbox Templates

```javascript
// Create custom sandbox templates
const customTemplate = {
  name: 'ml-research-env',
  base_template: 'python',
  packages: [
    'tensorflow',
    'pytorch', 
    'scikit-learn',
    'jupyter',
    'wandb'
  ],
  env_vars: {
    CUDA_VISIBLE_DEVICES: '0',
    WANDB_PROJECT: 'research'
  },
  startup_script: `
pip install --upgrade pip
jupyter notebook --generate-config
echo "ML research environment ready"
  `
};
```

## Next Steps

- [Neural Networks](../neural/neural-training.md) - Train models in sandboxes
- [Workflows](../workflows/workflow-orchestration.md) - Automate sandbox workflows
- [Templates](../templates/template-deployment.md) - Deploy pre-configured environments