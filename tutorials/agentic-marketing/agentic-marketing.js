#!/usr/bin/env node

/**
 * Agentic Marketing CLI
 * Updated to properly integrate with Flow Nexus MCP tools
 */

const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import our main application
const { main: startServer, AgenticMarketingServer } = require('./main');

// Version and description
program
  .version('2.0.0')
  .description('Agentic Marketing - Autonomous Media Planning & Marketing Operations Platform\n\n' +
    '  Powered by Flow Nexus MCP with modular architecture\n\n' +
    '  Quick Start:\n' +
    '    $ npx agentic-marketing init          # Initialize project\n' +
    '    $ npx agentic-marketing start         # Start with MCP integration\n\n' +
    '  Features:\n' +
    '    • Flow Nexus MCP SDK integration\n' +
    '    • Cross-platform SQLite persistence\n' +
    '    • Auto-initialize swarms and workflows\n' +
    '    • Modular, scalable architecture');

// Init command
program
  .command('init')
  .description('Initialize Agentic Marketing platform with Flow Nexus MCP integration')
  .option('-n, --name <name>', 'Project name', 'agentic-marketing-project')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('--skip-auth', 'Skip Flow Nexus authentication during init')
  .action(async (options) => {
    console.log(chalk.cyan('\n' + getAsciiLogo()));
    console.log(chalk.green('Agentic Marketing Platform v2.0 - Modular Architecture\n'));
    
    const spinner = ora('Initializing platform...').start();
    
    try {
      // Create project directory
      const projectPath = path.join(process.cwd(), options.name);
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }
      
      // Create subdirectories
      const dirs = ['src', 'config', 'data', 'logs'];
      dirs.forEach(dir => {
        const dirPath = path.join(projectPath, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      });
      
      spinner.succeed('Project directory structure created');
      
      // Copy source files
      spinner.start('Copying application files...');
      const sourceFiles = [
        { src: 'src/AgenticMarketingServer.js', dest: 'src/AgenticMarketingServer.js' },
        { src: 'src/FlowNexusSDK.js', dest: 'src/FlowNexusSDK.js' },
        { src: 'src/AuthenticationManager.js', dest: 'src/AuthenticationManager.js' },
        { src: 'src/MediaPlanningAPI.js', dest: 'src/MediaPlanningAPI.js' },
        { src: 'main.js', dest: 'main.js' },
        { src: 'schema.sql', dest: 'schema.sql' },
        { src: 'package.json', dest: 'package.json' }
      ];
      
      sourceFiles.forEach(({ src, dest }) => {
        const sourcePath = path.join(__dirname, src);
        const destPath = path.join(projectPath, dest);
        
        if (fs.existsSync(sourcePath)) {
          // Ensure destination directory exists
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          fs.copyFileSync(sourcePath, destPath);
        } else {
          console.warn(chalk.yellow(`Source file not found: ${sourcePath}`));
        }
      });
      
      // Update package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        packageJson.name = options.name;
        packageJson.version = '2.0.0';
        packageJson.main = 'main.js';
        packageJson.scripts = {
          ...packageJson.scripts,
          start: 'node main.js',
          dev: 'nodemon main.js',
          test: 'echo "No tests specified"'
        };
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }
      
      spinner.succeed('Application files copied');
      
      // Create cross-platform startup scripts
      createStartupScripts(projectPath, options.port);
      spinner.succeed('Startup scripts created');
      
      // Create config file
      const config = {
        name: options.name,
        port: parseInt(options.port),
        database: {
          path: path.join('data', 'mediaspend.db').replace(/\\/g, '/'), // Use forward slashes for cross-platform
          mode: 'WAL'
        },
        flowNexus: {
          authenticated: false,
          autoInitialize: true
        },
        logging: {
          level: 'info',
          file: path.join('logs', 'app.log').replace(/\\/g, '/')
        }
      };
      
      fs.writeFileSync(
        path.join(projectPath, 'config', 'config.json'),
        JSON.stringify(config, null, 2)
      );
      spinner.succeed('Configuration created');
      
      // Install dependencies
      spinner.start('Installing dependencies...');
      await new Promise((resolve) => {
        const npmInstall = spawn('npm', ['install'], {
          cwd: projectPath,
          shell: true,
          stdio: 'pipe'
        });
        
        npmInstall.on('close', (code) => {
          if (code === 0) {
            spinner.succeed('Dependencies installed');
          } else {
            spinner.warn('Some dependencies may not have installed correctly');
          }
          resolve();
        });
        
        npmInstall.on('error', () => {
          spinner.warn('Could not auto-install dependencies - run npm install manually');
          resolve();
        });
      });
      
      // Initialize SQLite database with cross-platform path handling
      spinner.start('Initializing cross-platform SQLite database...');
      const dbPath = path.join(projectPath, 'data', 'mediaspend.db');
      const schemaPath = path.join(projectPath, 'schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        try {
          // Use sqlite3 node module for cross-platform compatibility
          const sqlite3 = require('sqlite3').verbose();
          const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
              spinner.warn('Database will be created on first run');
            } else {
              const schema = fs.readFileSync(schemaPath, 'utf8');
              db.exec(schema, (err) => {
                if (err && !err.message.includes('already exists')) {
                  console.warn('Database schema warning:', err.message);
                }
                db.close();
                spinner.succeed('Cross-platform SQLite database initialized');
              });
            }
          });
        } catch (error) {
          spinner.warn('Database will be created on first run');
        }
      } else {
        spinner.warn('Schema file not found - database will be created on first run');
      }
      
      // Flow Nexus authentication (if not skipped)
      if (!options.skipAuth) {
        await handleFlowNexusAuth(projectPath);
      }
      
      // Success message
      console.log(chalk.green('\n✨ Agentic Marketing Platform v2.0 initialized successfully!\n'));
      console.log(chalk.white('🚀 Features:'));
      console.log(chalk.gray('   • Flow Nexus MCP SDK integration'));
      console.log(chalk.gray('   • Cross-platform SQLite persistence'));
      console.log(chalk.gray('   • Auto-initializing AI swarms'));
      console.log(chalk.gray('   • Modular, scalable architecture'));
      
      console.log(chalk.white('\n📁 Project Structure:'));
      console.log(chalk.cyan(`   ${options.name}/`));
      console.log(chalk.gray('   ├── src/                # Application modules'));
      console.log(chalk.gray('   ├── config/             # Configuration files'));
      console.log(chalk.gray('   ├── data/               # SQLite database'));
      console.log(chalk.gray('   ├── logs/               # Application logs'));
      console.log(chalk.gray('   └── main.js             # Entry point'));
      
      console.log(chalk.white('\n🎯 Next Steps:'));
      console.log(chalk.cyan(`   cd ${options.name}`));
      console.log(chalk.cyan('   npm start'));
      console.log(chalk.white(`\n   Dashboard: ${chalk.yellow(`http://localhost:${options.port}`)}`));
      
    } catch (error) {
      spinner.fail('Initialization failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Start command
program
  .command('start')
  .description('Start the Agentic Marketing server with Flow Nexus MCP integration')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-c, --config <path>', 'Config file path', './config/config.json')
  .option('--mock', 'Use mock MCP tools for development')
  .action(async (options) => {
    console.log(chalk.cyan(getAsciiLogo()));
    console.log(chalk.green('Starting Agentic Marketing Platform v2.0...\n'));
    
    // Load config if available
    let config = { port: parseInt(options.port) };
    if (fs.existsSync(options.config)) {
      try {
        config = { ...JSON.parse(fs.readFileSync(options.config, 'utf8')), port: parseInt(options.port) };
      } catch (error) {
        console.warn(chalk.yellow('Could not load config, using defaults'));
      }
    }
    
    try {
      // Check if we're in MCP-enabled environment
      let mcpTools = null;
      
      if (options.mock) {
        console.log(chalk.yellow('🧪 Using mock MCP tools for development'));
      } else {
        // In production, MCP tools would be injected by the host environment
        // For now, we'll check if they're available via global object or process
        if (global.mcpTools || process.env.MCP_TOOLS_AVAILABLE) {
          mcpTools = global.mcpTools;
          console.log(chalk.green('✅ Flow Nexus MCP tools detected'));
        } else {
          console.log(chalk.yellow('⚠️  MCP tools not detected - using simulation mode'));
        }
      }
      
      // Start server with MCP tools
      await startServer(mcpTools);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start server:'), error.message);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check server status')
  .option('-p, --port <port>', 'Server port to check', '3000')
  .action(async (options) => {
    try {
      const http = require('http');
      
      const req = http.get(`http://localhost:${options.port}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const status = JSON.parse(data);
            console.log(chalk.green('\n✅ Server Status: OPERATIONAL'));
            console.log(chalk.white(`   Port: ${options.port}`));
            console.log(chalk.white(`   Database: ${status.database}`));
            console.log(chalk.white(`   Flow Nexus: ${status.flowNexus}`));
            console.log(chalk.yellow(`   Dashboard: http://localhost:${options.port}\n`));
          } catch (error) {
            console.log(chalk.green('\n✅ Server Status: RUNNING'));
            console.log(chalk.yellow(`   Dashboard: http://localhost:${options.port}\n`));
          }
        });
      });
      
      req.on('error', () => {
        console.log(chalk.red('\n❌ Server Status: OFFLINE'));
        console.log(chalk.yellow('   Run "npx agentic-marketing start" to start the server\n'));
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        console.log(chalk.red('\n❌ Server Status: TIMEOUT'));
      });
    } catch (error) {
      console.log(chalk.red('Error checking status:', error.message));
    }
  });

// Helper functions
function getAsciiLogo() {
  return `
╔═══════════════════════════════════════════════════════════════╗
║     ╔═╗╔═╗╔═╗╔╗╔╔╦╗╦╔═╗  ╔╦╗╔═╗╦═╗╦╔═╔═╗╔╦╗╦╔╗╔╔═╗          ║
║     ╠═╣║ ╦║╣ ║║║ ║ ║║     ║║║╠═╣╠╦╝╠╩╗║╣  ║ ║║║║║ ╦          ║
║     ╩ ╩╚═╝╚═╝╝╚╝ ╩ ╩╚═╝   ╩ ╩╩ ╩╩╚═╩ ╩╚═╝ ╩ ╩╝╚╝╚═╝          ║
║                                                                ║
║     Autonomous Media Planning & Marketing Operations v2.0     ║
║     Modular Architecture • Cross-Platform • MCP Integration   ║
╚═══════════════════════════════════════════════════════════════╝`;
}

function createStartupScripts(projectPath, port) {
  // Unix/Linux/macOS start script
  const startSh = `#!/bin/bash
echo "Starting Agentic Marketing Platform v2.0..."
echo "Port: ${port}"
echo "Platform: $(uname -s)"
echo "Node: $(node --version)"
echo ""

# Set NODE_ENV if not set
export NODE_ENV=\${NODE_ENV:-production}

# Start the application
node main.js
`;
  
  const startShPath = path.join(projectPath, 'start.sh');
  fs.writeFileSync(startShPath, startSh);
  
  // Make executable on Unix-like systems
  try {
    fs.chmodSync(startShPath, '755');
  } catch (error) {
    // Ignore chmod errors on Windows
  }
  
  // Windows batch file
  const startBat = `@echo off
echo Starting Agentic Marketing Platform v2.0...
echo Port: ${port}
echo Platform: Windows
echo Node: %CD%
echo.

REM Set NODE_ENV if not set
if not defined NODE_ENV set NODE_ENV=production

REM Start the application
node main.js
pause
`;
  
  fs.writeFileSync(path.join(projectPath, 'start.bat'), startBat);
  
  // PowerShell script for Windows
  const startPs1 = `# Agentic Marketing Platform v2.0 - PowerShell Launcher
Write-Host "Starting Agentic Marketing Platform v2.0..." -ForegroundColor Cyan
Write-Host "Port: ${port}" -ForegroundColor White
Write-Host "Platform: Windows PowerShell" -ForegroundColor White
Write-Host "Node: $(node --version)" -ForegroundColor White
Write-Host ""

# Set NODE_ENV if not set
if (-not $env:NODE_ENV) {
    $env:NODE_ENV = "production"
}

# Start the application
node main.js
`;
  
  fs.writeFileSync(path.join(projectPath, 'start.ps1'), startPs1);
}

async function handleFlowNexusAuth(projectPath) {
  console.log(chalk.cyan('\n🔐 Flow Nexus Authentication Setup\n'));
  
  try {
    const { authAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'authAction',
        message: 'Flow Nexus authentication:',
        choices: [
          { name: 'Login with existing account', value: 'login' },
          { name: 'Register new account (256 free credits)', value: 'register' },
          { name: 'Configure later', value: 'skip' }
        ]
      }
    ]);
    
    if (authAction === 'skip') {
      console.log(chalk.yellow('Authentication skipped - you can login via the dashboard'));
      return;
    }
    
    const { email, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(input) || 'Please enter a valid email';
        }
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*'
      }
    ]);
    
    // Save credentials for server startup
    const credentials = {
      email,
      password,
      action: authAction,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(projectPath, '.flow-nexus-credentials.json'),
      JSON.stringify(credentials, null, 2)
    );
    
    console.log(chalk.green(`✅ Credentials saved for ${authAction}`));
    console.log(chalk.white('Server will authenticate automatically on startup'));
    
  } catch (error) {
    console.log(chalk.yellow('Authentication setup skipped'));
  }
}

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}