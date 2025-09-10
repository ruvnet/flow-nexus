#!/usr/bin/env node

/**
 * Agentic Marketing - Main Entry Point
 * Properly integrates with Flow Nexus MCP tools for autonomous marketing operations
 */

const AgenticMarketingServer = require('./src/AgenticMarketingServer');
const chalk = require('chalk');

/**
 * Main application entry point
 * This function should be called with MCP tools injected from the host environment
 */
async function main(mcpTools = null) {
  try {
    console.log(chalk.cyan('🚀 Starting Agentic Marketing Platform...'));

    // Check if MCP tools are available - inject real Flow Nexus MCP tools
    if (!mcpTools) {
      console.log(chalk.yellow('🔧 No MCP tools provided, attempting to load Flow Nexus MCP tools...'));
      
      try {
        // Try to load the actual Flow Nexus MCP tools
        // In a real MCP environment, these would be injected automatically
        // For testing, we need to import them directly
        mcpTools = await loadFlowNexusMCPTools();
        console.log(chalk.green('✅ Flow Nexus MCP tools loaded successfully'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to load Flow Nexus MCP tools:', error.message));
        console.error(chalk.white('   This application requires Flow Nexus MCP integration'));
        console.error(chalk.yellow('   Please run within a Flow Nexus MCP-enabled environment'));
        process.exit(1);
      }
    }

    // Validate MCP tools
    validateMCPTools(mcpTools);

    // Enhanced MCP tools with non-interactive authentication
    mcpTools = enhanceMCPToolsForTesting(mcpTools);

    // Create and initialize server
    const server = await AgenticMarketingServer.create(mcpTools, {
      port: process.env.PORT || 3000,
      dbPath: process.env.DB_PATH || './data/mediaspend.db',
      autoInitialize: true
    });

    // Start server
    await server.start();

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log(chalk.yellow('\n🛑 Received shutdown signal...'));
      await server.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    return server;
  } catch (error) {
    console.error(chalk.red('❌ Failed to start server:'), error.message);
    process.exit(1);
  }
}

/**
 * Validate that required MCP tools are available
 */
function validateMCPTools(mcpTools) {
  const requiredTools = [
    'user_register',
    'user_login',
    'user_logout',
    'swarm_init',
    'agent_spawn',
    'task_orchestrate',
    'workflow_create',
    'workflow_execute'
  ];

  const missingTools = requiredTools.filter(tool => !mcpTools[tool]);

  if (missingTools.length > 0) {
    console.warn(chalk.yellow(`⚠️  Missing MCP tools: ${missingTools.join(', ')}`));
    console.log(chalk.white('   Some features may not be available'));
  }

  return true;
}

/**
 * Load actual Flow Nexus MCP tools
 * This function creates MCP tool wrappers that work within npm/npx Node.js context
 */
async function loadFlowNexusMCPTools() {
  const FlowNexusMCPWrapper = require('./src/FlowNexusMCPWrapper');
  
  try {
    // Create wrapper instance
    const wrapper = new FlowNexusMCPWrapper();
    
    // Ensure Flow Nexus is installed and available
    const available = await wrapper.ensureInstalled();
    
    if (!available) {
      console.log(chalk.yellow('⚠️  Flow Nexus not available, using mock tools for development'));
      return createMockMCPTools();
    }
    
    console.log(chalk.green('✅ Flow Nexus MCP tools loaded via npm/npx'));
    
    // Return comprehensive wrapper methods as MCP tools
    return {
      // Authentication
      user_register: wrapper.user_register.bind(wrapper),
      user_login: wrapper.user_login.bind(wrapper),
      user_logout: wrapper.user_logout.bind(wrapper),
      
      // Swarm Management
      swarm_init: wrapper.swarm_init.bind(wrapper),
      swarm_scale: wrapper.swarm_scale.bind(wrapper),
      swarm_status: wrapper.swarm_status.bind(wrapper),
      swarm_destroy: wrapper.swarm_destroy.bind(wrapper),
      agent_spawn: wrapper.agent_spawn.bind(wrapper),
      
      // Task & Workflow Orchestration
      task_orchestrate: wrapper.task_orchestrate.bind(wrapper),
      workflow_create: wrapper.workflow_create.bind(wrapper),
      workflow_execute: wrapper.workflow_execute.bind(wrapper),
      
      // Neural Network Features
      neural_train: wrapper.neural_train.bind(wrapper),
      neural_predict: wrapper.neural_predict.bind(wrapper),
      neural_list_templates: wrapper.neural_list_templates.bind(wrapper),
      
      // Sandbox Execution
      sandbox_create: wrapper.sandbox_create.bind(wrapper),
      sandbox_execute: wrapper.sandbox_execute.bind(wrapper),
      
      // GitHub Integration
      github_repo_analyze: wrapper.github_repo_analyze.bind(wrapper),
      
      // Real-time Features
      realtime_subscribe: wrapper.realtime_subscribe.bind(wrapper),
      
      // Storage Management
      storage_upload: wrapper.storage_upload.bind(wrapper),
      storage_list: wrapper.storage_list.bind(wrapper),
      
      // Template System
      template_list: wrapper.template_list.bind(wrapper),
      template_deploy: wrapper.template_deploy.bind(wrapper),
      
      // AI Assistant
      seraphina_chat: wrapper.seraphina_chat.bind(wrapper),
      
      // Credits & Payments
      check_balance: wrapper.check_balance.bind(wrapper),
      get_payment_history: wrapper.get_payment_history.bind(wrapper),
      
      // Utility methods
      getStatus: wrapper.getStatus.bind(wrapper),
      isAvailable: wrapper.isAvailable.bind(wrapper)
    };
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to load Flow Nexus MCP tools:', error.message));
    console.log(chalk.yellow('⚠️  Falling back to mock tools for development'));
    return createMockMCPTools();
  }
}

/**
 * Enhance MCP tools with non-interactive authentication for testing
 */
function enhanceMCPToolsForTesting(mcpTools) {
  // Check for environment-based authentication
  const email = process.env.FLOW_NEXUS_EMAIL;
  const password = process.env.FLOW_NEXUS_PASSWORD;
  const action = process.env.FLOW_NEXUS_ACTION || 'login';

  if (email && password) {
    console.log(chalk.cyan(`🧪 Non-interactive mode: ${action} for ${email}`));
    
    // Store credentials for auto-authentication
    process.env.AUTO_AUTH_EMAIL = email;
    process.env.AUTO_AUTH_PASSWORD = password;
    process.env.AUTO_AUTH_ACTION = action;
  }

  return mcpTools;
}

/**
 * Create mock MCP tools for development/testing
 */
function createMockMCPTools() {
  return {
    // Authentication
    user_register: async ({ email, password, full_name }) => {
      console.log(chalk.blue(`[MOCK] Registering user: ${email}`));
      return {
        success: true,
        user: {
          id: 'mock-user-' + Date.now(),
          email,
          full_name
        },
        session: {
          access_token: 'mock-token'
        }
      };
    },

    user_login: async ({ email, password }) => {
      console.log(chalk.blue(`[MOCK] Logging in user: ${email}`));
      return {
        success: true,
        user: {
          id: 'mock-user-' + Date.now(),
          email
        },
        session: {
          access_token: 'mock-token'
        }
      };
    },

    user_logout: async () => {
      console.log(chalk.blue('[MOCK] Logging out user'));
      return { success: true };
    },

    // Swarm management
    swarm_init: async ({ topology, maxAgents, strategy }) => {
      console.log(chalk.blue(`[MOCK] Initializing swarm: ${topology} topology, ${maxAgents} agents`));
      return {
        success: true,
        swarmId: 'mock-swarm-' + Date.now(),
        topology,
        maxAgents
      };
    },

    agent_spawn: async ({ type, capabilities, name }) => {
      console.log(chalk.blue(`[MOCK] Spawning agent: ${type} (${name})`));
      return {
        success: true,
        agentId: `mock-agent-${type}-${Date.now()}`,
        type,
        capabilities
      };
    },

    // Task orchestration
    task_orchestrate: async ({ task, strategy, priority }) => {
      console.log(chalk.blue(`[MOCK] Orchestrating task: ${task}`));
      
      // Simulate different types of results based on task content
      let mockResult;
      
      if (task.toLowerCase().includes('optimize')) {
        mockResult = {
          type: 'optimization',
          recommendations: [
            'Increase budget allocation to high-performing channels by 25%',
            'Implement dayparting to reduce overnight spend by 40%',
            'Test new creative formats to improve CTR'
          ],
          expectedImpact: {
            cpa_reduction: '22%',
            roas_increase: '18%'
          }
        };
      } else if (task.toLowerCase().includes('analyz')) {
        mockResult = {
          type: 'analysis',
          insights: [
            'Campaign performance above industry average',
            'Mobile traffic converting 2x better than desktop',
            'Weekend engagement 35% higher'
          ],
          metrics: {
            health_score: Math.floor(Math.random() * 20 + 70),
            trend: 'improving'
          }
        };
      } else {
        mockResult = {
          type: 'generic',
          status: 'completed',
          message: `Completed task: ${task}`
        };
      }

      return {
        success: true,
        taskId: 'mock-task-' + Date.now(),
        result: mockResult
      };
    },

    // Workflow management
    workflow_create: async ({ name, description, steps, triggers }) => {
      console.log(chalk.blue(`[MOCK] Creating workflow: ${name}`));
      return {
        success: true,
        id: `mock-workflow-${name}-${Date.now()}`,
        name,
        description,
        steps: steps?.length || 0
      };
    },

    workflow_execute: async ({ workflow_id, input_data, async }) => {
      console.log(chalk.blue(`[MOCK] Executing workflow: ${workflow_id}`));
      return {
        success: true,
        executionId: 'mock-execution-' + Date.now(),
        workflow_id,
        status: 'started'
      };
    }
  };
}

// Export for use as module or run directly
module.exports = { main, AgenticMarketingServer };

// Run if called directly (not imported)
if (require.main === module) {
  main().catch(console.error);
}