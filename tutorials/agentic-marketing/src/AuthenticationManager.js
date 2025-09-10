/**
 * Authentication Manager
 * Handles Flow Nexus authentication with session persistence
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class AuthenticationManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      sessionFile: config.sessionFile || '.flow-nexus-session.json',
      credentialsFile: config.credentialsFile || '.flow-nexus-credentials.json',
      autoRestore: config.autoRestore !== false,
      ...config
    };
    
    this.flowNexusSDK = null;
    this.sessionData = null;
  }

  /**
   * Initialize with Flow Nexus SDK
   */
  initialize(flowNexusSDK) {
    this.flowNexusSDK = flowNexusSDK;
    
    // Listen to SDK events
    this.flowNexusSDK.on('authenticated', this.handleAuthentication.bind(this));
    this.flowNexusSDK.on('logout', this.handleLogout.bind(this));
    
    // Auto-restore session if enabled
    if (this.config.autoRestore) {
      this.restoreSession();
    }
    
    return this;
  }

  /**
   * Handle authentication events from SDK
   */
  handleAuthentication(data) {
    this.sessionData = {
      user: data.user,
      action: data.action,
      timestamp: new Date().toISOString(),
      authenticated: true
    };
    
    this.saveSession();
    this.emit('session:saved', this.sessionData);
  }

  /**
   * Handle logout events from SDK
   */
  handleLogout() {
    this.clearSession();
    this.emit('session:cleared');
  }

  /**
   * Save session data to file
   */
  saveSession() {
    if (!this.sessionData) return;
    
    try {
      const sessionPath = path.resolve(this.config.sessionFile);
      fs.writeFileSync(sessionPath, JSON.stringify(this.sessionData, null, 2));
    } catch (error) {
      console.warn('Failed to save session:', error.message);
    }
  }

  /**
   * Restore session from file
   */
  restoreSession() {
    try {
      const sessionPath = path.resolve(this.config.sessionFile);
      
      if (fs.existsSync(sessionPath)) {
        const sessionContent = fs.readFileSync(sessionPath, 'utf8');
        this.sessionData = JSON.parse(sessionContent);
        
        // Check if session is still valid (within 24 hours)
        const sessionAge = new Date() - new Date(this.sessionData.timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge < maxAge) {
          this.emit('session:restored', this.sessionData);
          return true;
        } else {
          this.clearSession();
          this.emit('session:expired', this.sessionData);
          return false;
        }
      }
    } catch (error) {
      console.warn('Failed to restore session:', error.message);
      this.clearSession();
    }
    
    return false;
  }

  /**
   * Clear session data
   */
  clearSession() {
    this.sessionData = null;
    
    try {
      const sessionPath = path.resolve(this.config.sessionFile);
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
      }
    } catch (error) {
      console.warn('Failed to clear session file:', error.message);
    }
  }

  /**
   * Save temporary credentials for CLI init command
   */
  saveCredentialsForInit(email, password, action = 'login') {
    const credentials = {
      email,
      password,
      action,
      timestamp: new Date().toISOString()
    };
    
    try {
      const credentialsPath = path.resolve(this.config.credentialsFile);
      fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
      this.emit('credentials:saved', { email, action });
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error.message);
      return false;
    }
  }

  /**
   * Check if credentials file exists (for CLI init)
   */
  hasCredentialsFile() {
    const credentialsPath = path.resolve(this.config.credentialsFile);
    return fs.existsSync(credentialsPath);
  }

  /**
   * Process saved credentials (used by CLI init)
   */
  async processCredentials() {
    const credentialsPath = path.resolve(this.config.credentialsFile);
    
    if (!fs.existsSync(credentialsPath)) {
      return null;
    }
    
    try {
      const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsContent);
      
      // Delete credentials file immediately for security
      fs.unlinkSync(credentialsPath);
      
      if (!this.flowNexusSDK) {
        throw new Error('Flow Nexus SDK not initialized');
      }
      
      // Authenticate using saved credentials
      if (credentials.action === 'register') {
        return await this.flowNexusSDK.register(
          credentials.email,
          credentials.password,
          'Agentic Marketing User'
        );
      } else {
        return await this.flowNexusSDK.login(credentials.email, credentials.password);
      }
    } catch (error) {
      console.error('Failed to process credentials:', error.message);
      throw error;
    }
  }

  /**
   * Interactive authentication prompt
   */
  async promptAuthentication() {
    if (!this.flowNexusSDK) {
      throw new Error('Flow Nexus SDK not initialized');
    }

    const inquirer = require('inquirer');
    
    console.log('\n🔐 Flow Nexus Authentication Required\n');
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Do you have a Flow Nexus account?',
        choices: [
          { name: 'Yes, I want to login', value: 'login' },
          { name: 'No, I need to register', value: 'register' },
          { name: 'Skip for now', value: 'skip' }
        ]
      }
    ]);
    
    if (action === 'skip') {
      return { success: false, skipped: true };
    }
    
    const { email, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Enter your email:',
        validate: (input) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(input) || 'Please enter a valid email';
        }
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
        mask: '*'
      }
    ]);
    
    try {
      if (action === 'register') {
        return await this.flowNexusSDK.register(email, password, 'Agentic Marketing User');
      } else {
        return await this.flowNexusSDK.login(email, password);
      }
    } catch (error) {
      console.error('Authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * Get current authentication status
   */
  getStatus() {
    return {
      authenticated: this.flowNexusSDK ? this.flowNexusSDK.isAuthenticated() : false,
      hasSession: !!this.sessionData,
      hasCredentialsFile: this.hasCredentialsFile(),
      user: this.sessionData ? this.sessionData.user : null
    };
  }

  /**
   * Check if authentication is required
   */
  requiresAuthentication() {
    return !this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated();
  }
}

module.exports = AuthenticationManager;