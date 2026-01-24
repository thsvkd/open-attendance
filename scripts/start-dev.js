#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Start dev/prod server with proper PORT environment variable
 * This script reads .env.local, sets PORT and NEXTAUTH_URL,
 * then spawns the next dev/start command with those variables
 */

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};

  // Parse environment variables
  envContent.split('\n').forEach((line) => {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line.trim()) return;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      let value = match[2].trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envVars[match[1]] = value;
    }
  });

  return envVars;
}

function updateNextAuthUrl(envVars) {
  // Check for --port command line argument first (used by playwright for E2E tests)
  let port = '3000';
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && portArgIndex + 1 < process.argv.length) {
    port = process.argv[portArgIndex + 1];
  } else {
    // Fall back to environment variable or .env file
    port = process.env.PORT || envVars.PORT || '3000';
  }

  // Update NEXTAUTH_URL to use the same port
  envVars.NEXTAUTH_URL = `http://localhost:${port}`;
  envVars.PORT = port;

  return envVars;
}

// Main execution
const envVars = loadEnvFile();
const updatedVars = updateNextAuthUrl(envVars);

console.log(`✓ Environment variables prepared`);
console.log(`  PORT: ${updatedVars.PORT}`);
console.log(`  NEXTAUTH_URL: ${updatedVars.NEXTAUTH_URL}`);

// Determine if production mode
const isProd = process.argv.includes('--prod');

// Merge with current process.env for inherited variables
const fullEnv = {
  ...process.env,
  ...updatedVars,
};

// Run init-db.js first
console.log('\nInitializing database...');
const initDbProcess = spawn('node', ['scripts/init-db.js'], {
  cwd: path.join(__dirname, '..'),
  env: fullEnv,
  stdio: 'inherit',
});

initDbProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Database initialization failed with code ${code}`);
    process.exit(code);
  }

  // Run next dev or next start
  const nextCommand = isProd ? 'start' : 'dev';
  const nextProcess = spawn('next', [nextCommand], {
    cwd: path.join(__dirname, '..'),
    env: fullEnv,
    stdio: 'inherit',
  });

  // Handle signals
  process.on('SIGINT', () => {
    nextProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    nextProcess.kill('SIGTERM');
  });

  nextProcess.on('close', (code) => {
    process.exit(code);
  });
});
