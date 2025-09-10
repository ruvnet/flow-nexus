/**
 * Database Manager
 * Cross-platform SQLite database management with session persistence
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class DatabaseManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      dbPath: config.dbPath || 'data/mediaspend.db',
      schemaPath: config.schemaPath || 'schema.sql',
      mode: config.mode || 'WAL',
      ...config
    };
    
    this.db = null;
    this.connected = false;
  }

  /**
   * Initialize database with cross-platform path handling
   */
  async initialize() {
    try {
      // Ensure data directory exists
      const dbDir = path.dirname(this.config.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Use absolute path for cross-platform compatibility
      const absoluteDbPath = path.resolve(this.config.dbPath);
      
      // Create database connection
      this.db = new sqlite3.Database(absoluteDbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error('Database connection error:', err.message);
          this.emit('error', err);
          return;
        }
        
        this.connected = true;
        this.emit('connected');
      });

      // Configure database for optimal performance
      await this.configureDatabase();
      
      // Initialize schema
      await this.initializeSchema();
      
      // Create system tables for Flow Nexus persistence
      await this.createSystemTables();
      
      console.log('✅ Database initialized:', absoluteDbPath);
      return this;
    } catch (error) {
      console.error('Database initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Configure database for optimal cross-platform performance
   */
  async configureDatabase() {
    const pragmas = [
      `PRAGMA journal_mode = ${this.config.mode}`,
      'PRAGMA synchronous = NORMAL',
      'PRAGMA cache_size = 10000',
      'PRAGMA temp_store = MEMORY',
      'PRAGMA foreign_keys = ON'
    ];

    for (const pragma of pragmas) {
      await this.run(pragma);
    }
  }

  /**
   * Initialize database schema
   */
  async initializeSchema() {
    if (!fs.existsSync(this.config.schemaPath)) {
      console.warn('Schema file not found, creating basic tables');
      await this.createBasicSchema();
      return;
    }

    try {
      const schema = fs.readFileSync(this.config.schemaPath, 'utf8');
      await this.exec(schema);
      console.log('✅ Schema initialized from file');
    } catch (error) {
      console.warn('Schema initialization warning:', error.message);
      await this.createBasicSchema();
    }
  }

  /**
   * Create basic schema if file doesn't exist
   */
  async createBasicSchema() {
    const basicTables = [
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
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (line_item_id) REFERENCES line_items(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        line_item_id INTEGER,
        detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        type TEXT,
        severity TEXT,
        description TEXT,
        resolved BOOLEAN DEFAULT 0,
        resolved_at DATETIME,
        FOREIGN KEY (line_item_id) REFERENCES line_items(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        insertion_order_id INTEGER,
        invoice_number TEXT UNIQUE,
        amount DECIMAL(15,2),
        agency_fee DECIMAL(15,2),
        total_amount DECIMAL(15,2),
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME,
        FOREIGN KEY (insertion_order_id) REFERENCES insertion_orders(id)
      )`
    ];

    for (const sql of basicTables) {
      await this.run(sql);
    }
  }

  /**
   * Create system tables for Flow Nexus session persistence
   */
  async createSystemTables() {
    const systemTables = [
      `CREATE TABLE IF NOT EXISTS flow_nexus_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        user_email TEXT,
        session_token TEXT,
        authenticated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        status TEXT DEFAULT 'active'
      )`,
      
      `CREATE TABLE IF NOT EXISTS flow_nexus_swarms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        swarm_id TEXT UNIQUE,
        topology TEXT,
        max_agents INTEGER,
        strategy TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        destroyed_at DATETIME
      )`,
      
      `CREATE TABLE IF NOT EXISTS flow_nexus_agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT UNIQUE,
        swarm_id TEXT,
        type TEXT,
        name TEXT,
        capabilities TEXT, -- JSON string
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (swarm_id) REFERENCES flow_nexus_swarms(swarm_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS flow_nexus_workflows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workflow_id TEXT UNIQUE,
        name TEXT,
        description TEXT,
        steps TEXT, -- JSON string
        triggers TEXT, -- JSON string
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS flow_nexus_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT UNIQUE,
        task_description TEXT,
        strategy TEXT,
        priority TEXT,
        status TEXT DEFAULT 'pending',
        result TEXT, -- JSON string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      )`,
      
      `CREATE TABLE IF NOT EXISTS system_state (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of systemTables) {
      await this.run(sql);
    }
    
    console.log('✅ System tables for Flow Nexus persistence created');
  }

  /**
   * Save Flow Nexus session
   */
  async saveSession(sessionData) {
    const { user, session } = sessionData;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    await this.run(
      `INSERT OR REPLACE INTO flow_nexus_sessions 
       (user_id, user_email, session_token, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [user.id, user.email, session.access_token, expiresAt.toISOString()]
    );
  }

  /**
   * Restore Flow Nexus session
   */
  async restoreSession() {
    const session = await this.get(
      `SELECT * FROM flow_nexus_sessions 
       WHERE status = 'active' AND expires_at > datetime('now') 
       ORDER BY authenticated_at DESC LIMIT 1`
    );
    
    return session;
  }

  /**
   * Save swarm state
   */
  async saveSwarm(swarmData) {
    await this.run(
      `INSERT OR REPLACE INTO flow_nexus_swarms 
       (swarm_id, topology, max_agents, strategy, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [swarmData.swarmId, swarmData.topology, swarmData.maxAgents, swarmData.strategy, 'active']
    );
  }

  /**
   * Save agent state
   */
  async saveAgent(agentData) {
    await this.run(
      `INSERT OR REPLACE INTO flow_nexus_agents 
       (agent_id, swarm_id, type, name, capabilities, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        agentData.id || agentData.agentId, 
        agentData.swarmId, 
        agentData.type, 
        agentData.name,
        JSON.stringify(agentData.capabilities || []), 
        'active'
      ]
    );
  }

  /**
   * Save workflow state
   */
  async saveWorkflow(workflowData) {
    await this.run(
      `INSERT OR REPLACE INTO flow_nexus_workflows 
       (workflow_id, name, description, steps, triggers, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        workflowData.id || workflowData.workflow_id,
        workflowData.name,
        workflowData.description,
        JSON.stringify(workflowData.steps || []),
        JSON.stringify(workflowData.triggers || []),
        'active'
      ]
    );
  }

  /**
   * Get current system state for restoration
   */
  async getSystemState() {
    const [session, swarms, agents, workflows] = await Promise.all([
      this.restoreSession(),
      this.all(`SELECT * FROM flow_nexus_swarms WHERE status = 'active'`),
      this.all(`SELECT * FROM flow_nexus_agents WHERE status = 'active'`),
      this.all(`SELECT * FROM flow_nexus_workflows WHERE status = 'active'`)
    ]);

    return {
      session,
      swarms: swarms.map(s => ({
        swarmId: s.swarm_id,
        topology: s.topology,
        maxAgents: s.max_agents,
        strategy: s.strategy
      })),
      agents: agents.map(a => ({
        id: a.agent_id,
        swarmId: a.swarm_id,
        type: a.type,
        name: a.name,
        capabilities: JSON.parse(a.capabilities || '[]')
      })),
      workflows: workflows.map(w => ({
        id: w.workflow_id,
        name: w.name,
        description: w.description,
        steps: JSON.parse(w.steps || '[]'),
        triggers: JSON.parse(w.triggers || '[]')
      }))
    };
  }

  /**
   * Clear session (logout)
   */
  async clearSession() {
    await this.run(`UPDATE flow_nexus_sessions SET status = 'inactive' WHERE status = 'active'`);
    await this.run(`UPDATE flow_nexus_swarms SET status = 'destroyed' WHERE status = 'active'`);
    await this.run(`UPDATE flow_nexus_agents SET status = 'destroyed' WHERE status = 'active'`);
  }

  /**
   * Promise-based database operations
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Database close error:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const tables = await this.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    const stats = {};
    for (const table of tables) {
      const count = await this.get(`SELECT COUNT(*) as count FROM ${table.name}`);
      stats[table.name] = count.count;
    }
    
    return {
      tables: tables.length,
      counts: stats,
      dbPath: this.config.dbPath
    };
  }
}

module.exports = DatabaseManager;