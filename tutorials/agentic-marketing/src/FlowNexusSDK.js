/**
 * Flow Nexus SDK - Modular interface for Flow Nexus MCP tools
 * Handles authentication, swarm management, and workflow orchestration
 */

const EventEmitter = require('events');

class FlowNexusSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.authenticated = false;
    this.user = null;
    this.session = null;
    this.swarmId = null;
    this.agents = new Map();
    this.workflows = new Map();
    
    // MCP function references - these will be injected by the application
    this.mcp = null;
    this.dbManager = null;
    this.initialized = false;
  }

  /**
   * Initialize the SDK with MCP tool references and database manager
   * This should be called by the main application after MCP tools are available
   */
  initialize(mcpTools, dbManager = null) {
    if (!mcpTools) {
      throw new Error('MCP tools are required for Flow Nexus SDK initialization');
    }
    
    this.mcp = mcpTools;
    this.dbManager = dbManager;
    this.initialized = true;
    this.emit('initialized');
    return this;
  }

  /**
   * Check if the SDK is properly initialized
   */
  ensureInitialized() {
    if (!this.initialized || !this.mcp) {
      throw new Error('Flow Nexus SDK not initialized. Call initialize() with MCP tools first.');
    }
  }

  /**
   * Authentication methods
   */
  async register(email, password, fullName) {
    this.ensureInitialized();
    
    try {
      const result = await this.mcp.user_register({
        email,
        password,
        full_name: fullName || 'Agentic Marketing User'
      });

      if (result.success) {
        this.authenticated = true;
        this.user = result.user;
        this.session = result.session;
        
        // Save session to database if available
        if (this.dbManager) {
          await this.dbManager.saveSession({ user: this.user, session: this.session });
        }
        
        this.emit('authenticated', { user: this.user, action: 'register' });
        
        // Auto-initialize swarm after registration
        await this.autoInitializeInfrastructure();
        
        return {
          success: true,
          user: this.user,
          credits: 256, // New user bonus
          message: 'Registration successful! You have 256 free credits.'
        };
      }
      
      throw new Error(result.error || 'Registration failed');
    } catch (error) {
      this.emit('error', { type: 'authentication', error: error.message });
      throw error;
    }
  }

  async login(email, password) {
    this.ensureInitialized();
    
    try {
      const result = await this.mcp.user_login({ email, password });

      if (result.success) {
        this.authenticated = true;
        this.user = result.user || { email, id: 'mock-user-' + Date.now() };
        this.session = result.session || { access_token: 'mock-token' };
        
        // Save session to database if available
        if (this.dbManager) {
          await this.dbManager.saveSession({ user: this.user, session: this.session });
        }
        
        this.emit('authenticated', { user: this.user, action: 'login' });
        
        // Auto-initialize swarm after login
        await this.autoInitializeInfrastructure();
        
        return {
          success: true,
          user: this.user,
          message: 'Login successful!'
        };
      }
      
      throw new Error(result.error || 'Login failed');
    } catch (error) {
      this.emit('error', { type: 'authentication', error: error.message });
      throw error;
    }
  }

  async logout() {
    try {
      if (this.initialized && this.mcp.user_logout) {
        await this.mcp.user_logout();
      }
    } catch (error) {
      // Ignore logout errors
    }
    
    // Clear database session if available
    if (this.dbManager) {
      await this.dbManager.clearSession();
    }
    
    this.authenticated = false;
    this.user = null;
    this.session = null;
    this.swarmId = null;
    this.agents.clear();
    this.workflows.clear();
    
    this.emit('logout');
    
    return { success: true, message: 'Logout successful' };
  }

  /**
   * Auto-initialize infrastructure after authentication
   */
  async autoInitializeInfrastructure() {
    try {
      // Initialize swarm for media operations
      await this.initializeMediaSwarm();
      
      // Create standard media workflows
      await this.createMediaWorkflows();
      
      this.emit('infrastructure:ready');
    } catch (error) {
      console.error('Error auto-initializing infrastructure:', error.message);
      this.emit('error', { type: 'infrastructure', error: error.message });
    }
  }

  /**
   * Swarm management
   */
  async initializeMediaSwarm() {
    if (!this.authenticated) {
      throw new Error('Authentication required for swarm initialization');
    }
    
    this.ensureInitialized();
    
    try {
      // Initialize swarm with hierarchical topology for media operations
      const swarmResult = await this.mcp.swarm_init({
        topology: 'hierarchical',
        maxAgents: 8,
        strategy: 'specialized'
      });
      
      this.swarmId = swarmResult.swarmId || `swarm-${Date.now()}`;
      
      // Save swarm to database if available
      if (this.dbManager) {
        await this.dbManager.saveSwarm({
          swarmId: this.swarmId,
          topology: 'hierarchical',
          maxAgents: 8,
          strategy: 'specialized'
        });
      }
      
      // Spawn specialized media agents
      const mediaAgents = [
        { type: 'researcher', capabilities: ['market-research', 'competitor-analysis'] },
        { type: 'analyst', capabilities: ['performance-analysis', 'anomaly-detection'] },
        { type: 'optimizer', capabilities: ['budget-optimization', 'bid-management'] },
        { type: 'coordinator', capabilities: ['workflow-management', 'task-orchestration'] }
      ];

      for (const agentConfig of mediaAgents) {
        try {
          const agent = await this.mcp.agent_spawn({
            type: agentConfig.type,
            capabilities: agentConfig.capabilities,
            name: `media-${agentConfig.type}`
          });
          
          const agentData = {
            id: agent.agentId || `${agentConfig.type}-${Date.now()}`,
            swarmId: this.swarmId,
            type: agentConfig.type,
            name: `media-${agentConfig.type}`,
            capabilities: agentConfig.capabilities,
            status: 'active'
          };
          
          this.agents.set(agentData.id, agentData);
          
          // Save agent to database if available
          if (this.dbManager) {
            await this.dbManager.saveAgent(agentData);
          }
        } catch (agentError) {
          console.warn(`Failed to spawn ${agentConfig.type} agent:`, agentError.message);
        }
      }
      
      this.emit('swarm:initialized', {
        swarmId: this.swarmId,
        agents: Array.from(this.agents.values())
      });
      
      return {
        success: true,
        swarmId: this.swarmId,
        agentCount: this.agents.size
      };
    } catch (error) {
      this.emit('error', { type: 'swarm', error: error.message });
      throw error;
    }
  }

  /**
   * Workflow management
   */
  async createMediaWorkflows() {
    if (!this.authenticated) {
      throw new Error('Authentication required for workflow creation');
    }
    
    this.ensureInitialized();
    
    try {
      // Campaign optimization workflow
      const optimizationWorkflow = await this.mcp.workflow_create({
        name: 'campaign-optimization',
        description: 'AI-powered campaign optimization and budget reallocation',
        steps: [
          {
            name: 'performance-analysis',
            agent_type: 'analyst',
            description: 'Analyze current campaign performance metrics'
          },
          {
            name: 'optimization-recommendations',
            agent_type: 'optimizer',
            description: 'Generate optimization recommendations'
          },
          {
            name: 'budget-reallocation',
            agent_type: 'optimizer',
            description: 'Execute budget reallocation based on recommendations'
          }
        ],
        triggers: ['daily', 'budget_threshold', 'performance_anomaly']
      });
      
      // Anomaly detection workflow
      const anomalyWorkflow = await this.mcp.workflow_create({
        name: 'anomaly-detection',
        description: 'Automated spend anomaly detection and alerting',
        steps: [
          {
            name: 'data-collection',
            agent_type: 'researcher',
            description: 'Collect latest spend and performance data'
          },
          {
            name: 'anomaly-analysis',
            agent_type: 'analyst',
            description: 'Detect spending anomalies using ML models'
          },
          {
            name: 'alert-generation',
            agent_type: 'coordinator',
            description: 'Generate alerts for detected anomalies'
          }
        ],
        triggers: ['hourly', 'real_time']
      });
      
      this.workflows.set('campaign-optimization', optimizationWorkflow);
      this.workflows.set('anomaly-detection', anomalyWorkflow);
      
      // Save workflows to database if available
      if (this.dbManager) {
        await this.dbManager.saveWorkflow(optimizationWorkflow);
        await this.dbManager.saveWorkflow(anomalyWorkflow);
      }
      
      this.emit('workflows:created', {
        workflows: Array.from(this.workflows.keys())
      });
      
      return {
        success: true,
        workflows: Array.from(this.workflows.keys())
      };
    } catch (error) {
      this.emit('error', { type: 'workflow', error: error.message });
      throw error;
    }
  }

  /**
   * Task orchestration
   */
  async orchestrateTask(task, options = {}) {
    if (!this.authenticated) {
      throw new Error('Authentication required for task orchestration');
    }
    
    this.ensureInitialized();
    
    try {
      const result = await this.mcp.task_orchestrate({
        task,
        strategy: options.strategy || 'adaptive',
        priority: options.priority || 'medium',
        maxAgents: options.maxAgents || 3
      });
      
      this.emit('task:started', { taskId: result.taskId, task });
      
      return result;
    } catch (error) {
      this.emit('error', { type: 'task', error: error.message });
      throw error;
    }
  }

  /**
   * Execute predefined workflows
   */
  async executeWorkflow(workflowName, inputData = {}) {
    if (!this.authenticated) {
      throw new Error('Authentication required for workflow execution');
    }
    
    if (!this.workflows.has(workflowName)) {
      throw new Error(`Workflow '${workflowName}' not found`);
    }
    
    this.ensureInitialized();
    
    try {
      const workflow = this.workflows.get(workflowName);
      const result = await this.mcp.workflow_execute({
        workflow_id: workflow.id || workflowName,
        input_data: inputData,
        async: true
      });
      
      this.emit('workflow:started', { workflowName, executionId: result.executionId });
      
      return result;
    } catch (error) {
      this.emit('error', { type: 'workflow', error: error.message });
      throw error;
    }
  }

  /**
   * Utility methods
   */
  isAuthenticated() {
    return this.authenticated;
  }

  hasActiveSwarm() {
    return !!this.swarmId && this.agents.size > 0;
  }

  getUserInfo() {
    return this.user;
  }

  getSwarmInfo() {
    return {
      swarmId: this.swarmId,
      agents: Array.from(this.agents.values()),
      workflows: Array.from(this.workflows.keys())
    };
  }

  getStatus() {
    return {
      initialized: this.initialized,
      authenticated: this.authenticated,
      user: this.user ? {
        id: this.user.id,
        email: this.user.email
      } : null,
      swarm: {
        id: this.swarmId,
        active: this.hasActiveSwarm(),
        agentCount: this.agents.size
      },
      workflows: Array.from(this.workflows.keys())
    };
  }
}

module.exports = FlowNexusSDK;