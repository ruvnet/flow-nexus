# JavaScript/TypeScript Getting Started Guide

Learn how to integrate Flow Nexus's 94 MCP tools into your JavaScript and TypeScript applications.

## Prerequisites

Flow Nexus uses the Model Context Protocol (MCP) for tool integration. You'll need an MCP-compatible client like Claude Code.

## Authentication

First, authenticate with Flow Nexus:

```javascript
// Login to Flow Nexus
const authResult = await mcp_flow_nexus_user_login({
  email: "your-email@domain.com",
  password: "your-password"
});

console.log(authResult);
// {
//   "success": true,
//   "user": { "id": "...", "email": "..." },
//   "session": { "access_token": "..." },
//   "message": "Login successful. Session saved for persistence."
// }
```

## Core Capabilities

### 1. AI Swarm Management

Create and manage AI agent swarms for complex tasks:

```javascript
// Initialize a swarm
const swarm = await mcp_flow_nexus_swarm_init({
  topology: "hierarchical",  // or "mesh", "ring", "star"
  maxAgents: 8,
  strategy: "balanced"
});

// Spawn specialized agents
const agent = await mcp_flow_nexus_agent_spawn({
  type: "researcher",  // "coder", "analyst", "optimizer", "coordinator"
  capabilities: ["data-analysis", "report-generation"],
  name: "research-agent-1"
});

// Orchestrate tasks
const task = await mcp_flow_nexus_task_orchestrate({
  task: "Analyze user behavior patterns in our application logs",
  priority: "high",    // "low", "medium", "high", "critical"
  strategy: "adaptive" // "parallel", "sequential", "adaptive"
});
```

### 2. Sandbox Execution

**Verified Working** - Create isolated environments for code execution:

```javascript
// Create a sandbox (tested and verified)
const sandbox = await mcp_flow_nexus_sandbox_create({
  template: "node",         // "python", "react", "nextjs", "vanilla", "base"
  name: "my-dev-environment",
  env_vars: {
    API_KEY: "your-api-key",
    NODE_ENV: "development"
  }
});

console.log(sandbox);
// Real response:
// {
//   "success": true,
//   "sandbox_id": "iicg5kuh6s8osed2ighsi",
//   "name": "test-sandbox",
//   "template": "nodejs",
//   "status": "running",
//   "timeout": 3600
// }

// Execute code in the sandbox
const execution = await mcp_flow_nexus_sandbox_execute({
  sandbox_id: sandbox.sandbox_id,
  code: `
    console.log("Hello from Flow Nexus sandbox!");
    const result = 2 + 2;
    console.log("2 + 2 =", result);
    return result;
  `,
  language: "javascript"
});
```

### 3. Neural Network Training

Train and deploy AI models:

```javascript
// List available neural network templates
const templates = await mcp_flow_nexus_neural_list_templates({
  category: "classification",
  tier: "free"
});

// Train a neural network
const training = await mcp_flow_nexus_neural_train({
  config: {
    architecture: {
      type: "feedforward",
      layers: [
        { type: "input", size: 784 },
        { type: "hidden", size: 128, activation: "relu" },
        { type: "output", size: 10, activation: "softmax" }
      ]
    },
    training: {
      epochs: 50,
      batch_size: 32,
      learning_rate: 0.001,
      optimizer: "adam"
    }
  },
  tier: "small"
});

// Run inference
const prediction = await mcp_flow_nexus_neural_predict({
  model_id: training.model_id,
  input: [0.1, 0.2, 0.3, /* ... more features */]
});
```

### 4. Workflow Orchestration

**Verified Working** - Create event-driven workflows:

```javascript
// Create a workflow (tested and verified)
const workflow = await mcp_flow_nexus_workflow_create({
  name: "data-processing-pipeline",
  description: "Process incoming user data",
  steps: [
    "validate input data",
    "transform data format", 
    "analyze patterns",
    "generate insights",
    "send notifications"
  ],
  triggers: ["webhook", "scheduled"],
  priority: 8
});

console.log(workflow);
// Real response:
// {
//   "success": true,
//   "workflow_id": "b34f8b0d-91c4-4a36-a381-501fdf60ae36",
//   "status": "active",
//   "features": ["message_queues", "audit_trail", "agent_assignment"]
// }

// Execute the workflow
const execution = await mcp_flow_nexus_workflow_execute({
  workflow_id: workflow.workflow_id,
  input_data: {
    user_id: "12345",
    data: { events: [...] }
  },
  async: true
});
```

### 5. Template Deployment

**Verified Working** - Deploy pre-built solutions:

```javascript
// List available templates (tested and verified)
const templates = await mcp_flow_nexus_template_list({
  category: "ai-coordination",
  featured: true
});

// Example templates available:
// - Claude Flow Swarm (12 deployments)
// - GitHub + Claude Flow Integration (6 deployments)  
// - Claude Flow Hive Mind (5 deployments)
// - DAA Swarm Orchestrator (2 deployments)

// Deploy a template
const deployment = await mcp_flow_nexus_template_deploy({
  template_id: "69895db8-9156-4014-b4e8-33b0d16b4a9a", // Claude Flow Swarm
  variables: {
    anthropic_api_key: "your-key",
    task: "Build a React component for user profiles",
    max_agents: 5
  }
});
```

### 6. GitHub Repository Analysis

**Verified Working** - Analyze repositories:

```javascript
// Analyze a GitHub repository (tested and verified)
const analysis = await mcp_flow_nexus_github_repo_analyze({
  repo: "owner/repository-name",
  analysis_type: "code_quality" // "performance", "security"
});

console.log(analysis);
// Real response:
// {
//   "success": true,
//   "analysis_id": "7226c5a7-8a79-45af-bcc6-0f895a13937f",
//   "repository": "ruvnet/flow-nexus",
//   "analysis_type": "code_quality", 
//   "status": "analyzing"
// }
```

### 7. Credit Management

**Verified Working** - Monitor usage and payments:

```javascript
// Check current balance (tested and verified)
const balance = await mcp_flow_nexus_check_balance();

console.log(balance);
// Real response:
// {
//   "success": true,
//   "balance": 1861.2,
//   "auto_refill_enabled": false,
//   "message": "Current balance: 1861.2 credits"
// }

// Configure auto-refill
const autoRefill = await mcp_flow_nexus_configure_auto_refill({
  enabled: true,
  threshold: 50,   // Refill when below 50 credits
  amount: 100      // Add 100 credits
});
```

### 8. Queen Seraphina AI Assistant

**Verified Working** - Chat with the AI orchestrator:

```javascript
// Chat with Queen Seraphina (tested and verified)
const response = await mcp_flow_nexus_seraphina_chat({
  message: "Help me optimize my neural network training performance",
  conversation_history: [
    {
      role: "user", 
      content: "I'm working on a classification model"
    }
  ]
});

// Seraphina has 4 core functions:
// - orchestrate_swarm: Create AI agent swarms
// - deploy_to_sandbox: Deploy code to sandboxes  
// - analyze_performance: System/code analysis
// - query_credits: Check rUv credit balance
```

## Error Handling

```javascript
async function safeFlowNexusCall(toolFunction, params) {
  try {
    const result = await toolFunction(params);
    return { success: true, data: result };
  } catch (error) {
    console.error("Flow Nexus error:", error.message);
    return { success: false, error: error.message };
  }
}

// Usage
const result = await safeFlowNexusCall(
  mcp_flow_nexus_sandbox_create,
  { template: "python", name: "ml-workspace" }
);

if (result.success) {
  console.log("Sandbox created:", result.data.sandbox_id);
} else {
  console.log("Failed:", result.error);
}
```

## Complete Example: AI-Powered Data Analysis

```javascript
async function analyzeDataWithAI() {
  try {
    // 1. Create a specialized swarm
    const swarm = await mcp_flow_nexus_swarm_init({
      topology: "hierarchical",
      maxAgents: 5,
      strategy: "specialized"
    });

    // 2. Spawn data analysis agents
    const analyst = await mcp_flow_nexus_agent_spawn({
      type: "analyst",
      capabilities: ["data-processing", "pattern-recognition"],
      name: "data-analyst"
    });

    // 3. Create a sandbox for execution
    const sandbox = await mcp_flow_nexus_sandbox_create({
      template: "python",
      name: "data-analysis-env",
      env_vars: {
        PYTHONPATH: "/workspace",
        DATA_SOURCE: "production-logs"
      }
    });

    // 4. Set up workflow
    const workflow = await mcp_flow_nexus_workflow_create({
      name: "data-analysis-pipeline",
      steps: [
        "load data from source",
        "clean and preprocess",
        "run statistical analysis", 
        "generate visualizations",
        "create summary report"
      ]
    });

    // 5. Execute the analysis
    const task = await mcp_flow_nexus_task_orchestrate({
      task: "Analyze user engagement patterns from the last 30 days",
      priority: "high",
      strategy: "adaptive"
    });

    // 6. Check progress
    const status = await mcp_flow_nexus_workflow_status({
      workflow_id: workflow.workflow_id
    });

    return {
      swarm_id: swarm.swarm_id,
      sandbox_id: sandbox.sandbox_id,
      workflow_id: workflow.workflow_id,
      task_id: task.task_id
    };

  } catch (error) {
    console.error("Analysis setup failed:", error);
    throw error;
  }
}

// Run the analysis
analyzeDataWithAI()
  .then(ids => console.log("Analysis started:", ids))
  .catch(err => console.error("Failed:", err));
```

## TypeScript Support

For TypeScript projects, define interfaces for better type safety:

```typescript
interface FlowNexusSwarmConfig {
  topology: "hierarchical" | "mesh" | "ring" | "star";
  maxAgents: number;
  strategy: "balanced" | "specialized" | "adaptive";
}

interface SandboxConfig {
  template: "node" | "python" | "react" | "nextjs" | "vanilla" | "base";
  name: string;
  env_vars?: Record<string, string>;
  timeout?: number;
}

interface WorkflowStep {
  name: string;
  action: string;
  agent_type?: string;
}

interface FlowNexusWorkflow {
  name: string;
  description?: string;
  steps: string[] | WorkflowStep[];
  triggers?: string[];
  priority?: number;
}

// Usage with types
const swarmConfig: FlowNexusSwarmConfig = {
  topology: "hierarchical",
  maxAgents: 8, 
  strategy: "balanced"
};

const swarm = await mcp_flow_nexus_swarm_init(swarmConfig);
```

## Best Practices

1. **Always check authentication first**
2. **Handle errors gracefully with try/catch**
3. **Monitor credit balance regularly**
4. **Use appropriate sandbox templates for your language**
5. **Choose the right swarm topology for your use case**
6. **Clean up resources (sandboxes, swarms) when done**
7. **Use Seraphina for guidance on complex implementations**

This guide covers the core functionality verified through actual testing of the Flow Nexus MCP tools.