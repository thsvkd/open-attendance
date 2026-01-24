#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local or .env file
function loadEnvFile() {
  // Try .env.local first, then .env
  let envPath = path.join(__dirname, '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, '..', '.env');
  }

  if (!fs.existsSync(envPath)) {
    // If no env file found, return empty object (rely on process.env)
    console.log('No .env.local or .env file found, using environment variables.');
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};

  // Parse environment variables
  envContent.split('\n').forEach(line => {
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

// Update NEXTAUTH_URL based on PORT
function applyDynamicEnvVars(envVars) {
  // Get PORT from environment variable or .env file
  const port = process.env.PORT || envVars.PORT || '3000';

  // Update NEXTAUTH_URL to use the same port
  envVars.NEXTAUTH_URL = `http://localhost:${port}`;

  return envVars;
}

// Parse DATABASE_URL from .env file to get relative path
function getDatabasePath(envVars) {
  const databaseUrl = envVars.DATABASE_URL;

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL not found in .env file');
    process.exit(1);
  }

  const match = databaseUrl.match(/file:\.\/(.+?)$/);
  if (!match) {
    console.error('Error: DATABASE_URL format not recognized. Expected file:./path');
    process.exit(1);
  }

  // DATABASE_URL is relative to prisma/ directory, so we need to join with prisma/
  return path.join(__dirname, '..', 'prisma', match[1]);
}

// Check if database exists and has the correct schema
let envVars = loadEnvFile();

// Environment variables take precedence over .env file values
if (process.env.DATABASE_URL) {
  envVars.DATABASE_URL = process.env.DATABASE_URL;
}

envVars = applyDynamicEnvVars(envVars);
const dbPath = getDatabasePath(envVars);

// Function to check if database has required tables
function hasRequiredTables() {
  if (!fs.existsSync(dbPath)) {
    return false;
  }

  try {
    // Check if User table exists (core table in our schema)
    const result = execSync(
      `sqlite3 "${dbPath}" "SELECT name FROM sqlite_master WHERE type='table' AND name='User';"`,
      { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
    );
    return result.trim() === 'User';
  } catch (error) {
    return false;
  }
}

// Initialize database if needed
if (!hasRequiredTables()) {
  console.log('Database not found or schema not initialized. Initializing database...');
  try {
    // Create database file if it doesn't exist
    if (!fs.existsSync(dbPath)) {
      execSync(`sqlite3 "${dbPath}" "VACUUM;"`, {
        cwd: path.join(__dirname, '..')
      });
    }

    // Push schema to database (with environment variables)
    execSync('npm exec prisma db push', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ...envVars }
    });

    // Generate Prisma Client (with environment variables)
    execSync('npm exec prisma generate', {
      stdio: 'pipe',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ...envVars }
    });

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
} else {
  console.log('Database already exists. Skipping initialization.');
}
