#!/usr/bin/env node

/**
 * Clean MCP Server Wrapper for Flow Nexus Issue #42
 * 
 * This wrapper ensures that only JSON-RPC protocol messages go to stdout,
 * while all other output (logs, debug messages, etc.) goes to stderr.
 * 
 * This fixes Claude Desktop integration by maintaining clean JSON-RPC communication.
 */

import { spawn } from 'child_process';

// Start Flow Nexus MCP server 
const server = spawn('npx', ['flow-nexus', 'mcp'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, MCP_MODE: 'stdio' }
});

// Forward stdin to server
process.stdin.pipe(server.stdin);

// Filter stdout - only pass valid JSON lines
server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      try {
        // Test if it's valid JSON-RPC
        const parsed = JSON.parse(trimmed);
        if (parsed && (parsed.jsonrpc || parsed.method || parsed.result !== undefined || parsed.error !== undefined)) {
          // Valid JSON-RPC message - pass to stdout
          process.stdout.write(line + '\n');
        } else {
          // Valid JSON but not JSON-RPC protocol - redirect to stderr
          process.stderr.write('[NON-PROTOCOL] ' + line + '\n');
        }
      } catch (e) {
        // Not valid JSON - redirect to stderr
        process.stderr.write('[NON-JSON] ' + line + '\n');
      }
    }
  }
});

// Forward all stderr as-is (this is where logs should go)
server.stderr.pipe(process.stderr);

// Handle server exit
server.on('close', (code) => {
  process.exit(code || 0);
});

server.on('error', (error) => {
  console.error('MCP Server Error:', error);
  process.exit(1);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});

// Add startup message to stderr (not stdout)
console.error('🔧 Clean MCP Server Wrapper Started (Issue #42 Fix)');
console.error('   - JSON-RPC protocol: stdout');  
console.error('   - Logs and debug: stderr');
console.error('   - Ready for Claude Desktop integration');