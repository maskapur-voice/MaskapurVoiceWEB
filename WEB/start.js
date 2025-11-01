const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const noApiMode = args.some(arg => arg.includes('noapi=true')) || args.includes('noapi');

console.log('🚀 Starting Maskapur Voice Application...');
console.log(`📝 No-API Mode: ${noApiMode ? 'ENABLED' : 'DISABLED'}`);

// Create runtime config
const runtimeConfig = {
  noApi: noApiMode,
  timestamp: new Date().toISOString()
};

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'src', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Write runtime config
const configPath = path.join(assetsDir, 'runtime-config.json');
fs.writeFileSync(configPath, JSON.stringify(runtimeConfig, null, 2));

console.log(`✅ Runtime config written to: ${configPath}`);
console.log(`📄 Config: ${JSON.stringify(runtimeConfig, null, 2)}`);

// Start Angular dev server
console.log('🔄 Starting Angular development server...');

const ngServe = spawn('ng', ['serve', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

ngServe.on('error', (error) => {
  console.error('❌ Failed to start Angular dev server:', error.message);
  process.exit(1);
});

ngServe.on('close', (code) => {
  console.log(`🛑 Angular dev server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  ngServe.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  ngServe.kill('SIGTERM');
  process.exit(0);
});