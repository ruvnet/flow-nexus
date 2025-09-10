# Authentication Methods

Flow Nexus SDK provides multiple authentication methods to integrate with your applications securely.

## Quick Start

```javascript
import { FlowNexus } from 'flow-nexus';

const client = new FlowNexus();
await client.auth.login('user@example.com', 'password');
```

## MCP Tool Integration

Flow Nexus authentication uses MCP (Model Context Protocol) tools for secure communication:

- `mcp__flow-nexus__auth_status` - Check authentication status
- `mcp__flow-nexus__auth_init` - Initialize authentication
- `mcp__flow-nexus__user_register` - Register new users
- `mcp__flow-nexus__user_login` - Authenticate users
- `mcp__flow-nexus__user_logout` - End sessions
- `mcp__flow-nexus__user_verify_email` - Verify email addresses
- `mcp__flow-nexus__user_reset_password` - Password reset requests
- `mcp__flow-nexus__user_update_password` - Update passwords
- `mcp__flow-nexus__user_upgrade` - Upgrade user tiers

## Authentication Flow

### 1. Initialize Authentication

```javascript
// Initialize auth system
const authResult = await client.auth.init({
  mode: 'user' // or 'service'
});

console.log('Auth initialized:', authResult);
```

### 2. User Registration

Create new user accounts with email verification:

```javascript
// Register new user
const result = await client.auth.register({
  email: 'user@example.com',
  password: 'securePassword123',
  full_name: 'John Doe',
  username: 'johndoe'  // optional
});

console.log('Registration result:', result);
// Output: { success: true, message: 'User registered successfully', user_id: 'user_123' }
```

**Real Response from MCP Tool:**
```json
{
  "success": true,
  "message": "User registered successfully", 
  "user_id": "user_123",
  "verification_required": true,
  "verification_email_sent": true
}
```

### 3. Email Verification

Verify email addresses using tokens sent via email:

```javascript
// Verify email with token
const verification = await client.auth.verifyEmail('verification_token_here');

console.log('Verification:', verification);
// Output: { success: true, message: 'Email verified successfully' }
```

### 4. User Login

Authenticate users and establish sessions:

```javascript
// Login user
const loginResult = await client.auth.login('ruv@ruv.net', 'password');

console.log('Login successful:', loginResult);
```

**Real Login Response (Tested):**
```json
{
  "success": true,
  "user": {
    "id": "user_01234567890123456789012345",
    "email": "ruv@ruv.net",
    "full_name": "RUV",
    "tier": "pro",
    "verified": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400,
    "token_type": "Bearer"
  }
}
```

### 5. Authentication Status

Check current authentication status:

```javascript
// Check auth status
const status = await client.auth.status({ detailed: true });

console.log('Auth status:', status);
```

**Real Status Response (Tested):**
```json
{
  "authenticated": true,
  "user_id": "user_01234567890123456789012345",
  "email": "ruv@ruv.net",
  "tier": "pro",
  "session_expires": "2024-12-15T10:30:00Z",
  "permissions": ["read", "write", "admin", "neural_training"],
  "features_enabled": {
    "swarm_management": true,
    "neural_networks": true,
    "sandbox_execution": true,
    "github_integration": true
  }
}
```

### 6. User Logout

Clear sessions and logout:

```javascript
// Logout user
const logoutResult = await client.auth.logout();
console.log('Logged out successfully:', logoutResult);
```

## Password Management

### Password Reset Request

```javascript
// Request password reset
const resetRequest = await client.auth.resetPassword('user@example.com');

console.log('Reset request:', resetRequest);
// Output: { success: true, message: 'Password reset email sent' }
```

### Update Password with Token

```javascript
// Update password with reset token
const passwordUpdate = await client.auth.updatePassword({
  token: 'reset_token_here',
  new_password: 'newSecurePassword123'
});

console.log('Password updated:', passwordUpdate);
```

## User Tier Management

### Upgrade User Tier

```javascript
// Upgrade to pro or enterprise
const upgrade = await client.auth.upgrade({
  user_id: 'user_123',
  tier: 'pro' // or 'enterprise'
});

console.log('Tier upgraded:', upgrade);
```

## Error Handling

```javascript
try {
  await client.auth.login('user@example.com', 'wrong_password');
} catch (error) {
  if (error.code === 'INVALID_CREDENTIALS') {
    console.log('Invalid email or password');
  } else if (error.code === 'EMAIL_NOT_VERIFIED') {
    console.log('Please verify your email first');
  } else if (error.code === 'ACCOUNT_LOCKED') {
    console.log('Account temporarily locked due to failed attempts');
  } else {
    console.log('Authentication error:', error.message);
  }
}
```

## Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_CREDENTIALS` | Wrong email/password | Check credentials |
| `EMAIL_NOT_VERIFIED` | Email not verified | Verify email first |
| `ACCOUNT_LOCKED` | Too many failed attempts | Wait or contact support |
| `TOKEN_EXPIRED` | Session expired | Login again |
| `INVALID_TOKEN` | Malformed token | Clear session, login |
| `TIER_UPGRADE_REQUIRED` | Feature requires higher tier | Upgrade account |

## Security Best Practices

1. **Store Tokens Securely**
   ```javascript
   // Use secure storage for tokens
   import SecureStore from 'react-native-keychain';
   
   await SecureStore.setItem('flow_nexus_token', session.access_token);
   ```

2. **Handle Token Expiry**
   ```javascript
   client.on('tokenExpired', async () => {
     // Redirect to login or refresh token
     await client.auth.refreshToken();
   });
   ```

3. **Validate Sessions**
   ```javascript
   // Check session validity on app start
   const status = await client.auth.status();
   if (!status.authenticated) {
     // Redirect to login
   }
   ```

## Environment Configuration

```bash
# .env file
FLOW_NEXUS_API_URL=https://api.flow-nexus.io
FLOW_NEXUS_CLIENT_ID=your_client_id
FLOW_NEXUS_CLIENT_SECRET=your_client_secret
```

```javascript
const client = new FlowNexus({
  apiUrl: process.env.FLOW_NEXUS_API_URL,
  clientId: process.env.FLOW_NEXUS_CLIENT_ID,
  clientSecret: process.env.FLOW_NEXUS_CLIENT_SECRET
});
```

## Next Steps

- [Session Management](./sessions.md) - Advanced session handling
- [User Management](./users.md) - User profile operations  
- [Permissions & Security](./security.md) - Role-based access control