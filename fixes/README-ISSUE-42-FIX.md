# Fix for GitHub Issue #42: MCP Server stdout/stderr Problem

## 🎯 Problem Description

Flow Nexus MCP server outputs non-JSON text to stdout, breaking Claude Desktop integration:
- **Root Cause**: Debug messages like "E2B Templates loaded from database" go to stdout
- **Impact**: JSON-RPC protocol corruption, Claude Desktop connection failure
- **Error**: JSON parser fails after ~1 second when non-JSON output appears

## ✅ Solution Implemented

### Clean MCP Server Wrapper (`clean-mcp-server.js`)

A filtering wrapper that:
- ✅ **Preserves JSON-RPC protocol** on stdout
- ✅ **Redirects all non-JSON output** to stderr  
- ✅ **Maintains full MCP functionality**
- ✅ **Compatible with Claude Desktop**

## 🚀 Usage

### Option 1: Direct Usage
```bash
# Run the clean wrapper directly
node fixes/clean-mcp-server.js

# Test with a JSON-RPC message
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node fixes/clean-mcp-server.js
```

### Option 2: Claude Desktop Configuration

Update your Claude Desktop `config.json`:

```json
{
  "mcpServers": {
    "flow-nexus": {
      "command": "node",
      "args": ["/path/to/flow-nexus/fixes/clean-mcp-server.js"],
      "env": {
        "MCP_MODE": "stdio"
      }
    }
  }
}
```

### Option 3: Global Installation

```bash
# Copy to a global location
sudo cp fixes/clean-mcp-server.js /usr/local/bin/flow-nexus-clean
sudo chmod +x /usr/local/bin/flow-nexus-clean

# Use in Claude Desktop
"command": "flow-nexus-clean"
```

## 🧪 Testing Results

### Before Fix:
```bash
$ npx flow-nexus mcp
E2B Templates loaded from database: [ 'base', 'python', 'claude-code', 'react', 'nextjs', 'vanilla' ]
# ❌ Breaks JSON parser in Claude Desktop
```

### After Fix:
```bash
$ node fixes/clean-mcp-server.js
# stdout: (clean, only JSON-RPC messages)
# stderr: [NON-JSON] E2B Templates loaded from database: [ 'base', 'python', 'claude-code', 'react', 'nextjs', 'vanilla' ]
# ✅ Claude Desktop works correctly
```

## 📋 How It Works

1. **Spawns** the original Flow Nexus MCP server
2. **Filters stdout** - only JSON-RPC messages pass through
3. **Redirects non-JSON** to stderr with prefixes:
   - `[NON-JSON]` - Invalid JSON content
   - `[NON-PROTOCOL]` - Valid JSON but not JSON-RPC
4. **Forwards stdin/stderr** transparently

## 🔍 Technical Details

### Identified stdout Contamination Sources:
- `src/index.js:1457` - E2B template loading message
- `bin/flow-nexus.js` - Various debug and info messages
- Async initialization messages
- Status and configuration output

### JSON-RPC Protocol Preservation:
- Validates JSON structure with `JSON.parse()`
- Checks for JSON-RPC fields (`jsonrpc`, `method`, `result`, `error`)
- Only passes valid protocol messages to stdout

## 🎯 Impact

- **✅ Fixes Claude Desktop integration** immediately
- **✅ Preserves all MCP functionality** 
- **✅ Backward compatible** with existing tools
- **✅ No changes to core Flow Nexus** required
- **✅ Easy to deploy** and test

## 🚀 Deployment

1. **Copy the wrapper** to your desired location
2. **Update Claude Desktop config** to use the wrapper
3. **Test the connection** - should work immediately
4. **Verify MCP tools** function correctly

This fix resolves GitHub Issue #42 completely while maintaining full compatibility with Flow Nexus features.