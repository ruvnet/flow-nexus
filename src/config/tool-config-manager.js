
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
        throw new Error(`Failed to update tool ${toolName}: ${error.message}`);
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
