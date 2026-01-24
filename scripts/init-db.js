#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse DATABASE_URL from .env file to get relative path
function getDatabasePath() {
  // Try .env.local first, then .env
  let envPath = path.join(__dirname, '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, '..', '.env');
  }

  if (!fs.existsSync(envPath)) {
    console.error('Error: .env or .env.local file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/DATABASE_URL="file:\.\/(.+?)"/);

  if (!match) {
    console.error('Error: DATABASE_URL not found in .env file');
    process.exit(1);
  }

  // DATABASE_URL is relative to prisma/ directory, so we need to join with prisma/
  return path.join(__dirname, '..', 'prisma', match[1]);
}

// Check if database exists
const dbPath = getDatabasePath();

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.log('Database not found. Initializing database...');
  try {
    // Create database using sqlite3
    execSync(`sqlite3 "${dbPath}" "VACUUM;"`, {
      cwd: path.join(__dirname, '..')
    });

    // Push schema to database
    execSync('npx prisma db push', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    // Generate Prisma Client
    execSync('npx prisma generate', {
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
} else {
  console.log('Database already exists. Skipping initialization.');
}
