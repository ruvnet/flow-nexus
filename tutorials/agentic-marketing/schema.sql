-- Media Spend Tracking Database Schema
-- SQLite database for comprehensive media planning and spend management

-- Advertisers/Clients table
CREATE TABLE IF NOT EXISTS advertisers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    industry TEXT,
    contact_email TEXT,
    budget_total DECIMAL(12,2),
    budget_allocated DECIMAL(12,2) DEFAULT 0,
    budget_spent DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media Channels table
CREATE TABLE IF NOT EXISTS media_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_name TEXT NOT NULL UNIQUE,
    channel_type TEXT CHECK(channel_type IN ('digital', 'traditional', 'social', 'search', 'display', 'video', 'audio')),
    platform TEXT, -- Google, Meta, TikTok, etc.
    commission_rate DECIMAL(5,2) DEFAULT 15.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion Orders table
CREATE TABLE IF NOT EXISTS insertion_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    io_number TEXT UNIQUE NOT NULL,
    advertiser_id INTEGER NOT NULL,
    campaign_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget DECIMAL(12,2) NOT NULL,
    status TEXT CHECK(status IN ('draft', 'pending_approval', 'approved', 'active', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
    approval_date TIMESTAMP,
    approved_by TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (advertiser_id) REFERENCES advertisers(id)
);

-- Line Items (individual media buys within an IO)
CREATE TABLE IF NOT EXISTS line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insertion_order_id INTEGER NOT NULL,
    channel_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    placement_type TEXT,
    targeting_criteria TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    impressions_goal INTEGER,
    clicks_goal INTEGER,
    conversions_goal INTEGER,
    cpm_rate DECIMAL(10,2),
    cpc_rate DECIMAL(10,2),
    cpa_rate DECIMAL(10,2),
    flat_rate DECIMAL(12,2),
    budget_allocated DECIMAL(12,2) NOT NULL,
    budget_spent DECIMAL(12,2) DEFAULT 0,
    status TEXT CHECK(status IN ('planned', 'active', 'paused', 'completed')) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (insertion_order_id) REFERENCES insertion_orders(id),
    FOREIGN KEY (channel_id) REFERENCES media_channels(id)
);

-- Daily Spend Tracking
CREATE TABLE IF NOT EXISTS daily_spend (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    line_item_id INTEGER NOT NULL,
    spend_date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend_amount DECIMAL(12,2) NOT NULL,
    cpm_actual DECIMAL(10,2),
    cpc_actual DECIMAL(10,2),
    cpa_actual DECIMAL(10,2),
    anomaly_detected BOOLEAN DEFAULT FALSE,
    anomaly_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (line_item_id) REFERENCES line_items(id),
    UNIQUE(line_item_id, spend_date)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    insertion_order_id INTEGER NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    agency_fee DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    status TEXT CHECK(status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
    payment_date DATE,
    payment_method TEXT,
    payment_reference TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (insertion_order_id) REFERENCES insertion_orders(id)
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    line_item_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    quantity DECIMAL(12,2),
    unit_price DECIMAL(12,2),
    amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (line_item_id) REFERENCES line_items(id)
);

-- Spend Anomalies and Errors
CREATE TABLE IF NOT EXISTS spend_anomalies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    line_item_id INTEGER NOT NULL,
    anomaly_date DATE NOT NULL,
    anomaly_type TEXT CHECK(anomaly_type IN ('overspend', 'underspend', 'pace_high', 'pace_low', 'duplicate', 'missing_data', 'rate_spike', 'rate_drop')),
    expected_value DECIMAL(12,2),
    actual_value DECIMAL(12,2),
    variance_percentage DECIMAL(5,2),
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    resolution_status TEXT CHECK(resolution_status IN ('detected', 'investigating', 'resolved', 'ignored')) DEFAULT 'detected',
    resolution_notes TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (line_item_id) REFERENCES line_items(id)
);

-- Audit Log for compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    user_id TEXT,
    user_email TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pacing and Budget Alerts
CREATE TABLE IF NOT EXISTS budget_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insertion_order_id INTEGER,
    line_item_id INTEGER,
    alert_type TEXT CHECK(alert_type IN ('pace_ahead', 'pace_behind', 'budget_75', 'budget_90', 'budget_exceeded', 'anomaly')),
    alert_message TEXT NOT NULL,
    threshold_value DECIMAL(12,2),
    actual_value DECIMAL(12,2),
    alert_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMP,
    FOREIGN KEY (insertion_order_id) REFERENCES insertion_orders(id),
    FOREIGN KEY (line_item_id) REFERENCES line_items(id)
);

-- Views for reporting
CREATE VIEW IF NOT EXISTS io_summary AS
SELECT 
    io.id,
    io.io_number,
    io.campaign_name,
    a.name as advertiser_name,
    io.start_date,
    io.end_date,
    io.total_budget,
    COALESCE(SUM(li.budget_allocated), 0) as budget_allocated,
    COALESCE(SUM(li.budget_spent), 0) as budget_spent,
    io.total_budget - COALESCE(SUM(li.budget_spent), 0) as budget_remaining,
    ROUND((COALESCE(SUM(li.budget_spent), 0) / io.total_budget) * 100, 2) as spend_percentage,
    io.status,
    julianday(io.end_date) - julianday('now') as days_remaining
FROM insertion_orders io
LEFT JOIN advertisers a ON io.advertiser_id = a.id
LEFT JOIN line_items li ON io.id = li.insertion_order_id
GROUP BY io.id;

CREATE VIEW IF NOT EXISTS daily_spend_summary AS
SELECT 
    ds.spend_date,
    mc.channel_name,
    mc.platform,
    SUM(ds.impressions) as total_impressions,
    SUM(ds.clicks) as total_clicks,
    SUM(ds.conversions) as total_conversions,
    SUM(ds.spend_amount) as total_spend,
    AVG(ds.cpm_actual) as avg_cpm,
    AVG(ds.cpc_actual) as avg_cpc,
    AVG(ds.cpa_actual) as avg_cpa,
    SUM(CASE WHEN ds.anomaly_detected THEN 1 ELSE 0 END) as anomalies_count
FROM daily_spend ds
JOIN line_items li ON ds.line_item_id = li.id
JOIN media_channels mc ON li.channel_id = mc.id
GROUP BY ds.spend_date, mc.channel_name, mc.platform
ORDER BY ds.spend_date DESC;

-- Indexes for performance
CREATE INDEX idx_io_advertiser ON insertion_orders(advertiser_id);
CREATE INDEX idx_li_io ON line_items(insertion_order_id);
CREATE INDEX idx_li_channel ON line_items(channel_id);
CREATE INDEX idx_ds_line_item ON daily_spend(line_item_id);
CREATE INDEX idx_ds_date ON daily_spend(spend_date);
CREATE INDEX idx_invoice_io ON invoices(insertion_order_id);
CREATE INDEX idx_anomaly_line_item ON spend_anomalies(line_item_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- Triggers for updating timestamps
CREATE TRIGGER update_advertiser_timestamp 
AFTER UPDATE ON advertisers
BEGIN
    UPDATE advertisers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_io_timestamp 
AFTER UPDATE ON insertion_orders
BEGIN
    UPDATE insertion_orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_line_item_timestamp 
AFTER UPDATE ON line_items
BEGIN
    UPDATE line_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ===================================================================
-- FLOW NEXUS MCP INTEGRATION TABLES
-- ===================================================================

-- Flow Nexus Session Management
CREATE TABLE IF NOT EXISTS flow_nexus_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  session_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  credits_remaining REAL DEFAULT 0,
  tier TEXT DEFAULT 'free',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flow Nexus Swarm Management
CREATE TABLE IF NOT EXISTS flow_nexus_swarms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  swarm_id TEXT UNIQUE NOT NULL,
  topology TEXT NOT NULL,
  max_agents INTEGER DEFAULT 8,
  strategy TEXT DEFAULT 'balanced',
  status TEXT DEFAULT 'active',
  agents_deployed INTEGER DEFAULT 0,
  templates_used TEXT, -- JSON array
  credits_used REAL DEFAULT 0,
  sandbox_ids TEXT, -- JSON array of sandbox IDs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flow Nexus Agent Management
CREATE TABLE IF NOT EXISTS flow_nexus_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT UNIQUE NOT NULL,
  swarm_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  name TEXT,
  capabilities TEXT, -- JSON array
  status TEXT DEFAULT 'active',
  sandbox_id TEXT,
  template_used TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (swarm_id) REFERENCES flow_nexus_swarms(swarm_id)
);

-- Flow Nexus Workflow Management
CREATE TABLE IF NOT EXISTS flow_nexus_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  steps TEXT, -- JSON array
  triggers TEXT, -- JSON array
  status TEXT DEFAULT 'active',
  priority INTEGER DEFAULT 5,
  using_new_system BOOLEAN DEFAULT FALSE,
  features TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flow Nexus Task Management
CREATE TABLE IF NOT EXISTS flow_nexus_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  strategy TEXT DEFAULT 'adaptive',
  status TEXT DEFAULT 'pending',
  max_agents INTEGER,
  assigned_agents TEXT, -- JSON array
  results TEXT, -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flow Nexus Neural Networks
CREATE TABLE IF NOT EXISTS flow_nexus_neural_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT UNIQUE NOT NULL,
  name TEXT,
  architecture TEXT,
  config TEXT, -- JSON object
  tier TEXT DEFAULT 'small',
  status TEXT DEFAULT 'training',
  accuracy REAL,
  training_epochs INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flow Nexus Sandboxes
CREATE TABLE IF NOT EXISTS flow_nexus_sandboxes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sandbox_id TEXT UNIQUE NOT NULL,
  name TEXT,
  template TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  env_vars TEXT, -- JSON object
  agent_id TEXT,
  swarm_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flow Nexus Storage
CREATE TABLE IF NOT EXISTS flow_nexus_storage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT UNIQUE NOT NULL,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  content_type TEXT,
  size INTEGER DEFAULT 0,
  public_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flow Nexus Templates
CREATE TABLE IF NOT EXISTS flow_nexus_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  featured BOOLEAN DEFAULT FALSE,
  tier TEXT DEFAULT 'free',
  deployment_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flow Nexus Chat History
CREATE TABLE IF NOT EXISTS flow_nexus_chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  tools_enabled BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flow Nexus Analytics
CREATE TABLE IF NOT EXISTS flow_nexus_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  event_data TEXT, -- JSON object
  user_id TEXT,
  swarm_id TEXT,
  agent_id TEXT,
  workflow_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- FLOW NEXUS INDEXES
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_fn_sessions_user ON flow_nexus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_fn_sessions_email ON flow_nexus_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_fn_swarms_status ON flow_nexus_swarms(status);
CREATE INDEX IF NOT EXISTS idx_fn_agents_swarm ON flow_nexus_agents(swarm_id);
CREATE INDEX IF NOT EXISTS idx_fn_agents_type ON flow_nexus_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_fn_workflows_status ON flow_nexus_workflows(status);
CREATE INDEX IF NOT EXISTS idx_fn_tasks_status ON flow_nexus_tasks(status);
CREATE INDEX IF NOT EXISTS idx_fn_models_status ON flow_nexus_neural_models(status);
CREATE INDEX IF NOT EXISTS idx_fn_sandboxes_status ON flow_nexus_sandboxes(status);
CREATE INDEX IF NOT EXISTS idx_fn_analytics_type ON flow_nexus_analytics(event_type);

-- ===================================================================
-- FLOW NEXUS TRIGGERS
-- ===================================================================

CREATE TRIGGER IF NOT EXISTS update_fn_session_timestamp 
AFTER UPDATE ON flow_nexus_sessions
BEGIN
    UPDATE flow_nexus_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_fn_swarm_timestamp 
AFTER UPDATE ON flow_nexus_swarms
BEGIN
    UPDATE flow_nexus_swarms SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_fn_agent_timestamp 
AFTER UPDATE ON flow_nexus_agents
BEGIN
    UPDATE flow_nexus_agents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_fn_workflow_timestamp 
AFTER UPDATE ON flow_nexus_workflows
BEGIN
    UPDATE flow_nexus_workflows SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;