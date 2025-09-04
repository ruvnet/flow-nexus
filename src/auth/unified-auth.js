
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
        throw new Error(`Authentication failed: ${error.message}`);
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
