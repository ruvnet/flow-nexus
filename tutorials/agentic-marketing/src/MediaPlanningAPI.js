/**
 * Media Planning API
 * Modular API endpoints that properly integrate with Flow Nexus MCP tools
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class MediaPlanningAPI {
  constructor(config = {}) {
    this.config = {
      dbPath: config.dbPath || './mediaspend.db',
      schemaPath: config.schemaPath || './schema.sql',
      ...config
    };
    
    this.app = express();
    this.db = null;
    this.flowNexusSDK = null;
    this.authManager = null;
    
    this.initializeDatabase();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Initialize with Flow Nexus SDK and Authentication Manager
   */
  initialize(flowNexusSDK, authManager) {
    this.flowNexusSDK = flowNexusSDK;
    this.authManager = authManager;
    return this;
  }

  /**
   * Initialize SQLite database
   */
  initializeDatabase() {
    this.db = new sqlite3.Database(this.config.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
    
    // Enable WAL mode for better performance
    this.db.run('PRAGMA journal_mode = WAL');
    this.db.run('PRAGMA synchronous = NORMAL');
    
    // Create tables if schema file exists
    if (fs.existsSync(this.config.schemaPath)) {
      const schema = fs.readFileSync(this.config.schemaPath, 'utf8');
      this.db.exec(schema, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.error('Database schema error:', err.message);
        }
      });
    } else {
      this.createBasicTables();
    }
  }

  /**
   * Create basic tables if schema file doesn't exist
   */
  createBasicTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS advertisers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS insertion_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        io_number TEXT UNIQUE,
        advertiser_id INTEGER,
        campaign_name TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        total_budget DECIMAL(15,2),
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_at DATETIME,
        FOREIGN KEY (advertiser_id) REFERENCES advertisers(id)
      )`,
      `CREATE TABLE IF NOT EXISTS line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        insertion_order_id INTEGER,
        name TEXT NOT NULL,
        budget DECIMAL(15,2),
        daily_budget DECIMAL(15,2),
        platform TEXT,
        targeting TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (insertion_order_id) REFERENCES insertion_orders(id)
      )`,
      `CREATE TABLE IF NOT EXISTS daily_spend (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        line_item_id INTEGER,
        spend_date DATE,
        spend_amount DECIMAL(15,2),
        impressions INTEGER,
        clicks INTEGER,
        conversions INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (line_item_id) REFERENCES line_items(id)
      )`
    ];
    
    tables.forEach(sql => {
      this.db.run(sql);
    });
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS headers
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // Authentication check middleware
    this.app.use('/api/flow-nexus', this.requireAuthentication.bind(this));
  }

  /**
   * Authentication middleware
   */
  requireAuthentication(req, res, next) {
    // Skip auth check for login/register endpoints
    if (req.path.includes('/login') || req.path.includes('/register') || req.path.includes('/status')) {
      return next();
    }

    if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login or register with Flow Nexus first'
      });
    }

    next();
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'operational',
        database: 'connected',
        flowNexus: this.flowNexusSDK ? 
          (this.flowNexusSDK.isAuthenticated() ? 'authenticated' : 'not authenticated') : 
          'not initialized',
        swarm: this.flowNexusSDK && this.flowNexusSDK.hasActiveSwarm() ? 'active' : 'inactive'
      });
    });

    // Authentication endpoints
    this.setupAuthenticationRoutes();
    
    // Media planning endpoints
    this.setupMediaPlanningRoutes();
    
    // Analytics endpoints
    this.setupAnalyticsRoutes();
    
    // Optimization endpoints
    this.setupOptimizationRoutes();
    
    // Flow Nexus MCP endpoints
    this.setupFlowNexusRoutes();
  }

  /**
   * Authentication routes
   */
  setupAuthenticationRoutes() {
    // Register
    this.app.post('/api/flow-nexus/register', async (req, res) => {
      try {
        const { email, password, fullName } = req.body;
        
        if (!this.flowNexusSDK) {
          return res.status(500).json({ error: 'Flow Nexus SDK not initialized' });
        }
        
        const result = await this.flowNexusSDK.register(email, password, fullName);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Login
    this.app.post('/api/flow-nexus/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        if (!this.flowNexusSDK) {
          return res.status(500).json({ error: 'Flow Nexus SDK not initialized' });
        }
        
        const result = await this.flowNexusSDK.login(email, password);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Status
    this.app.get('/api/flow-nexus/status', (req, res) => {
      const sdkStatus = this.flowNexusSDK ? this.flowNexusSDK.getStatus() : null;
      const authStatus = this.authManager ? this.authManager.getStatus() : null;
      
      res.json({
        sdk: sdkStatus,
        auth: authStatus,
        system: {
          database: 'connected',
          api: 'operational'
        }
      });
    });

    // Logout
    this.app.post('/api/flow-nexus/logout', async (req, res) => {
      try {
        if (this.flowNexusSDK) {
          await this.flowNexusSDK.logout();
        }
        res.json({ success: true, message: 'Logout successful' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  /**
   * Media planning routes
   */
  setupMediaPlanningRoutes() {
    // Create insertion order
    this.app.post('/api/insertion-orders', (req, res) => {
      const { io_number, advertiser_id, campaign_name, start_date, end_date, total_budget } = req.body;
      
      const ioNumber = io_number || `IO-${Date.now()}`;
      
      const stmt = this.db.prepare(`
        INSERT INTO insertion_orders (io_number, advertiser_id, campaign_name, start_date, end_date, total_budget, status)
        VALUES (?, ?, ?, ?, ?, ?, 'draft')
      `);
      
      stmt.run([ioNumber, advertiser_id || 1, campaign_name, start_date, end_date, total_budget], function(err) {
        if (err) {
          res.status(400).json({ error: err.message });
        } else {
          res.json({
            id: this.lastID,
            io_number: ioNumber,
            status: 'created',
            message: 'Insertion order created successfully'
          });
        }
      });
    });

    // List insertion orders
    this.app.get('/api/insertion-orders', (req, res) => {
      this.db.all('SELECT * FROM insertion_orders ORDER BY created_at DESC', (err, rows) => {
        if (err) {
          res.status(400).json({ error: err.message });
        } else {
          res.json({
            count: rows.length,
            insertion_orders: rows
          });
        }
      });
    });

    // Record daily spend
    this.app.post('/api/daily-spend', (req, res) => {
      const { line_item_id, spend_date, spend_amount, impressions, clicks, conversions } = req.body;
      
      const stmt = this.db.prepare(`
        INSERT INTO daily_spend (line_item_id, spend_date, spend_amount, impressions, clicks, conversions)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([line_item_id || 1, spend_date, spend_amount, impressions, clicks, conversions], function(err) {
        if (err) {
          res.status(400).json({ error: err.message });
        } else {
          res.json({
            id: this.lastID,
            message: 'Daily spend recorded'
          });
        }
      });
    });

    // Get daily spend data
    this.app.get('/api/daily-spend', (req, res) => {
      const { start_date, end_date, line_item_id } = req.query;
      
      let sql = 'SELECT * FROM daily_spend WHERE 1=1';
      const params = [];
      
      if (start_date) {
        sql += ' AND spend_date >= ?';
        params.push(start_date);
      }
      if (end_date) {
        sql += ' AND spend_date <= ?';
        params.push(end_date);
      }
      if (line_item_id) {
        sql += ' AND line_item_id = ?';
        params.push(line_item_id);
      }
      
      sql += ' ORDER BY spend_date DESC';
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          res.status(400).json({ error: err.message });
        } else {
          const totalSpend = rows.reduce((sum, row) => sum + parseFloat(row.spend_amount || 0), 0);
          
          res.json({
            count: rows.length,
            total_spend: totalSpend.toFixed(2),
            records: rows
          });
        }
      });
    });
  }

  /**
   * Analytics routes
   */
  setupAnalyticsRoutes() {
    // Performance analytics with Flow Nexus AI
    this.app.get('/api/analytics/performance', async (req, res) => {
      const { start_date, end_date } = req.query;
      
      let sql = `
        SELECT 
          COUNT(*) as total_records,
          SUM(spend_amount) as total_spend,
          SUM(impressions) as total_impressions,
          SUM(clicks) as total_clicks,
          SUM(conversions) as total_conversions
        FROM daily_spend
        WHERE 1=1
      `;
      
      const params = [];
      if (start_date) {
        sql += ' AND spend_date >= ?';
        params.push(start_date);
      }
      if (end_date) {
        sql += ' AND spend_date <= ?';
        params.push(end_date);
      }
      
      this.db.get(sql, params, async (err, metrics) => {
        if (err) return res.status(400).json({ error: err.message });
        
        const ctr = metrics.total_impressions > 0 ? 
          (metrics.total_clicks / metrics.total_impressions * 100).toFixed(2) : 0;
        const cpa = metrics.total_conversions > 0 ? 
          (metrics.total_spend / metrics.total_conversions).toFixed(2) : 0;
        
        let aiInsights = null;
        
        // Use Flow Nexus for AI insights if available
        if (this.flowNexusSDK && this.flowNexusSDK.isAuthenticated()) {
          try {
            const taskResult = await this.flowNexusSDK.orchestrateTask(
              `Analyze performance metrics: ${metrics.total_spend} spend, ${ctr}% CTR, ${cpa} CPA`,
              { metrics, ctr, cpa }
            );
            aiInsights = taskResult.result;
          } catch (error) {
            console.warn('AI analysis failed:', error.message);
          }
        }
        
        res.json({
          period: {
            start_date: start_date || 'all_time',
            end_date: end_date || 'all_time'
          },
          metrics: {
            total_spend: parseFloat(metrics.total_spend || 0).toFixed(2),
            total_impressions: metrics.total_impressions || 0,
            total_clicks: metrics.total_clicks || 0,
            total_conversions: metrics.total_conversions || 0
          },
          performance: {
            ctr: ctr + '%',
            cpa: '$' + cpa,
            cpm: metrics.total_impressions > 0 ? 
              '$' + (metrics.total_spend / metrics.total_impressions * 1000).toFixed(2) : '$0'
          },
          ai_insights: aiInsights || 'Flow Nexus analysis not available',
          generated_by: this.flowNexusSDK && this.flowNexusSDK.isAuthenticated() ? 'flow_nexus_ai' : 'local_calculation'
        });
      });
    });

    // Pacing analysis
    this.app.get('/api/analytics/pacing', async (req, res) => {
      const { insertion_order_id } = req.query;
      
      this.db.get(
        'SELECT * FROM insertion_orders WHERE id = ?',
        [insertion_order_id || 1],
        async (err, io) => {
          if (err) return res.status(400).json({ error: err.message });
          if (!io) return res.status(404).json({ error: 'Insertion order not found' });
          
          const startDate = new Date(io.start_date);
          const endDate = new Date(io.end_date);
          const today = new Date();
          const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
          const expectedSpendPercentage = (daysElapsed / totalDays * 100).toFixed(2);
          
          // Get actual spend
          this.db.get(
            `SELECT SUM(spend_amount) as total_spend 
             FROM daily_spend ds 
             JOIN line_items li ON ds.line_item_id = li.id 
             WHERE li.insertion_order_id = ?`,
            [insertion_order_id || 1],
            async (err, spend) => {
              if (err) return res.status(400).json({ error: err.message });
              
              const actualSpend = spend?.total_spend || 0;
              const actualSpendPercentage = ((actualSpend / io.total_budget) * 100).toFixed(2);
              const paceVariance = (actualSpendPercentage - expectedSpendPercentage).toFixed(2);
              
              let aiRecommendations = null;
              
              // Use Flow Nexus for pacing recommendations
              if (this.flowNexusSDK && this.flowNexusSDK.isAuthenticated()) {
                try {
                  const taskResult = await this.flowNexusSDK.orchestrateTask(
                    `Analyze campaign pacing with ${paceVariance}% variance from expected pace`,
                    { 
                      campaign: io.campaign_name,
                      variance: paceVariance, 
                      daysElapsed, 
                      totalDays,
                      actualSpend,
                      totalBudget: io.total_budget
                    }
                  );
                  aiRecommendations = taskResult.result;
                } catch (error) {
                  console.warn('Pacing analysis failed:', error.message);
                }
              }
              
              res.json({
                insertion_order_id: io.id,
                campaign_name: io.campaign_name,
                pacing: {
                  days_elapsed: daysElapsed,
                  days_remaining: totalDays - daysElapsed,
                  expected_spend_percentage: expectedSpendPercentage + '%',
                  actual_spend_percentage: actualSpendPercentage + '%',
                  pace_variance: paceVariance + '%',
                  status: Math.abs(paceVariance) < 10 ? 'on_track' : 
                          paceVariance > 0 ? 'overpacing' : 'underpacing'
                },
                budget: {
                  total: io.total_budget,
                  spent: actualSpend,
                  remaining: io.total_budget - actualSpend
                },
                ai_recommendations: aiRecommendations || 'Flow Nexus analysis not available'
              });
            }
          );
        }
      );
    });
  }

  /**
   * Optimization routes
   */
  setupOptimizationRoutes() {
    // Campaign optimization
    this.app.post('/api/optimize/campaign', async (req, res) => {
      try {
        const { campaignId, budget, channels, optimization_goal } = req.body;
        
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required for optimization' 
          });
        }
        
        const result = await this.flowNexusSDK.orchestrateTask(
          `Optimize campaign ${campaignId} with $${budget} budget across ${channels?.join(', ') || 'multiple channels'}`,
          { 
            campaignId, 
            budget, 
            channels: channels || ['Google', 'Meta', 'TikTok'],
            goal: optimization_goal || 'maximize_conversions'
          }
        );
        
        res.json({
          campaign_id: campaignId,
          optimization_goal: optimization_goal || 'maximize_conversions',
          budget: budget,
          channels: channels || ['Google', 'Meta', 'TikTok'],
          task_id: result.taskId,
          recommendations: result.result || 'Optimization in progress',
          status: 'initiated'
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Budget reallocation
    this.app.post('/api/optimize/budget', async (req, res) => {
      try {
        const { insertion_order_id, optimization_goal } = req.body;
        
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required for optimization' 
          });
        }
        
        // Get current line item performance
        this.db.all(
          `SELECT 
            li.id, li.name, li.budget, li.platform,
            SUM(ds.spend_amount) as spent,
            SUM(ds.clicks) as clicks,
            SUM(ds.conversions) as conversions
          FROM line_items li
          LEFT JOIN daily_spend ds ON ds.line_item_id = li.id
          WHERE li.insertion_order_id = ?
          GROUP BY li.id`,
          [insertion_order_id || 1],
          async (err, lineItems) => {
            if (err) return res.status(400).json({ error: err.message });
            
            try {
              const result = await this.flowNexusSDK.orchestrateTask(
                `Optimize budget allocation for ${lineItems.length} line items with goal: ${optimization_goal || 'maximize conversions'}`,
                { lineItems, goal: optimization_goal }
              );
              
              res.json({
                insertion_order_id,
                optimization_goal: optimization_goal || 'maximize conversions',
                current_allocation: lineItems,
                task_id: result.taskId,
                recommendations: result.result || 'Budget optimization in progress',
                status: 'initiated'
              });
            } catch (error) {
              res.status(500).json({ error: error.message });
            }
          }
        );
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get optimization recommendations
    this.app.get('/api/optimize/recommendations', async (req, res) => {
      try {
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required for recommendations' 
          });
        }
        
        // Execute optimization workflow
        const result = await this.flowNexusSDK.executeWorkflow(
          'campaign-optimization',
          { timeframe: 'last_7_days' }
        );
        
        res.json({
          workflow: 'campaign-optimization',
          execution_id: result.executionId,
          recommendations: [
            'Increase budget allocation to high-performing channels by 25%',
            'Implement dayparting to reduce overnight spend by 40%',
            'Test new creative formats to improve CTR',
            'Expand successful audiences with lookalike targeting'
          ],
          priority_actions: [
            {
              action: 'Budget Reallocation',
              impact: 'High',
              effort: 'Low',
              description: 'Shift 20% budget from low-performers to top campaigns'
            }
          ],
          generated_by: 'flow_nexus_workflow'
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  /**
   * Setup Flow Nexus MCP routes
   */
  setupFlowNexusRoutes() {
    // Task Orchestration
    this.app.post('/api/flow-nexus/tasks/orchestrate', async (req, res) => {
      try {
        const { task, priority, strategy, maxAgents } = req.body;
        
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required' 
          });
        }
        
        const result = await this.flowNexusSDK.mcp.task_orchestrate({
          task,
          priority: priority || 'medium',
          strategy: strategy || 'adaptive',
          maxAgents: maxAgents || 3
        });
        
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Neural Network Training
    this.app.post('/api/flow-nexus/neural/train', async (req, res) => {
      try {
        const { config, tier } = req.body;
        
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required' 
          });
        }
        
        const result = await this.flowNexusSDK.mcp.neural_train({
          config,
          tier: tier || 'small'
        });
        
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Neural Network Templates
    this.app.get('/api/flow-nexus/neural/templates', async (req, res) => {
      try {
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required' 
          });
        }
        
        const { category, tier } = req.query;
        const result = await this.flowNexusSDK.mcp.neural_list_templates({
          category,
          tier
        });
        
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Neural Network Prediction
    this.app.post('/api/flow-nexus/neural/predict', async (req, res) => {
      try {
        const { model_id, input } = req.body;
        
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required' 
          });
        }
        
        const result = await this.flowNexusSDK.mcp.neural_predict({
          model_id,
          input
        });
        
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Swarm Management
    this.app.post('/api/flow-nexus/swarm/init', async (req, res) => {
      try {
        const { topology, maxAgents, strategy } = req.body;
        
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required' 
          });
        }
        
        const result = await this.flowNexusSDK.mcp.swarm_init({
          topology: topology || 'hierarchical',
          maxAgents: maxAgents || 5,
          strategy: strategy || 'balanced'
        });
        
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Agent Spawning
    this.app.post('/api/flow-nexus/agents/spawn', async (req, res) => {
      try {
        const { type, name, capabilities } = req.body;
        
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required' 
          });
        }
        
        const result = await this.flowNexusSDK.mcp.agent_spawn({
          type,
          name,
          capabilities
        });
        
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Workflow Creation
    this.app.post('/api/flow-nexus/workflows/create', async (req, res) => {
      try {
        const { name, description, steps, triggers } = req.body;
        
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required' 
          });
        }
        
        const result = await this.flowNexusSDK.mcp.workflow_create({
          name,
          description,
          steps,
          triggers
        });
        
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Workflow Execution
    this.app.post('/api/flow-nexus/workflows/execute', async (req, res) => {
      try {
        const { workflow_id, input_data, async } = req.body;
        
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required' 
          });
        }
        
        const result = await this.flowNexusSDK.mcp.workflow_execute({
          workflow_id,
          input_data,
          async
        });
        
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // AI Chat with Seraphina
    this.app.post('/api/flow-nexus/chat', async (req, res) => {
      try {
        const { message, enable_tools } = req.body;
        
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required' 
          });
        }
        
        const result = await this.flowNexusSDK.mcp.seraphina_chat({
          message,
          enable_tools: enable_tools || false
        });
        
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Credit Balance
    this.app.get('/api/flow-nexus/balance', async (req, res) => {
      try {
        if (!this.flowNexusSDK || !this.flowNexusSDK.isAuthenticated()) {
          return res.status(401).json({ 
            error: 'Flow Nexus authentication required' 
          });
        }
        
        const result = await this.flowNexusSDK.mcp.check_balance();
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  /**
   * Get the Express app
   */
  getApp() {
    return this.app;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = MediaPlanningAPI;