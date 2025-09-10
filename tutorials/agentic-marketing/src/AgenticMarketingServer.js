/**
 * Agentic Marketing Server
 * Main application server that properly initializes Flow Nexus MCP integration
 */

const path = require('path');
const chalk = require('chalk');
const FlowNexusSDK = require('./FlowNexusSDK');
const AuthenticationManager = require('./AuthenticationManager');
const MediaPlanningAPI = require('./MediaPlanningAPI');
const DatabaseManager = require('./DatabaseManager');

class AgenticMarketingServer {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3000,
      dbPath: config.dbPath || path.join(process.cwd(), 'data', 'mediaspend.db'),
      schemaPath: config.schemaPath || path.join(process.cwd(), 'schema.sql'),
      autoInitialize: config.autoInitialize !== false,
      ...config
    };
    
    // Initialize components
    this.dbManager = new DatabaseManager(this.config);
    this.flowNexusSDK = new FlowNexusSDK(this.config);
    this.authManager = new AuthenticationManager(this.config);
    this.api = new MediaPlanningAPI(this.config);
    
    // State
    this.server = null;
    this.mcpTools = null;
    this.initialized = false;
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners between components
   */
  setupEventListeners() {
    // Flow Nexus SDK events
    this.flowNexusSDK.on('initialized', () => {
      console.log(chalk.green('✅ Flow Nexus SDK initialized'));
    });

    this.flowNexusSDK.on('authenticated', (data) => {
      console.log(chalk.green(`✅ Authenticated: ${data.user.email}`));
    });

    this.flowNexusSDK.on('swarm:initialized', (data) => {
      console.log(chalk.cyan(`🐝 Swarm initialized: ${data.swarmId} (${data.agents.length} agents)`));
    });

    this.flowNexusSDK.on('workflows:created', (data) => {
      console.log(chalk.blue(`📋 Workflows created: ${data.workflows.join(', ')}`));
    });

    this.flowNexusSDK.on('infrastructure:ready', () => {
      console.log(chalk.green('🚀 AI infrastructure ready!'));
    });

    // Database Manager events
    this.dbManager.on('connected', () => {
      console.log(chalk.green('✅ Database connected'));
    });

    this.dbManager.on('error', (error) => {
      console.error(chalk.red(`❌ Database error: ${error.message}`));
    });

    this.flowNexusSDK.on('error', (data) => {
      console.error(chalk.red(`❌ Flow Nexus error (${data.type}): ${data.error}`));
    });

    // Authentication Manager events
    this.authManager.on('session:restored', (data) => {
      console.log(chalk.yellow(`🔄 Session restored: ${data.user.email}`));
    });

    this.authManager.on('session:expired', () => {
      console.log(chalk.yellow('⏰ Session expired - authentication required'));
    });
  }

  /**
   * Initialize the server with MCP tools
   * This method should be called with the actual MCP tool references
   */
  async initialize(mcpTools) {
    if (this.initialized) {
      console.log(chalk.yellow('Server already initialized'));
      return this;
    }

    console.log(chalk.cyan('🚀 Initializing Agentic Marketing Server...'));

    try {
      // Store MCP tools reference
      this.mcpTools = mcpTools;

      // Initialize Database Manager first
      await this.dbManager.initialize();

      // Initialize Flow Nexus SDK with MCP tools and database manager
      this.flowNexusSDK.initialize(mcpTools, this.dbManager);

      // Initialize Authentication Manager with SDK and DB
      this.authManager.initialize(this.flowNexusSDK);

      // Initialize API with SDK, Auth Manager, and DB
      this.api.initialize(this.flowNexusSDK, this.authManager, this.dbManager);

      this.initialized = true;

      // Auto-restore authentication if enabled
      if (this.config.autoInitialize) {
        await this.autoInitialize();
      }

      console.log(chalk.green('✅ Server initialization complete'));
      return this;
    } catch (error) {
      console.error(chalk.red('❌ Server initialization failed:'), error.message);
      throw error;
    }
  }

  /**
   * Auto-initialize authentication and infrastructure
   */
  async autoInitialize() {
    try {
      // Check for environment-based non-interactive authentication first
      if (process.env.AUTO_AUTH_EMAIL && process.env.AUTO_AUTH_PASSWORD) {
        console.log(chalk.cyan('🤖 Non-interactive authentication detected...'));
        try {
          const email = process.env.AUTO_AUTH_EMAIL;
          const password = process.env.AUTO_AUTH_PASSWORD;
          const action = process.env.AUTO_AUTH_ACTION || 'login';
          
          console.log(chalk.yellow(`Attempting ${action} for: ${email}`));
          
          if (action === 'register') {
            await this.flowNexusSDK.register(email, password, 'Test User');
            console.log(chalk.green('✅ Non-interactive registration successful!'));
          } else {
            await this.flowNexusSDK.login(email, password);
            console.log(chalk.green('✅ Non-interactive login successful!'));
          }
          
          return;
        } catch (error) {
          console.log(chalk.red('Non-interactive authentication failed:', error.message));
          console.log(chalk.yellow('Falling back to other authentication methods...'));
        }
      }
      
      // Check for saved credentials from CLI init
      if (this.authManager.hasCredentialsFile()) {
        console.log(chalk.yellow('🔑 Processing saved credentials...'));
        try {
          await this.authManager.processCredentials();
        } catch (error) {
          console.log(chalk.red('Failed to process saved credentials:', error.message));
        }
      }
      
      // Restore previous session from database
      else {
        console.log(chalk.yellow('🔄 Checking for previous session...'));
        const systemState = await this.dbManager.getSystemState();
        
        if (systemState.session && systemState.swarms.length > 0) {
          console.log(chalk.cyan('📦 Restoring previous Flow Nexus session...'));
          
          // Set restored state in components
          this.flowNexusSDK.swarmId = systemState.swarms[0]?.swarmId;
          systemState.agents.forEach(agent => {
            this.flowNexusSDK.agents.set(agent.id, agent);
          });
          systemState.workflows.forEach(workflow => {
            this.flowNexusSDK.workflows.set(workflow.name, workflow);
          });
          
          console.log(chalk.green(`✅ Restored: ${systemState.swarms.length} swarms, ${systemState.agents.length} agents, ${systemState.workflows.length} workflows`));
        }
      }
    } catch (error) {
      console.warn(chalk.yellow('Auto-initialization failed:'), error.message);
    }
  }

  /**
   * Start the HTTP server
   */
  async start() {
    if (!this.initialized) {
      throw new Error('Server not initialized. Call initialize() with MCP tools first.');
    }

    return new Promise((resolve, reject) => {
      this.server = this.api.getApp().listen(this.config.port, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.displayStartupBanner();
        resolve(this.server);
      });
    });
  }

  /**
   * Display startup banner
   */
  displayStartupBanner() {
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║     AGENTIC MARKETING - MODULAR ARCHITECTURE v2.0           ║
║     Powered by Flow Nexus MCP Integration                    ║
╚═══════════════════════════════════════════════════════════════╝`));

    console.log(chalk.green(`\n✅ Server running on port ${this.config.port}`));
    console.log(chalk.yellow(`📊 Dashboard: http://localhost:${this.config.port}`));
    console.log(chalk.white(`📋 Health: http://localhost:${this.config.port}/health`));

    // Display system status
    this.displaySystemStatus();
  }

  /**
   * Display system status
   */
  displaySystemStatus() {
    console.log(chalk.white('\n📊 System Status:'));
    
    // Authentication status
    if (this.flowNexusSDK.isAuthenticated()) {
      const user = this.flowNexusSDK.getUserInfo();
      console.log(chalk.green(`   🔐 Authentication: ✅ ${user?.email || 'Authenticated'}`));
    } else {
      console.log(chalk.yellow('   🔐 Authentication: ⚠️  Not authenticated'));
      console.log(chalk.white('      Visit dashboard to login/register'));
    }

    // Swarm status
    if (this.flowNexusSDK.hasActiveSwarm()) {
      const swarmInfo = this.flowNexusSDK.getSwarmInfo();
      console.log(chalk.green(`   🐝 AI Swarm: ✅ Active (${swarmInfo.agents.length} agents)`));
      console.log(chalk.green(`   📋 Workflows: ✅ ${swarmInfo.workflows.length} available`));
    } else {
      console.log(chalk.yellow('   🐝 AI Swarm: ⚠️  Not initialized'));
      console.log(chalk.white('      Will auto-initialize after authentication'));
    }

    // Database status
    console.log(chalk.green('   🗄️  Database: ✅ Connected'));
    
    // MCP status
    console.log(chalk.green('   🔧 MCP Tools: ✅ Loaded'));

    console.log(chalk.white('\n📚 Available Endpoints:'));
    console.log(chalk.gray('   Authentication:'));
    console.log(chalk.white('     POST /api/flow-nexus/register'));
    console.log(chalk.white('     POST /api/flow-nexus/login'));
    console.log(chalk.white('     GET  /api/flow-nexus/status'));
    
    console.log(chalk.gray('   Media Planning:'));
    console.log(chalk.white('     POST /api/insertion-orders'));
    console.log(chalk.white('     GET  /api/insertion-orders'));
    console.log(chalk.white('     POST /api/daily-spend'));
    
    console.log(chalk.gray('   Analytics & AI:'));
    console.log(chalk.white('     GET  /api/analytics/performance'));
    console.log(chalk.white('     GET  /api/analytics/pacing'));
    console.log(chalk.white('     POST /api/optimize/campaign'));
    console.log(chalk.white('     POST /api/optimize/budget'));
    
    if (!this.flowNexusSDK.isAuthenticated()) {
      console.log(chalk.yellow('\n💡 Next Steps:'));
      console.log(chalk.white('   1. Visit the dashboard to authenticate with Flow Nexus'));
      console.log(chalk.white('   2. AI swarm and workflows will auto-initialize'));
      console.log(chalk.white('   3. Start using AI-powered media optimization!'));
    }
  }

  /**
   * Get current system status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      server: {
        running: !!this.server,
        port: this.config.port
      },
      flowNexus: this.flowNexusSDK ? this.flowNexusSDK.getStatus() : null,
      authentication: this.authManager ? this.authManager.getStatus() : null,
      database: 'connected'
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log(chalk.yellow('🛑 Shutting down server...'));
    
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
    
    if (this.api) {
      this.api.close();
    }
    
    console.log(chalk.green('✅ Server shutdown complete'));
  }

  /**
   * Static factory method for easy initialization
   */
  static async create(mcpTools, config = {}) {
    const server = new AgenticMarketingServer(config);
    await server.initialize(mcpTools);
    return server;
  }
}

module.exports = AgenticMarketingServer;