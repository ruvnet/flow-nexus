#!/usr/bin/env node

/**
 * Fix for GitHub Issue #42: MCP Server stdout/stderr Problem
 * 
 * Problem: Flow Nexus MCP server outputs non-JSON text to stdout,
 * breaking Claude Desktop integration by corrupting JSON-RPC protocol.
 * 
 * Solution: Redirect all non-protocol messages to stderr, keeping
 * stdout exclusively for JSON-RPC communication.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing Flow Nexus Issue #42: MCP stdout/stderr Problem\n');

// Fix patterns to apply
const fixes = [
  {
    file: 'bin/flow-nexus.js',
    patterns: [
      // Fix help output - should go to stderr when MCP mode
      {
        search: /console\.log\(`\n\s*Flow Nexus MCP Server/g,
        replace: 'console.error(`\\nFlow Nexus MCP Server',
        description: 'Redirect MCP help to stderr'
      },
      // Fix debug logs - should go to stderr
      {
        search: /console\.log\('\[DEBUG\]/g,
        replace: 'console.error(\\'[DEBUG]',
        description: 'Redirect debug logs to stderr'
      },
      // Fix MCP testing output
      {
        search: /console\.log\('Testing MCP server\.\.\.'\);/g,
        replace: 'console.error(\\'Testing MCP server...\\');',
        description: 'Redirect MCP test output to stderr'
      },
      // Fix success messages during MCP mode
      {
        search: /console\.log\('✅ MCP server is working correctly'\);/g,
        replace: 'console.error(\\'✅ MCP server is working correctly\\');',
        description: 'Redirect success messages to stderr'
      },
      // Fix version output when not in MCP mode
      {
        search: /console\.log\(`Flow Nexus v\$\{VERSION\}`\);/g,
        replace: `
        // Only output to stdout if not in MCP mode
        if (!args.includes('mcp')) {
          console.log(\`Flow Nexus v\${VERSION}\`);
        } else {
          console.error(\`Flow Nexus v\${VERSION}\`);
        }
        `,
        description: 'Conditional version output based on MCP mode'
      }
    ]
  },
  {
    file: 'src/index.js', 
    patterns: [
      // Fix the E2B template loading message (main culprit)
      {
        search: /console\.log\('E2B Templates loaded from database:', this\.availableTemplates\);/g,
        replace: 'console.error(\\'E2B Templates loaded from database:\\', this.availableTemplates);',
        description: 'Fix E2B template loading message - redirect to stderr'
      },
      // Fix other console.log instances in server
      {
        search: /console\.log\('E2B upload failed, falling back to Supabase:', e2bError\.message\);/g,
        replace: 'console.error(\\'E2B upload failed, falling back to Supabase:\\', e2bError.message);',
        description: 'Fix E2B fallback message'
      },
      {
        search: /console\.log\('Sandbox event:', payload\);/g,
        replace: 'console.error(\\'Sandbox event:\\', payload);',
        description: 'Fix sandbox event logging'
      },
      {
        search: /console\.log\('Realtime event:', payload\);/g,
        replace: 'console.error(\\'Realtime event:\\', payload);',
        description: 'Fix realtime event logging'
      },
      // Fix any help text output
      {
        search: /console\.log\(`[^`]*MCP[^`]*`\);$/gm,
        replace: (match) => match.replace('console.log', 'console.error'),
        description: 'Fix MCP-related help text'
      }
    ]
  }
];

// Create an MCP-aware console wrapper
const mcpConsoleWrapper = `
/**
 * MCP-aware console wrapper
 * Automatically redirects output based on MCP mode
 */
class MCPConsole {
  constructor() {
    this.isMCPMode = process.argv.includes('mcp') || process.env.MCP_MODE === 'stdio';
  }
  
  log(...args) {
    if (this.isMCPMode) {
      // In MCP mode, all non-protocol output goes to stderr
      console.error('[STDOUT]', ...args);
    } else {
      // Normal mode, use stdout
      console.log(...args);
    }
  }
  
  error(...args) {
    console.error(...args);
  }
  
  warn(...args) {
    console.error('[WARN]', ...args);
  }
  
  info(...args) {
    if (this.isMCPMode) {
      console.error('[INFO]', ...args);
    } else {
      console.log('[INFO]', ...args);
    }
  }
  
  debug(...args) {
    console.error('[DEBUG]', ...args);
  }
}

const mcpConsole = new MCPConsole();

// Override global console in MCP mode
if (process.argv.includes('mcp') || process.env.MCP_MODE === 'stdio') {
  global.console = {
    ...console,
    log: mcpConsole.log.bind(mcpConsole),
    info: mcpConsole.info.bind(mcpConsole),
    warn: mcpConsole.warn.bind(mcpConsole)
  };
}
`;

// MCP server wrapper script
const mcpWrapperScript = `#!/usr/bin/env node

/**
 * MCP Server Wrapper - Ensures clean stdout for JSON-RPC
 * This wrapper filters all non-JSON output to stderr
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, 'src', 'index.js');

// Start the server with stderr redirection
const server = spawn('node', [serverPath, ...process.argv.slice(2)], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, MCP_MODE: 'stdio' }
});

// Forward stdin to server
process.stdin.pipe(server.stdin);

// Filter stdout - only pass JSON lines
server.stdout.on('data', (data) => {
  const lines = data.toString().split('\\n');
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        // Test if it's valid JSON
        JSON.parse(line.trim());
        // If valid JSON, pass to stdout
        process.stdout.write(line + '\\n');
      } catch (e) {
        // If not JSON, redirect to stderr
        process.stderr.write('[NON-JSON] ' + line + '\\n');
      }
    }
  }
});

// Forward stderr as-is
server.stderr.pipe(process.stderr);

// Handle server exit
server.on('close', (code) => {
  process.exit(code || 0);
});

server.on('error', (error) => {
  console.error('MCP Server Error:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});
`;

// Create fix script that patches the files
async function applyFixes() {
  const baseDir = process.cwd();
  const tempDir = path.join(baseDir, 'temp-flow-nexus-fixes');
  
  console.log('📁 Creating temporary fix directory...');
  await fs.mkdir(tempDir, { recursive: true });
  
  console.log('✏️  Creating MCP console wrapper...');
  await fs.writeFile(
    path.join(tempDir, 'mcp-console-wrapper.js'),
    mcpConsoleWrapper
  );
  
  console.log('🔧 Creating MCP server wrapper...');
  await fs.writeFile(
    path.join(tempDir, 'mcp-server-wrapper.js'),
    mcpWrapperScript
  );
  
  // Create patch files for the identified issues
  for (const fix of fixes) {
    console.log(\`📝 Creating patch for \${fix.file}...\`);
    
    const patchInstructions = fix.patterns.map(pattern => ({
      description: pattern.description,
      search: pattern.search.toString(),
      replace: pattern.replace.toString ? pattern.replace.toString() : pattern.replace
    }));
    
    const patchFile = {
      file: fix.file,
      patches: patchInstructions
    };
    
    await fs.writeFile(
      path.join(tempDir, \`patch-\${fix.file.replace('/', '-')}.json\`),
      JSON.stringify(patchFile, null, 2)
    );
  }
  
  // Create deployment script
  const deployScript = \`#!/bin/bash

# Flow Nexus Issue #42 Fix Deployment Script
# This script applies the stdout/stderr fixes to Flow Nexus

echo "🔧 Deploying Flow Nexus Issue #42 fixes..."

# Method 1: Global package fix (if you have access)
if [[ -d node_modules/flow-nexus ]]; then
  echo "📦 Found local Flow Nexus installation"
  
  # Apply MCP wrapper
  cp mcp-server-wrapper.js node_modules/flow-nexus/bin/mcp-clean.js
  chmod +x node_modules/flow-nexus/bin/mcp-clean.js
  
  echo "✅ Clean MCP server available at: npx flow-nexus/bin/mcp-clean.js"
fi

# Method 2: Create a clean wrapper script
cat > clean-mcp-server.js << 'EOF'
\${mcpWrapperScript}
EOF

chmod +x clean-mcp-server.js

echo ""
echo "✅ Fix deployment complete!"
echo ""
echo "🚀 Usage options:"
echo "   1. Use clean wrapper: node clean-mcp-server.js"
echo "   2. Configure Claude Desktop with this wrapper"
echo "   3. Test with: echo '{"method":"tools/list"}' | node clean-mcp-server.js"
echo ""
echo "📋 Claude Desktop config:"
echo '   "flow-nexus": {'
echo '     "command": "node",'
echo '     "args": ["clean-mcp-server.js"],'
echo '     "env": { "MCP_MODE": "stdio" }'
echo '   }'
echo ""
\`;
  
  await fs.writeFile(
    path.join(tempDir, 'deploy.sh'),
    deployScript
  );
  
  await fs.chmod(path.join(tempDir, 'deploy.sh'), 0o755);
  
  console.log('\\n✅ Fix files created successfully!');
  console.log(\`📁 Location: \${tempDir}\`);
  console.log('');
  console.log('🚀 To deploy fixes:');
  console.log(\`   cd \${tempDir}\`);
  console.log('   ./deploy.sh');
  console.log('');
  console.log('🧪 To test the fix:');
  console.log('   node clean-mcp-server.js');
  console.log('   # Should have clean stdout, all debug messages go to stderr');
}

// Run the fix creation
applyFixes().catch(console.error);