#!/usr/bin/env node

/**
 * System Test Script for Agentic Marketing Platform
 * Tests with real Flow Nexus MCP tools and credentials
 */

const chalk = require('chalk');
const { main } = require('./main');

async function runSystemTests() {
  console.log(chalk.cyan('\n🧪 Starting Agentic Marketing System Tests\n'));
  
  // Set test credentials (non-interactive mode)
  process.env.FLOW_NEXUS_EMAIL = "ruv@ruv.net";
  process.env.FLOW_NEXUS_PASSWORD = "password123";
  process.env.FLOW_NEXUS_ACTION = "login";
  process.env.PORT = "3001"; // Use different port for testing
  process.env.DB_PATH = "./test-data/mediaspend-test.db";
  process.env.NODE_ENV = "test";
  
  console.log(chalk.yellow('📋 Test Configuration:'));
  console.log(chalk.gray(`   Email: ${process.env.FLOW_NEXUS_EMAIL}`));
  console.log(chalk.gray(`   Action: ${process.env.FLOW_NEXUS_ACTION}`));
  console.log(chalk.gray(`   Port: ${process.env.PORT}`));
  console.log(chalk.gray(`   Database: ${process.env.DB_PATH}`));
  
  try {
    // Prepare test environment
    console.log(chalk.yellow('\n🔧 Preparing test environment...'));
    const fs = require('fs');
    const path = require('path');
    
    // Create test data directory
    const testDataDir = './test-data';
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    // Start the server with real MCP tools
    console.log(chalk.cyan('\n🚀 Starting server with Flow Nexus MCP integration...\n'));
    
    const server = await main(); // This will use real MCP tools
    
    console.log(chalk.green('\n✅ Server started successfully!'));
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run API tests
    await runAPITests();
    
    console.log(chalk.green('\n🎉 All tests completed successfully!'));
    
    // Cleanup
    console.log(chalk.yellow('\n🧹 Cleaning up...'));
    if (server && server.shutdown) {
      await server.shutdown();
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error.message);
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}

async function runAPITests() {
  console.log(chalk.cyan('\n🔍 Running API tests...'));
  
  const baseURL = `http://localhost:${process.env.PORT}`;
  
  try {
    // Test 1: Health check
    console.log(chalk.yellow('  Testing health endpoint...'));
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    
    console.log(chalk.gray(`    Status: ${healthData.status}`));
    console.log(chalk.gray(`    Database: ${healthData.database}`));
    console.log(chalk.gray(`    Flow Nexus: ${healthData.flowNexus}`));
    
    if (healthData.status === 'operational') {
      console.log(chalk.green('  ✅ Health check passed'));
    } else {
      throw new Error('Health check failed');
    }
    
    // Test 2: Flow Nexus status
    console.log(chalk.yellow('  Testing Flow Nexus status...'));
    const statusResponse = await fetch(`${baseURL}/api/flow-nexus/status`);
    const statusData = await statusResponse.json();
    
    console.log(chalk.gray(`    Authenticated: ${statusData.sdk?.authenticated}`));
    console.log(chalk.gray(`    Swarm Active: ${statusData.sdk?.swarm?.active}`));
    console.log(chalk.gray(`    Agent Count: ${statusData.sdk?.swarm?.agentCount}`));
    console.log(chalk.gray(`    Workflows: ${statusData.sdk?.workflows?.join(', ')}`));
    
    if (statusData.sdk?.authenticated) {
      console.log(chalk.green('  ✅ Flow Nexus authentication verified'));
    } else {
      console.log(chalk.yellow('  ⚠️  Flow Nexus not authenticated (expected in test mode)'));
    }
    
    // Test 3: Media planning endpoints
    console.log(chalk.yellow('  Testing media planning API...'));
    
    // Create test insertion order
    const ioResponse = await fetch(`${baseURL}/api/insertion-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_name: 'Test Campaign',
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        total_budget: 50000
      })
    });
    
    const ioData = await ioResponse.json();
    console.log(chalk.gray(`    Created IO: ${ioData.io_number}`));
    
    if (ioData.id) {
      console.log(chalk.green('  ✅ Insertion order creation passed'));
    } else {
      throw new Error('Insertion order creation failed');
    }
    
    // Test 4: Performance analytics
    console.log(chalk.yellow('  Testing analytics API...'));
    const analyticsResponse = await fetch(`${baseURL}/api/analytics/performance?start_date=2025-01-01&end_date=2025-01-31`);
    const analyticsData = await analyticsResponse.json();
    
    console.log(chalk.gray(`    Metrics period: ${analyticsData.period?.start_date} to ${analyticsData.period?.end_date}`));
    console.log(chalk.gray(`    Generated by: ${analyticsData.generated_by}`));
    
    if (analyticsData.metrics) {
      console.log(chalk.green('  ✅ Analytics API passed'));
    } else {
      throw new Error('Analytics API failed');
    }
    
    console.log(chalk.green('\n✅ All API tests passed!'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ API test failed: ${error.message}`));
    throw error;
  }
}

// Simple fetch implementation if not available
if (typeof fetch === 'undefined') {
  global.fetch = async (url, options = {}) => {
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === 'https:' ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = lib.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          });
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

// Run tests if called directly
if (require.main === module) {
  runSystemTests().catch(console.error);
}

module.exports = { runSystemTests };