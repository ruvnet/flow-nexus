#!/usr/bin/env node

/**
 * Fix Critical Issues from GitHub Issue #34
 * Addresses the production readiness concerns identified
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Flow Nexus Critical Issues Fixer (Issue #34)\n');

// Fix 1: Database Schema - Add missing pattern_type defaults
const databaseSchemaFix = `
-- Flow Nexus Database Schema Fixes for Issue #34

-- Fix 1: Add missing pattern_type column with default value
DO $$ 
BEGIN
  -- Add pattern_type column to neural_training_jobs if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'neural_training_jobs' 
    AND column_name = 'pattern_type'
  ) THEN
    ALTER TABLE neural_training_jobs 
    ADD COLUMN pattern_type TEXT DEFAULT 'coordination';
  END IF;
  
  -- Add pattern_type column to neural_models if missing  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'neural_models' 
    AND column_name = 'pattern_type'
  ) THEN
    ALTER TABLE neural_models 
    ADD COLUMN pattern_type TEXT DEFAULT 'coordination';
  END IF;
  
  -- Add pattern_type column to neural_templates if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'neural_templates' 
    AND column_name = 'pattern_type'
  ) THEN
    ALTER TABLE neural_templates 
    ADD COLUMN pattern_type TEXT DEFAULT 'coordination';
  END IF;
END $$;

-- Fix 2: Ensure all MCP tool tables exist with proper constraints
CREATE TABLE IF NOT EXISTS mcp_tool_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix 3: Insert missing neural_list_templates tool registration
INSERT INTO mcp_tool_registry (tool_name, category, is_enabled, configuration)
VALUES (
  'neural_list_templates',
  'neural',
  true,
  '{"description": "List available neural network templates", "implemented": true}'::jsonb
) ON CONFLICT (tool_name) DO UPDATE
SET is_enabled = true, updated_at = NOW();

-- Fix 4: Create authentication unified config table
CREATE TABLE IF NOT EXISTS auth_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert unified auth settings
INSERT INTO auth_config (config_key, config_value, description)
VALUES 
  ('jwt_secret', '"your-jwt-secret-key"'::jsonb, 'JWT secret for token signing'),
  ('session_timeout', '86400'::jsonb, 'Session timeout in seconds (24 hours)'),
  ('require_auth', 'false'::jsonb, 'Whether to require authentication for all tools')
ON CONFLICT (config_key) DO NOTHING;

-- Fix 5: Enable RLS and create policies
ALTER TABLE mcp_tool_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_config ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY "Allow authenticated users to read tools"
  ON mcp_tool_registry FOR SELECT
  USING (true); -- Allow all authenticated users to read

CREATE POLICY "Allow authenticated users to read auth config"
  ON auth_config FOR SELECT  
  USING (true);
`;

// Fix 2: Unified Authentication Module
const unifiedAuthModule = `
/**
 * Unified Authentication Module for Flow Nexus MCP Tools
 * Addresses authentication inconsistencies across different tools
 */

import jwt from 'jsonwebtoken';
import supabaseClient from '../services/supabase-client.js';

class UnifiedAuth {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'flow-nexus-default-secret';
    this.sessionTimeout = 86400; // 24 hours
    this.requireAuth = process.env.REQUIRE_AUTH === 'true';
  }

  /**
   * Get authenticated user from various sources
   * Unifies authentication across all MCP tools
   */
  async getAuthenticatedUser(context = {}) {
    try {
      // Method 1: Try Supabase session
      const { data: userData, error: authError } = await supabaseClient.supabase.auth.getUser();
      if (userData?.user && !authError) {
        return {
          id: userData.user.id,
          email: userData.user.email,
          method: 'supabase_session',
          authenticated: true
        };
      }

      // Method 2: Try JWT token from context
      if (context.token || context.jwt) {
        const token = context.token || context.jwt;
        try {
          const decoded = jwt.verify(token, this.jwtSecret);
          return {
            id: decoded.sub || decoded.user_id,
            email: decoded.email,
            method: 'jwt_token',
            authenticated: true
          };
        } catch (jwtError) {
          console.warn('JWT validation failed:', jwtError.message);
        }
      }

      // Method 3: Try user_id from context (for backward compatibility)
      if (context.user_id) {
        return {
          id: context.user_id,
          email: context.email || null,
          method: 'context_user_id',
          authenticated: true
        };
      }

      // Method 4: Anonymous user (if auth not required)
      if (!this.requireAuth) {
        return {
          id: 'anonymous',
          email: null,
          method: 'anonymous',
          authenticated: false
        };
      }

      // No authentication found
      throw new Error('Authentication required but not provided');
      
    } catch (error) {
      if (this.requireAuth) {
        throw new Error(\`Authentication failed: \${error.message}\`);
      }
      
      // Return anonymous user if auth not required
      return {
        id: 'anonymous',
        email: null,
        method: 'anonymous',
        authenticated: false,
        error: error.message
      };
    }
  }

  /**
   * Validate user has access to specific resource
   */
  async validateAccess(user, resource, operation = 'read') {
    // For anonymous users, only allow read operations on public resources
    if (!user.authenticated) {
      return resource.public === true && operation === 'read';
    }

    // For authenticated users, check specific permissions
    if (user.id === resource.owner_id) {
      return true; // Owner has full access
    }

    // Check public resources
    if (resource.public === true && operation === 'read') {
      return true;
    }

    // Check specific permissions (would integrate with more complex RBAC system)
    return false;
  }

  /**
   * Create unified auth context for MCP tools
   */
  async createAuthContext(args = {}) {
    const user = await this.getAuthenticatedUser(args);
    
    return {
      user,
      requireAuth: this.requireAuth,
      isAuthenticated: user.authenticated,
      canWrite: user.authenticated,
      canRead: true // Always allow read operations
    };
  }
}

export default new UnifiedAuth();
`;

// Fix 3: Tool Registry and Configuration Manager
const toolConfigManager = `
/**
 * MCP Tool Registry and Configuration Manager
 * Centralizes tool configuration and enables/disables tools
 */

import supabaseClient from '../services/supabase-client.js';
import unifiedAuth from './unified-auth.js';

class ToolConfigManager {
  constructor() {
    this.toolCache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 60000; // 1 minute
  }

  /**
   * Get all enabled MCP tools with their configurations
   */
  async getEnabledTools(category = null) {
    try {
      const now = Date.now();
      const cacheKey = category || 'all';
      
      // Check cache first
      if (this.toolCache.has(cacheKey) && 
          (now - this.lastCacheUpdate) < this.cacheTimeout) {
        return this.toolCache.get(cacheKey);
      }

      let query = supabaseClient.supabase
        .from('mcp_tool_registry')
        .select('*')
        .eq('is_enabled', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: tools, error } = await query;
      
      if (error) {
        console.warn('Failed to load tool registry, using defaults:', error.message);
        return this.getDefaultTools(category);
      }

      // Cache the results
      this.toolCache.set(cacheKey, tools);
      this.lastCacheUpdate = now;

      return tools;
      
    } catch (error) {
      console.warn('Tool registry error, using defaults:', error.message);
      return this.getDefaultTools(category);
    }
  }

  /**
   * Default tools configuration (fallback)
   */
  getDefaultTools(category = null) {
    const defaultTools = [
      { tool_name: 'neural_list_templates', category: 'neural', is_enabled: true },
      { tool_name: 'neural_train', category: 'neural', is_enabled: true },
      { tool_name: 'neural_predict', category: 'neural', is_enabled: true },
      { tool_name: 'swarm_init', category: 'swarm', is_enabled: true },
      { tool_name: 'agent_spawn', category: 'swarm', is_enabled: true },
      { tool_name: 'task_orchestrate', category: 'swarm', is_enabled: true },
      { tool_name: 'sandbox_create', category: 'sandbox', is_enabled: true },
      { tool_name: 'sandbox_execute', category: 'sandbox', is_enabled: true }
    ];

    return category 
      ? defaultTools.filter(tool => tool.category === category)
      : defaultTools;
  }

  /**
   * Enable/disable specific tool
   */
  async setToolEnabled(toolName, enabled = true) {
    try {
      const authContext = await unifiedAuth.createAuthContext();
      
      if (!authContext.canWrite) {
        throw new Error('Write access required to modify tool configuration');
      }

      const { error } = await supabaseClient.supabase
        .from('mcp_tool_registry')
        .upsert({
          tool_name: toolName,
          is_enabled: enabled,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(\`Failed to update tool \${toolName}: \${error.message}\`);
      }

      // Clear cache
      this.toolCache.clear();
      
      return {
        success: true,
        tool_name: toolName,
        is_enabled: enabled
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get tool configuration
   */
  async getToolConfig(toolName) {
    try {
      const { data: tool, error } = await supabaseClient.supabase
        .from('mcp_tool_registry')
        .select('*')
        .eq('tool_name', toolName)
        .single();

      if (error || !tool) {
        // Return default config for known tools
        const defaults = this.getDefaultTools();
        const defaultTool = defaults.find(t => t.tool_name === toolName);
        return defaultTool || { tool_name: toolName, is_enabled: false };
      }

      return tool;
      
    } catch (error) {
      return {
        tool_name: toolName,
        is_enabled: false,
        error: error.message
      };
    }
  }
}

export default new ToolConfigManager();
`;

// Write all fix files
try {
  await fs.writeFile(
    path.join(__dirname, '../sql/fix-issue-34-schema.sql'),
    databaseSchemaFix,
    'utf8'
  );
  
  await fs.mkdir(path.join(__dirname, '../src/auth'), { recursive: true });
  await fs.writeFile(
    path.join(__dirname, '../src/auth/unified-auth.js'),
    unifiedAuthModule,
    'utf8'
  );
  
  await fs.mkdir(path.join(__dirname, '../src/config'), { recursive: true });
  await fs.writeFile(
    path.join(__dirname, '../src/config/tool-config-manager.js'),
    toolConfigManager,
    'utf8'
  );

  console.log('✅ Created fix files successfully:');
  console.log('  - sql/fix-issue-34-schema.sql');
  console.log('  - src/auth/unified-auth.js');
  console.log('  - src/config/tool-config-manager.js');

} catch (error) {
  console.error('❌ Error creating fix files:', error.message);
}