# Workflow Orchestration

Advanced workflow management with event-driven processing, message queues, and intelligent agent coordination.

## MCP Tools for Workflow Management

Flow Nexus provides 8 specialized MCP tools for workflow orchestration:

- `mcp__flow-nexus__workflow_create` - Create advanced workflows
- `mcp__flow-nexus__workflow_execute` - Execute workflows with queues
- `mcp__flow-nexus__workflow_status` - Monitor execution status
- `mcp__flow-nexus__workflow_list` - List available workflows
- `mcp__flow-nexus__workflow_agent_assign` - Assign optimal agents
- `mcp__flow-nexus__workflow_queue_status` - Check message queues
- `mcp__flow-nexus__workflow_audit_trail` - Get execution history

## Workflow Creation

### Basic Workflow Setup

Create event-driven workflows with agent assignments:

```javascript
// Create data processing workflow
const workflow = await client.workflows.create({
  name: 'Data Processing Pipeline',
  description: 'Process and analyze customer data',
  steps: [
    {
      name: 'data_extraction',
      type: 'agent',
      agent_type: 'researcher',
      description: 'Extract data from multiple sources'
    },
    {
      name: 'data_processing', 
      type: 'agent',
      agent_type: 'analyst',
      description: 'Clean and process extracted data'
    },
    {
      name: 'report_generation',
      type: 'agent',
      agent_type: 'coder',
      description: 'Generate comprehensive reports'
    }
  ],
  triggers: [
    {
      type: 'schedule',
      cron: '0 9 * * 1' // Every Monday at 9 AM
    }
  ],
  priority: 5
});

console.log('Workflow created:', workflow);
```

**SDK Response Example:**
```javascript
{
  success: true,
  workflow_id: 'workflow_abc123',
  name: 'Data Processing Pipeline',
  description: 'Process and analyze customer data',
  status: 'active',
  priority: 5,
  features: [
    'message_queues',
    'audit_trail', 
    'agent_assignment',
    'real_time_monitoring'
  ],
  estimated_execution_time: '15-30 minutes',
  created_at: '2024-12-10T09:00:00Z'
}
```

### Advanced Workflow Configuration

```javascript
// Complex multi-step workflow with dependencies
const advancedWorkflow = await client.workflows.create({
  name: 'AI Model Training Pipeline',
  description: 'End-to-end ML model training and deployment',
  steps: [
    {
      name: 'data_preparation',
      type: 'agent',
      agent_type: 'researcher',
      timeout: 1800,
      retry_attempts: 3
    },
    {
      name: 'model_training',
      type: 'neural',
      depends_on: ['data_preparation'],
      config: {
        architecture: 'transformer',
        epochs: 50
      }
    },
    {
      name: 'model_validation',
      type: 'agent',
      agent_type: 'tester',
      depends_on: ['model_training'],
      validation_threshold: 0.85
    },
    {
      name: 'deployment',
      type: 'sandbox',
      depends_on: ['model_validation'],
      template: 'production-api'
    }
  ],
  triggers: [
    {
      type: 'webhook',
      url: '/api/trigger/training',
      auth_required: true
    },
    {
      type: 'file_upload',
      path: '/data/training/*'
    }
  ],
  metadata: {
    team: 'ml-engineering',
    project: 'customer-ai',
    environment: 'production'
  }
});
```

## Workflow Execution

### Execute with Input Data

Run workflows with custom input parameters:

```javascript
// Execute workflow with specific data
const execution = await client.workflows.execute({
  workflow_id: 'workflow_abc123',
  input_data: {
    dataset: 'customer_analytics',
    date_range: '2024-Q1',
    output_format: 'pdf'
  },
  async: true, // Execute via message queue
  priority: 'high'
});

console.log('Execution started:', execution);
```

**SDK Response Example:**
```javascript
{
  success: true,
  execution_id: 'exec_def456',
  workflow_id: 'workflow_abc123',
  workflow_name: 'Data Processing Pipeline',
  status: 'running',
  started_at: '2024-12-10T14:30:00Z',
  estimated_completion: '2024-12-10T15:00:00Z',
  queue_position: 2,
  steps_total: 3,
  steps_completed: 0,
  current_step: 'data_extraction'
}
```

### Synchronous Execution

```javascript
// Wait for workflow completion
const result = await client.workflows.execute({
  workflow_id: 'workflow_abc123',
  input_data: { dataset: 'small_sample' },
  async: false, // Synchronous execution
  timeout: 300000 // 5 minutes
});

console.log('Workflow completed:', result);
```

## Workflow Monitoring

### Check Execution Status

Monitor workflow progress in real-time:

```javascript
// Get detailed execution status
const status = await client.workflows.getStatus({
  execution_id: 'exec_def456',
  include_metrics: true
});

console.log('Execution status:', status);
```

**SDK Response Example:**
```javascript
{
  success: true,
  execution_id: 'exec_def456',
  workflow_id: 'workflow_abc123',
  status: 'running',
  progress: 67, // Percentage complete
  current_step: {
    name: 'data_processing',
    status: 'in_progress',
    started_at: '2024-12-10T14:45:00Z',
    agent_id: 'agent_analyst_789',
    progress: 85
  },
  completed_steps: [
    {
      name: 'data_extraction',
      status: 'completed',
      duration: 780, // seconds
      agent_id: 'agent_researcher_456',
      output_size: '2.3 MB'
    }
  ],
  pending_steps: [
    {
      name: 'report_generation',
      status: 'pending',
      estimated_start: '2024-12-10T14:55:00Z'
    }
  ],
  metrics: {
    total_execution_time: 1200,
    credits_used: 15.4,
    data_processed: '45.2 MB',
    agent_switches: 2
  }
}
```

### List All Workflows

```javascript
// List workflows with filtering
const workflows = await client.workflows.list({
  status: 'active',
  limit: 20,
  offset: 0,
  sort_by: 'created_at',
  order: 'desc'
});

console.log('Available workflows:', workflows);
```

**SDK Response Example:**
```javascript
{
  success: true,
  workflows: [
    {
      id: 'workflow_abc123',
      name: 'Data Processing Pipeline',
      description: 'Process and analyze customer data',
      status: 'active',
      executions_count: 47,
      last_executed: '2024-12-10T14:30:00Z',
      success_rate: 94.7,
      average_duration: 1850
    },
    {
      id: 'workflow_xyz789',
      name: 'Content Generation Flow',
      description: 'AI-powered content creation',
      status: 'active',
      executions_count: 23,
      last_executed: '2024-12-09T16:20:00Z',
      success_rate: 98.1,
      average_duration: 420
    }
  ],
  total_count: 15,
  has_more: false
}
```

## Agent Assignment

### Optimal Agent Selection

Automatically assign best-suited agents to workflow tasks:

```javascript
// Assign optimal agent using AI matching
const assignment = await client.workflows.assignAgent({
  task_id: 'task_def456',
  agent_type: 'researcher', // Preferred type
  use_vector_similarity: true, // Use AI matching
  requirements: {
    skills: ['data_analysis', 'web_scraping'],
    experience_level: 'intermediate',
    availability: 'immediate'
  }
});

console.log('Agent assigned:', assignment);
```

**SDK Response Example:**
```javascript
{
  success: true,
  task_id: 'task_def456',
  assigned_agent: {
    id: 'agent_researcher_892',
    type: 'researcher',
    name: 'DataAnalyzer-Pro',
    capabilities: [
      'data_analysis',
      'web_scraping', 
      'report_generation',
      'statistical_modeling'
    ],
    experience_score: 0.87,
    availability: 'immediate',
    estimated_completion: '2024-12-10T15:15:00Z'
  },
  match_score: 0.94,
  alternatives: [
    {
      agent_id: 'agent_researcher_445',
      match_score: 0.89,
      reason: 'High data analysis skills, but lower web scraping experience'
    }
  ]
}
```

### Manual Agent Assignment

```javascript
// Manually assign specific agent
const manualAssignment = await client.workflows.assignAgent({
  task_id: 'task_ghi789',
  agent_id: 'agent_specialist_123',
  force: true // Override automatic selection
});
```

## Message Queue Management

### Check Queue Status

Monitor workflow message queues:

```javascript
// Get queue status and pending messages
const queueStatus = await client.workflows.getQueueStatus({
  queue_name: 'workflow_executions', // Optional specific queue
  include_messages: true
});

console.log('Queue status:', queueStatus);
```

**SDK Response Example:**
```javascript
{
  success: true,
  queues: [
    {
      name: 'workflow_executions',
      status: 'healthy',
      pending_messages: 8,
      processing_messages: 3,
      completed_today: 156,
      failed_today: 2,
      average_processing_time: 245,
      oldest_message_age: 45 // seconds
    },
    {
      name: 'agent_assignments',
      status: 'healthy',
      pending_messages: 2,
      processing_messages: 1,
      completed_today: 89,
      failed_today: 0,
      average_processing_time: 15
    }
  ],
  system_health: 'optimal',
  throughput_per_minute: 12.4
}
```

### Queue Metrics

```javascript
// Get detailed queue analytics
const queueMetrics = await client.workflows.getQueueMetrics({
  timeframe: '24h',
  include_breakdown: true
});

console.log('Queue performance:', queueMetrics);
```

## Audit Trail

### Execution History

Track complete workflow execution history:

```javascript
// Get audit trail for workflow
const auditTrail = await client.workflows.getAuditTrail({
  workflow_id: 'workflow_abc123',
  limit: 50,
  start_time: '2024-12-01T00:00:00Z',
  include_details: true
});

console.log('Audit trail:', auditTrail);
```

**SDK Response Example:**
```javascript
{
  success: true,
  workflow_id: 'workflow_abc123',
  events: [
    {
      event_id: 'evt_123',
      type: 'execution_started',
      timestamp: '2024-12-10T14:30:00Z',
      execution_id: 'exec_def456',
      user_id: 'user_789',
      details: {
        input_data_size: '1.2 MB',
        triggered_by: 'manual',
        priority: 'high'
      }
    },
    {
      event_id: 'evt_124',
      type: 'step_completed',
      timestamp: '2024-12-10T14:43:00Z',
      step_name: 'data_extraction',
      agent_id: 'agent_researcher_456',
      details: {
        duration: 780,
        output_size: '2.3 MB',
        records_processed: 15420
      }
    },
    {
      event_id: 'evt_125',
      type: 'agent_assigned',
      timestamp: '2024-12-10T14:43:15Z',
      step_name: 'data_processing',
      agent_id: 'agent_analyst_789',
      details: {
        assignment_method: 'automatic',
        match_score: 0.92
      }
    }
  ],
  total_events: 156,
  execution_summary: {
    total_executions: 47,
    success_rate: 94.7,
    average_duration: 1850,
    total_credits_used: 524.8
  }
}
```

## Workflow Templates

### Pre-built Workflow Templates

```javascript
// List available workflow templates
const templates = await client.workflows.listTemplates({
  category: 'data-processing',
  featured: true
});

console.log('Workflow templates:', templates);
```

**SDK Response Example:**
```javascript
{
  success: true,
  templates: [
    {
      id: 'template_data_pipeline',
      name: 'Data Processing Pipeline',
      description: 'Extract, transform, and analyze data',
      category: 'data-processing',
      steps_count: 4,
      estimated_duration: '20-40 minutes',
      complexity: 'intermediate',
      tags: ['etl', 'analytics', 'reporting'],
      usage_count: 234,
      rating: 4.8
    },
    {
      id: 'template_content_gen',
      name: 'AI Content Generation',
      description: 'Generate and review content using AI',
      category: 'content-creation',
      steps_count: 3,
      estimated_duration: '5-15 minutes',
      complexity: 'beginner',
      tags: ['ai', 'content', 'marketing'],
      usage_count: 189,
      rating: 4.6
    }
  ]
}
```

### Create from Template

```javascript
// Create workflow from template
const workflowFromTemplate = await client.workflows.createFromTemplate({
  template_id: 'template_data_pipeline',
  name: 'Customer Analytics Pipeline',
  customizations: {
    data_source: 'customer_database',
    output_format: 'dashboard',
    schedule: '0 8 * * 1-5' // Weekdays at 8 AM
  }
});
```

## Error Handling

```javascript
try {
  await client.workflows.execute({ workflow_id: 'invalid_id' });
} catch (error) {
  switch (error.code) {
    case 'WORKFLOW_NOT_FOUND':
      console.log('Specified workflow does not exist');
      break;
    case 'INSUFFICIENT_CREDITS':
      console.log('Not enough credits to execute workflow');
      break;
    case 'AGENT_UNAVAILABLE':
      console.log('Required agents are not available');
      break;
    case 'EXECUTION_TIMEOUT':
      console.log('Workflow execution timed out');
      break;
    case 'INVALID_INPUT_DATA':
      console.log('Input data validation failed:', error.details);
      break;
    case 'QUEUE_FULL':
      console.log('Execution queue is at capacity');
      break;
    default:
      console.error('Workflow error:', error.message);
  }
}
```

## Best Practices

### 1. Workflow Design

```javascript
// Design resilient workflows
const resilientWorkflow = {
  name: 'Resilient Processing Pipeline',
  steps: [
    {
      name: 'data_extraction',
      type: 'agent',
      retry_attempts: 3,
      timeout: 1800,
      fallback_agent_type: 'researcher'
    },
    {
      name: 'data_validation',
      type: 'validation',
      required: true,
      validation_rules: ['not_empty', 'format_check']
    }
  ],
  error_handling: {
    on_failure: 'retry_with_different_agent',
    max_retries: 2,
    notification: true
  }
};
```

### 2. Performance Optimization

```javascript
// Optimize workflow performance
async function optimizeWorkflowExecution(workflowId) {
  // Check current performance
  const metrics = await client.workflows.getMetrics(workflowId);
  
  if (metrics.average_duration > 3600) {
    // Parallelize steps where possible
    await client.workflows.updateConfiguration(workflowId, {
      parallel_execution: true,
      max_concurrent_steps: 3
    });
  }
  
  if (metrics.agent_utilization < 0.7) {
    // Optimize agent assignments
    await client.workflows.enableAutoOptimization(workflowId);
  }
}
```

### 3. Cost Management

```javascript
// Monitor and control costs
async function monitorWorkflowCosts(workflowId) {
  const costAnalysis = await client.workflows.getCostAnalysis({
    workflow_id: workflowId,
    timeframe: '30d'
  });
  
  if (costAnalysis.average_cost_per_execution > 50) {
    console.warn('High execution costs detected');
    
    // Implement cost optimization
    await client.workflows.updateConfiguration(workflowId, {
      agent_tier_preference: 'cost_optimized',
      timeout_optimization: true
    });
  }
}
```

### 4. Real-time Monitoring

```javascript
// Set up real-time monitoring
class WorkflowMonitor {
  constructor(workflowId) {
    this.workflowId = workflowId;
    this.setupRealTimeMonitoring();
  }
  
  async setupRealTimeMonitoring() {
    // Subscribe to workflow events
    await client.workflows.subscribe({
      workflow_id: this.workflowId,
      events: ['step_completed', 'execution_failed', 'agent_assigned'],
      callback: this.handleWorkflowEvent.bind(this)
    });
  }
  
  handleWorkflowEvent(event) {
    switch (event.type) {
      case 'execution_failed':
        this.alertTeam(event);
        break;
      case 'step_completed':
        this.updateDashboard(event);
        break;
    }
  }
}
```

## Advanced Features

### Conditional Workflows

```javascript
// Create conditional workflow logic
const conditionalWorkflow = await client.workflows.create({
  name: 'Smart Data Processing',
  steps: [
    {
      name: 'data_assessment',
      type: 'agent',
      agent_type: 'researcher'
    },
    {
      name: 'processing_branch',
      type: 'conditional',
      conditions: [
        {
          if: 'data_size > 100MB',
          then: 'heavy_processing_path',
          else: 'light_processing_path'
        }
      ]
    }
  ]
});
```

### Parallel Execution

```javascript
// Execute multiple workflows in parallel
const parallelExecutions = await Promise.all([
  client.workflows.execute({
    workflow_id: 'workflow_1',
    input_data: { batch: 'A' }
  }),
  client.workflows.execute({
    workflow_id: 'workflow_2', 
    input_data: { batch: 'B' }
  }),
  client.workflows.execute({
    workflow_id: 'workflow_3',
    input_data: { batch: 'C' }
  })
]);
```

## Next Steps

- [Sandbox Execution](../sandbox/sandbox-execution.md) - Code execution environments
- [GitHub Integration](../github/github-automation.md) - Repository workflows
- [Neural Networks](../neural/neural-training.md) - AI workflows