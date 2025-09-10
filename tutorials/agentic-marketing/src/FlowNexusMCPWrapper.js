/**
 * Flow Nexus MCP Wrapper
 * Provides direct integration with Flow Nexus MCP tools via npm/npx
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const chalk = require('chalk');

const execAsync = promisify(exec);

class FlowNexusMCPWrapper {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 30000,
      retries: config.retries || 2,
      ...config
    };
    this.authenticated = false;
    this.sessionData = null;
  }

  /**
   * Execute Flow Nexus command via npm/npx
   */
  async executeCommand(command, args = [], options = {}) {
    const { timeout = this.config.timeout } = options;
    
    return new Promise((resolve, reject) => {
      const fullCommand = `npx flow-nexus@latest ${command} ${args.join(' ')}`;
      
      const child = exec(fullCommand, {
        timeout,
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            // Try to parse as JSON
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            // Handle non-JSON responses
            resolve({ success: true, output: stdout.trim() });
          }
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to execute command: ${error.message}`));
      });
    });
  }

  /**
   * User Registration
   */
  async user_register({ email, password, full_name }) {
    try {
      const result = await this.executeCommand('auth', [
        'register',
        '-e', `"${email}"`,
        '-p', `"${password}"`,
        '--name', `"${full_name}"`
      ]);
      
      if (result.success) {
        this.authenticated = true;
        this.sessionData = result;
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * User Login
   */
  async user_login({ email, password }) {
    try {
      // Use the correct Flow Nexus login command structure
      const result = await this.executeCommand('auth', [
        'login',
        '-e', `"${email}"`,
        '-p', `"${password}"`
      ]);
      
      if (result.success) {
        this.authenticated = true;
        this.sessionData = result;
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * User Logout
   */
  async user_logout() {
    try {
      const result = await this.executeCommand('auth', ['logout']);
      
      if (result.success) {
        this.authenticated = false;
        this.sessionData = null;
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize Swarm
   */
  async swarm_init({ topology, maxAgents, strategy }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['swarm', 'init'];
      if (topology) args.push('--topology', topology);
      if (maxAgents) args.push('--max-agents', maxAgents.toString());
      if (strategy) args.push('--strategy', strategy);

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Spawn Agent
   */
  async agent_spawn({ type, capabilities, name }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['agent', 'spawn', '--type', type];
      if (name) args.push('--name', name);
      if (capabilities) args.push('--capabilities', JSON.stringify(capabilities));

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Orchestrate Task
   */
  async task_orchestrate({ task, strategy, priority, maxAgents }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['task', 'orchestrate', '--task', `"${task}"`];
      if (strategy) args.push('--strategy', strategy);
      if (priority) args.push('--priority', priority);
      if (maxAgents) args.push('--max-agents', maxAgents);

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create Workflow
   */
  async workflow_create({ name, description, steps, triggers }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['workflow', 'create', '--name', `"${name}"`];
      if (description) args.push('--description', `"${description}"`);
      if (steps) args.push('--steps', JSON.stringify(steps));
      if (triggers) args.push('--triggers', JSON.stringify(triggers));

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute Workflow
   */
  async workflow_execute({ workflow_id, input_data, async }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['workflow', 'execute', '--workflow-id', workflow_id];
      if (input_data) args.push('--input', JSON.stringify(input_data));
      if (async) args.push('--async');

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Status
   */
  async getStatus() {
    try {
      const result = await this.executeCommand('status');
      return {
        authenticated: this.authenticated,
        session: this.sessionData,
        ...result
      };
    } catch (error) {
      return {
        authenticated: this.authenticated,
        error: error.message
      };
    }
  }

  // === NEURAL NETWORK FEATURES ===
  
  /**
   * Train Neural Network
   */
  async neural_train({ config, tier = 'small' }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['neural', 'train', '--tier', tier];
      if (config) args.push('--config', JSON.stringify(config));

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Neural Network Prediction
   */
  async neural_predict({ model_id, input }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['neural', 'predict', '--model-id', model_id];
      if (input) args.push('--input', JSON.stringify(input));

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List Neural Network Templates
   */
  async neural_list_templates({ category, tier }) {
    try {
      const args = ['neural', 'templates'];
      if (category) args.push('--category', category);
      if (tier) args.push('--tier', tier);

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === ADVANCED SWARM FEATURES ===
  
  /**
   * Scale Swarm
   */
  async swarm_scale({ swarm_id, target_agents }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['swarm', 'scale'];
      if (swarm_id) args.push('--swarm-id', swarm_id);
      if (target_agents) args.push('--target-agents', target_agents.toString());

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Swarm Status
   */
  async swarm_status({ swarm_id }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['swarm', 'status'];
      if (swarm_id) args.push('--swarm-id', swarm_id);

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Destroy Swarm
   */
  async swarm_destroy({ swarm_id }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['swarm', 'destroy'];
      if (swarm_id) args.push('--swarm-id', swarm_id);

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === SANDBOX EXECUTION ===
  
  /**
   * Create Sandbox
   */
  async sandbox_create({ template, name, env_vars }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['sandbox', 'create', '--template', template];
      if (name) args.push('--name', name);
      if (env_vars) args.push('--env-vars', JSON.stringify(env_vars));

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute Code in Sandbox
   */
  async sandbox_execute({ sandbox_id, code, language = 'javascript' }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['sandbox', 'execute', '--sandbox-id', sandbox_id, '--language', language];
      if (code) args.push('--code', `"${code}"`);

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === GITHUB INTEGRATION ===
  
  /**
   * Analyze GitHub Repository
   */
  async github_repo_analyze({ repo, analysis_type = 'code_quality' }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['github', 'analyze', '--repo', repo, '--type', analysis_type];
      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === REAL-TIME FEATURES ===
  
  /**
   * Subscribe to Real-time Updates
   */
  async realtime_subscribe({ table, event = '*' }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['realtime', 'subscribe', '--table', table, '--event', event];
      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === STORAGE MANAGEMENT ===
  
  /**
   * Upload to Storage
   */
  async storage_upload({ bucket, path, content }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['storage', 'upload', '--bucket', bucket, '--path', path];
      if (content) args.push('--content', content);

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List Storage Files
   */
  async storage_list({ bucket, path = '' }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['storage', 'list', '--bucket', bucket];
      if (path) args.push('--path', path);

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === TEMPLATE SYSTEM ===
  
  /**
   * List Templates
   */
  async template_list({ category, featured }) {
    try {
      const args = ['templates', 'list'];
      if (category) args.push('--category', category);
      if (featured) args.push('--featured');

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Deploy Template
   */
  async template_deploy({ template_id, deployment_name, variables }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['templates', 'deploy', '--template-id', template_id];
      if (deployment_name) args.push('--name', deployment_name);
      if (variables) args.push('--variables', JSON.stringify(variables));

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === CHAT WITH AI ASSISTANT ===
  
  /**
   * Chat with Queen Seraphina AI Assistant
   */
  async seraphina_chat({ message, enable_tools = false }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['chat', '--message', `"${message}"`];
      if (enable_tools) args.push('--enable-tools');

      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // === CREDITS AND PAYMENTS ===
  
  /**
   * Check Credit Balance
   */
  async check_balance() {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const result = await this.executeCommand('balance', []);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Payment History
   */
  async get_payment_history({ limit = 10 }) {
    if (!this.authenticated) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const args = ['payments', 'history', '--limit', limit.toString()];
      const result = await this.executeCommand('', args);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if Flow Nexus is available
   */
  async isAvailable() {
    try {
      await this.executeCommand('--version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Install Flow Nexus if not available
   */
  async ensureInstalled() {
    const available = await this.isAvailable();
    
    if (!available) {
      console.log(chalk.yellow('Installing Flow Nexus...'));
      try {
        await execAsync('npm install -g flow-nexus@latest');
        console.log(chalk.green('✅ Flow Nexus installed successfully'));
        return true;
      } catch (error) {
        console.error(chalk.red('❌ Failed to install Flow Nexus:', error.message));
        return false;
      }
    }
    
    return true;
  }
}

module.exports = FlowNexusMCPWrapper;