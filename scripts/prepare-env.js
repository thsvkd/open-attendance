#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Prepare environment variables with dynamic NEXTAUTH_URL based on PORT
 * This script reads .env.local and ensures NEXTAUTH_URL matches the PORT
 * Exports variables to shell environment file for VSCode debugging
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
  // Get PORT from environment variable or .env file
  const port = process.env.PORT || envVars.PORT || '3000';

  // Update NEXTAUTH_URL to use the same port
  envVars.NEXTAUTH_URL = `http://localhost:${port}`;
  envVars.PORT = port;

  return envVars;
}

function exportEnvVars(envVars) {
  // Export all environment variables to process.env
  Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

function saveEnvToShell(envVars) {
  // Save environment variables to a file that can be sourced
  const tmpDir = path.join(os.tmpdir(), 'vscode-debug');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const envFile = path.join(tmpDir, 'env.sh');
  const content = Object.entries(envVars)
    .map(([key, value]) => `export ${key}="${value}"`)
    .join('\n');

  fs.writeFileSync(envFile, content);
  console.log(`✓ Environment saved to ${envFile}`);
}

// Main execution
const envVars = loadEnvFile();
const updatedVars = updateNextAuthUrl(envVars);
exportEnvVars(updatedVars);

// If PORT was provided as command line argument, use it
if (process.argv[2]) {
  process.env.PORT = process.argv[2];
  process.env.NEXTAUTH_URL = `http://localhost:${process.argv[2]}`;
  updatedVars.PORT = process.argv[2];
  updatedVars.NEXTAUTH_URL = `http://localhost:${process.argv[2]}`;
}

// Save to shell environment file for VSCode
saveEnvToShell(updatedVars);

// Print summary if NODE_ENV is not production
if (process.env.NODE_ENV !== 'production') {
  console.log(`✓ Environment variables prepared`);
  console.log(`  PORT: ${process.env.PORT}`);
  console.log(`  NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
}
