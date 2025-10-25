const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const params = {};

// Parse key=value arguments
args.forEach(arg => {
  if (arg.includes('=')) {
    const [key, value] = arg.split('=');
    params[key] = value;
  }
});

// Default configuration
const config = {
  noApi: params.noapi === 'true' || params.noapi === true,
  host: params.host || '0.0.0.0',
  port: params.port || '4200'
};

console.log('🚀 Starting application with:');
console.log(`   - No API Mode: ${config.noApi}`);
console.log(`   - Host: ${config.host}`);
console.log(`   - Port: ${config.port}`);

// Create runtime configuration file
const runtimeConfig = {
  noApi: config.noApi,
  timestamp: new Date().toISOString()
};

const runtimeConfigPath = path.join(__dirname, 'src/assets/runtime-config.json');

// Ensure assets directory exists
const assetsDir = path.dirname(runtimeConfigPath);
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Write runtime configuration
try {
  fs.writeFileSync(runtimeConfigPath, JSON.stringify(runtimeConfig, null, 2));
  console.log('✅ Runtime config written to: src/assets/runtime-config.json');
  
  if (config.noApi) {
    console.log('🚫 No-API mode enabled - using mock data');
  }
} catch (error) {
  console.error('❌ Failed to write runtime config:', error);
  process.exit(1);
}

// Build Angular serve command
let ngCommand = `ng serve --host ${config.host} --port ${config.port}`;

// Add configuration based on mode
if (config.noApi) {
  ngCommand += ' --configuration development';
  console.log('📦 Running: ' + ngCommand);
} else {
  console.log('📦 Running: ' + ngCommand);
}

// Execute Angular CLI command
const child = exec(ngCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error starting Angular application:', error);
    return;
  }
  if (stderr) {
    console.error('⚠️ Angular CLI stderr:', stderr);
  }
});

// Forward output from Angular CLI
child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping application...');
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating application...');
  child.kill('SIGTERM');
  process.exit(0);
});