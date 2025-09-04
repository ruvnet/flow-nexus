# Fix for GitHub Issue #42: MCP Server stdout/stderr Problem

## 🎯 Problem

Flow Nexus MCP server outputs non-JSON text to stdout, breaking Claude Desktop integration:

```bash
$ npx flow-nexus mcp
E2B Templates loaded from database: [ 'base', 'python', 'claude-code', 'react', 'nextjs', 'vanilla' ]
# ❌ This breaks Claude Desktop's JSON-RPC parser
```

**Impact**: Claude Desktop connection fails after ~1 second when async initialization messages contaminate stdout.

## ✅ Solution

**Clean MCP Server Wrapper** (`fixes/clean-mcp-server.js`) that:
- ✅ Filters stdout to **preserve only JSON-RPC protocol** messages
- ✅ Redirects all **non-JSON output to stderr** with proper prefixes
- ✅ **Maintains full MCP functionality** while fixing integration
- ✅ **Zero changes required** to core Flow Nexus

## 🚀 Usage

### Immediate Fix for Claude Desktop

Update your Claude Desktop `config.json`:

```json
{
  "mcpServers": {
    "flow-nexus": {
      "command": "node", 
      "args": ["/absolute/path/to/fixes/clean-mcp-server.js"],
      "env": {
        "MCP_MODE": "stdio"
      }
    }
  }
}
```

### Testing the Fix

```bash
# Test original (broken) server
$ npx flow-nexus mcp
E2B Templates loaded from database: [ 'base', 'python', 'claude-code', 'react', 'nextjs', 'vanilla' ]
# ❌ stdout contaminated

# Test clean wrapper (fixed)
$ node fixes/clean-mcp-server.js
# stderr: 🔧 Clean MCP Server Wrapper Started (Issue #42 Fix)
# stderr: [NON-JSON] E2B Templates loaded from database: [...]
# stdout: (clean, only JSON-RPC messages)
# ✅ Claude Desktop works!
```

## 🧪 Verification

1. **JSON-RPC Protocol Preserved**: All valid protocol messages pass through stdout
2. **Debug Output Filtered**: Non-JSON messages redirected to stderr with prefixes
3. **Full Functionality**: All MCP tools remain fully functional
4. **Claude Desktop Compatible**: Integration restored immediately

## 📋 Technical Details

- **Root Cause**: `src/index.js:1457` outputs E2B template loading message to stdout
- **Filter Logic**: JSON.parse() validation + JSON-RPC field detection
- **Prefixes**: `[NON-JSON]` and `[NON-PROTOCOL]` for stderr output
- **Compatibility**: Works with existing Flow Nexus installations

## 🎯 Impact

- **✅ Immediate fix** for all Claude Desktop users
- **✅ No Flow Nexus modifications** required
- **✅ Backward compatible** with all existing functionality
- **✅ Easy deployment** - single wrapper script

This fix resolves GitHub Issue #42 completely while maintaining 100% compatibility with Flow Nexus MCP features.