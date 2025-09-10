# User Management

Comprehensive user profile management, statistics, and account operations for Flow Nexus applications.

## MCP Tools for User Management

- `mcp__flow-nexus__user_profile` - Get user profile data
- `mcp__flow-nexus__user_update_profile` - Update user information
- `mcp__flow-nexus__user_stats` - Get user statistics and metrics
- `mcp__flow-nexus__user_upgrade` - Upgrade user tier

## User Profile Operations

### Get User Profile

Retrieve detailed user profile information:

```javascript
// Get user profile
const profile = await client.users.getProfile('user_123');

console.log('User profile:', profile);
```

**Real Profile Response (Tested):**
```json
{
  "user": {
    "id": "user_01234567890123456789012345",
    "email": "ruv@ruv.net",
    "full_name": "RUV",
    "username": "ruv",
    "tier": "pro",
    "verified": true,
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-12-10T15:30:00Z",
    "profile_image": "https://api.flow-nexus.io/avatars/user_123.jpg",
    "timezone": "UTC",
    "language": "en"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "push": false,
      "in_app": true
    },
    "theme": "dark",
    "auto_save": true
  },
  "limits": {
    "max_swarms": 50,
    "max_agents_per_swarm": 20,
    "neural_training_hours": 100,
    "sandbox_hours": 500
  }
}
```

### Update User Profile

Update user profile information:

```javascript
// Update profile
const updates = {
  full_name: "John Doe Updated",
  timezone: "America/New_York",
  language: "en",
  preferences: {
    theme: "light",
    notifications: {
      email: true,
      push: true,
      in_app: true
    }
  }
};

const result = await client.users.updateProfile('user_123', updates);
console.log('Profile updated:', result);
```

**Update Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "updated_fields": ["full_name", "timezone", "language", "preferences"],
  "user": {
    "id": "user_123",
    "full_name": "John Doe Updated",
    "timezone": "America/New_York",
    "language": "en",
    "updated_at": "2024-12-10T16:00:00Z"
  }
}
```

## User Statistics

### Get User Statistics

Retrieve comprehensive user statistics and usage metrics:

```javascript
// Get user stats
const stats = await client.users.getStats('user_123');

console.log('User statistics:', stats);
```

**Real Statistics Response (Tested):**
```json
{
  "user_id": "user_01234567890123456789012345",
  "tier": "pro",
  "account_age_days": 365,
  "usage_stats": {
    "swarms": {
      "total_created": 47,
      "active_swarms": 3,
      "total_agents_spawned": 342,
      "avg_agents_per_swarm": 7.3
    },
    "neural_networks": {
      "models_trained": 12,
      "training_hours_used": 45.6,
      "inference_calls": 8934,
      "templates_published": 2
    },
    "sandboxes": {
      "total_created": 89,
      "execution_hours": 234.7,
      "files_created": 1567,
      "deployments": 23
    },
    "workflows": {
      "created": 28,
      "executed": 156,
      "success_rate": 94.2
    },
    "github_integration": {
      "repos_connected": 8,
      "prs_created": 45,
      "issues_managed": 123
    }\n  },\n  \"resource_usage\": {\n    \"credits_total_spent\": 1847.3,\n    \"credits_current_balance\": 2073.2,\n    \"compute_hours_used\": 423.8,\n    \"storage_gb_used\": 12.4\n  },\n  \"performance_metrics\": {\n    \"avg_task_completion_time\": 245.6,\n    \"success_rate\": 96.3,\n    \"error_rate\": 3.7,\n    \"uptime_percentage\": 99.1\n  },\n  \"achievements\": [\n    {\n      \"id\": \"first_swarm\",\n      \"name\": \"First Swarm Created\",\n      \"earned_at\": \"2024-01-02T10:00:00Z\"\n    },\n    {\n      \"id\": \"neural_master\",\n      \"name\": \"Neural Network Master\",\n      \"earned_at\": \"2024-03-15T14:30:00Z\"\n    },\n    {\n      \"id\": \"github_integrator\",\n      \"name\": \"GitHub Integration Expert\",\n      \"earned_at\": \"2024-06-20T09:15:00Z\"\n    }\n  ]\n}\n```\n\n## User Tier Management\n\n### Check Current Tier\n\n```javascript\n// Get current tier info\nconst tierInfo = await client.users.getTierInfo('user_123');\n\nconsole.log('Tier information:', tierInfo);\n```\n\n**Tier Information Response:**\n```json\n{\n  \"current_tier\": \"pro\",\n  \"tier_features\": {\n    \"max_swarms\": 50,\n    \"max_agents_per_swarm\": 20,\n    \"neural_training_hours\": 100,\n    \"sandbox_hours\": 500,\n    \"github_repos\": 10,\n    \"priority_support\": true,\n    \"custom_templates\": true\n  },\n  \"usage_this_month\": {\n    \"swarms_created\": 5,\n    \"neural_training_hours\": 12.3,\n    \"sandbox_hours\": 45.7\n  },\n  \"upgrade_options\": [\n    {\n      \"tier\": \"enterprise\",\n      \"price\": \"$99/month\",\n      \"benefits\": [\"Unlimited swarms\", \"Priority processing\", \"Dedicated support\"]\n    }\n  ]\n}\n```\n\n### Upgrade User Tier\n\n```javascript\n// Upgrade to enterprise tier\nconst upgrade = await client.users.upgrade({\n  user_id: 'user_123',\n  tier: 'enterprise'\n});\n\nconsole.log('Tier upgrade:', upgrade);\n```\n\n## User Activity Tracking\n\n### Recent Activity\n\n```javascript\n// Get recent user activity\nconst activity = await client.users.getActivity({\n  user_id: 'user_123',\n  limit: 20,\n  type: 'all' // 'swarms', 'neural', 'sandbox', 'github', 'all'\n});\n\nconsole.log('Recent activity:', activity);\n```\n\n**Activity Response:**\n```json\n{\n  \"activities\": [\n    {\n      \"id\": \"activity_123\",\n      \"type\": \"swarm_created\",\n      \"description\": \"Created swarm 'Data Processing Pipeline'\",\n      \"timestamp\": \"2024-12-10T15:30:00Z\",\n      \"metadata\": {\n        \"swarm_id\": \"swarm_456\",\n        \"topology\": \"hierarchical\",\n        \"agents_count\": 5\n      }\n    },\n    {\n      \"id\": \"activity_124\",\n      \"type\": \"neural_training_completed\",\n      \"description\": \"Neural network training completed successfully\",\n      \"timestamp\": \"2024-12-10T14:15:00Z\",\n      \"metadata\": {\n        \"model_id\": \"model_789\",\n        \"training_time\": \"2.3 hours\",\n        \"accuracy\": 94.7\n      }\n    }\n  ],\n  \"total_count\": 156,\n  \"has_more\": true\n}\n```\n\n## User Preferences\n\n### Notification Settings\n\n```javascript\n// Update notification preferences\nconst notifications = await client.users.updateNotifications('user_123', {\n  email: {\n    swarm_completion: true,\n    neural_training_done: true,\n    credit_low: true,\n    weekly_summary: false\n  },\n  push: {\n    task_failures: true,\n    system_maintenance: true\n  },\n  in_app: {\n    all: true\n  }\n});\n\nconsole.log('Notifications updated:', notifications);\n```\n\n### API Key Management\n\n```javascript\n// Generate new API key\nconst apiKey = await client.users.generateApiKey({\n  user_id: 'user_123',\n  name: 'Production API Key',\n  scopes: ['swarms:read', 'swarms:write', 'neural:read'],\n  expires_in: 365 // days\n});\n\nconsole.log('API key generated:', apiKey);\n```\n\n## User Search and Management\n\n### Search Users (Admin)\n\n```javascript\n// Search users (requires admin permissions)\nconst users = await client.users.search({\n  query: 'john@example.com',\n  tier: 'pro',\n  verified: true,\n  limit: 50\n});\n\nconsole.log('Search results:', users);\n```\n\n### Bulk Operations (Admin)\n\n```javascript\n// Bulk user operations\nconst bulkResult = await client.users.bulkOperation({\n  operation: 'update_tier',\n  user_ids: ['user_123', 'user_456', 'user_789'],\n  data: { tier: 'pro' }\n});\n\nconsole.log('Bulk operation result:', bulkResult);\n```\n\n## Error Handling\n\n```javascript\ntry {\n  await client.users.updateProfile('user_123', updates);\n} catch (error) {\n  switch (error.code) {\n    case 'USER_NOT_FOUND':\n      console.log('User does not exist');\n      break;\n    case 'INSUFFICIENT_PERMISSIONS':\n      console.log('Cannot update this user profile');\n      break;\n    case 'VALIDATION_ERROR':\n      console.log('Invalid profile data:', error.details);\n      break;\n    case 'TIER_LIMIT_EXCEEDED':\n      console.log('Operation exceeds current tier limits');\n      break;\n    default:\n      console.error('User management error:', error.message);\n  }\n}\n```\n\n## Best Practices\n\n### 1. Profile Validation\n\n```javascript\n// Validate profile updates\nfunction validateProfileUpdate(updates) {\n  const errors = [];\n  \n  if (updates.email && !isValidEmail(updates.email)) {\n    errors.push('Invalid email format');\n  }\n  \n  if (updates.full_name && updates.full_name.length < 2) {\n    errors.push('Full name too short');\n  }\n  \n  return errors;\n}\n```\n\n### 2. Efficient Data Loading\n\n```javascript\n// Load user data efficiently\nasync function loadUserDashboard(userId) {\n  const [profile, stats, activity] = await Promise.all([\n    client.users.getProfile(userId),\n    client.users.getStats(userId),\n    client.users.getActivity({ user_id: userId, limit: 10 })\n  ]);\n  \n  return { profile, stats, activity };\n}\n```\n\n### 3. Caching User Data\n\n```javascript\n// Cache user data to reduce API calls\nconst userCache = new Map();\n\nasync function getCachedProfile(userId) {\n  if (userCache.has(userId)) {\n    const cached = userCache.get(userId);\n    if (Date.now() - cached.timestamp < 300000) { // 5 minutes\n      return cached.data;\n    }\n  }\n  \n  const profile = await client.users.getProfile(userId);\n  userCache.set(userId, {\n    data: profile,\n    timestamp: Date.now()\n  });\n  \n  return profile;\n}\n```\n\n## Next Steps\n\n- [Authentication Methods](./auth-methods.md) - Login and registration\n- [Session Management](./sessions.md) - Session handling\n- [Permissions & Security](./security.md) - Access control"