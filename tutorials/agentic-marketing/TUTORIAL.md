# Flow Nexus MCP SDK Tutorial

## 🎯 Tutorial Overview

This tutorial demonstrates how to create a **Flow Nexus application using MCP tools as an SDK**. The project has been completely reorganized from a monolithic structure into a modular architecture that properly integrates Flow Nexus MCP tools for autonomous business operations.

## 📁 Project Structure

```
/workspaces/flow-nexus/tutorials/mediaspend/
├── src/                              # Modular application components
│   ├── AgenticMarketingServer.js     # Main application server
│   ├── FlowNexusSDK.js              # Flow Nexus MCP integration SDK
│   ├── AuthenticationManager.js      # Session & credential management
│   ├── MediaPlanningAPI.js          # REST API endpoints
│   └── DatabaseManager.js           # Cross-platform SQLite persistence
├── main.js                          # Application entry point & MCP injection
├── agentic-marketing.js            # CLI tool for project management
├── test-system.js                  # System validation & testing
├── README.md                       # Comprehensive documentation
├── package.json                    # Updated v2.0 with proper dependencies
├── schema.sql                      # Database schema for media operations
└── mediaspend.db                   # SQLite database (auto-created)
```

## 🔧 Key Architectural Changes

### Before: Monolithic Files
- ❌ 20+ scattered JavaScript files
- ❌ Mixed concerns and responsibilities  
- ❌ CLI-based Flow Nexus integration
- ❌ No session persistence
- ❌ Platform-specific implementations

### After: Modular SDK Architecture
- ✅ **5 focused modules** in `/src/` directory
- ✅ **Separation of concerns** - each module has single responsibility
- ✅ **Direct MCP integration** - Flow Nexus tools used as SDK
- ✅ **Cross-session persistence** - SQLite with state restoration
- ✅ **Cross-platform compatibility** - Works on Linux, macOS, Windows

## 🛠️ Core Modules

### 1. FlowNexusSDK.js
**Purpose**: Direct integration with Flow Nexus MCP tools as an SDK

**Key Features**:
- Direct MCP tool invocation (no CLI commands)
- Automatic swarm initialization after authentication
- Persistent agent and workflow management
- Event-driven architecture with session persistence

**Usage Example**:
```javascript
const sdk = new FlowNexusSDK();
sdk.initialize(mcpTools, databaseManager);
await sdk.login(email, password);
// Swarms, agents, workflows auto-initialize and persist to database
```

### 2. AuthenticationManager.js
**Purpose**: Handle Flow Nexus authentication with session management

**Key Features**:
- Session persistence across application restarts
- Multiple authentication modes (interactive, CLI, API, non-interactive)
- Secure credential handling with temporary file cleanup
- Session expiration and renewal

### 3. DatabaseManager.js
**Purpose**: Cross-platform SQLite database with Flow Nexus state persistence

**Key Features**:
- **Cross-platform** - absolute paths, forward slashes for compatibility
- **System tables** for Flow Nexus sessions, swarms, agents, workflows
- **Automatic schema creation** and migration
- **Session restoration** - complete system state survives restarts

### 4. MediaPlanningAPI.js
**Purpose**: RESTful API endpoints that integrate with Flow Nexus AI

**Key Features**:
- Authentication middleware requiring Flow Nexus login
- AI-powered analytics and optimization endpoints
- Database integration for media planning operations
- Error handling for uninitialized Flow Nexus components

### 5. AgenticMarketingServer.js
**Purpose**: Main application server that coordinates all modules

**Key Features**:
- **Proper initialization order**: Database → SDK → Auth → API
- **Event-driven coordination** between modules
- **Auto-restoration** of previous sessions and swarm state
- **Non-interactive mode** support for automated deployments

## 🔌 Flow Nexus MCP Integration

### SDK Pattern (New Approach)
```javascript
// Direct MCP tool usage - no CLI commands
const result = await this.mcp.user_login({ email, password });
const swarm = await this.mcp.swarm_init({ topology: 'hierarchical' });
const task = await this.mcp.task_orchestrate({ task: 'optimize campaign' });
```

### Session Persistence
- **User sessions** stored in SQLite with expiration
- **Swarm configurations** persisted across restarts
- **Agent states** maintained with capabilities tracking
- **Workflow definitions** restored automatically

### Authentication Flow
1. **Environment variables** for non-interactive mode
2. **CLI credentials** saved during init process
3. **Database session** restoration from previous runs
4. **Interactive prompts** as fallback

## 🧪 Testing & Validation

### Non-Interactive Testing
```bash
# Set credentials via environment variables
export FLOW_NEXUS_EMAIL="ruv@ruv.net"
export FLOW_NEXUS_PASSWORD="password123" 
export FLOW_NEXUS_ACTION="login"

# Start server - auto-authenticates and initializes
node main.js
```

### API Testing
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test Flow Nexus status
curl http://localhost:3000/api/flow-nexus/status

# Test AI-powered analytics
curl http://localhost:3000/api/analytics/performance
```

### Cross-Platform Validation
- ✅ **Linux**: Native SQLite support
- ✅ **macOS**: Shell script execution  
- ✅ **Windows**: PowerShell and batch file support

## 🎯 Tutorial Learning Objectives

### 1. **MCP SDK Pattern**
Learn how to use Flow Nexus MCP tools as a proper SDK rather than CLI commands:
- Direct function invocation vs. spawn/exec
- Proper error handling and result parsing
- Event-driven architecture with MCP events

### 2. **Session Persistence**
Implement cross-session continuity:
- Database storage of Flow Nexus state
- Automatic restoration of swarms, agents, workflows
- Session expiration and renewal handling

### 3. **Modular Architecture** 
Build scalable applications with separated concerns:
- Single responsibility principle per module
- Dependency injection and initialization order
- Event-driven communication between modules

### 4. **Cross-Platform Development**
Create applications that work across operating systems:
- Path handling with proper separators
- Database file management
- Script execution across platforms

### 5. **Authentication Strategies**
Handle multiple authentication scenarios:
- Interactive user prompts
- Non-interactive automation
- API-based authentication
- Session restoration

## 🚀 Usage Instructions

### Development Setup
```bash
cd /workspaces/flow-nexus/tutorials/mediaspend
npm install
node main.js
```

### Production Deployment
```bash
# Initialize new project
npx agentic-marketing init my-project

# Configure non-interactive auth
export FLOW_NEXUS_EMAIL="user@example.com"
export FLOW_NEXUS_PASSWORD="password"
export FLOW_NEXUS_ACTION="login"

# Start in production
cd my-project
npm start
```

### Testing & Validation
```bash
# Run system tests
node test-system.js

# Check database state
sqlite3 mediaspend.db "SELECT * FROM flow_nexus_sessions;"
```

## 💡 Key Takeaways

1. **Flow Nexus MCP tools work best as SDK** - direct function calls vs CLI
2. **Session persistence is critical** - users expect continuity across restarts  
3. **Modular architecture scales** - separation of concerns enables growth
4. **Cross-platform requires planning** - file paths, scripts, database handling
5. **Authentication is multifaceted** - support interactive and automated modes

## 📚 Next Steps

To extend this tutorial:
1. **Add more MCP tools** - neural networks, advanced workflows
2. **Create custom agents** - domain-specific AI agents
3. **Implement real-time features** - WebSocket connections, live updates
4. **Add advanced analytics** - machine learning insights
5. **Build mobile apps** - React Native with Flow Nexus integration

---

**This tutorial demonstrates a complete Flow Nexus MCP SDK implementation with production-ready patterns for autonomous business operations.**