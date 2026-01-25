#!/usr/bin/env node

/**
 * Database initialization script
 * 
 * Usage:
 *   node scripts/init-db.js          - Initialize development/production database
 *   node scripts/init-db.js --test   - Initialize test database for E2E tests
 * 
 * This script MUST remain as JavaScript because:
 * - Complex logic for parsing DATABASE_URL and checking database state
 * - Needs to interact with SQLite and Prisma programmatically
 * - Environment variable handling and dynamic path resolution
 * - Cross-platform compatibility (Windows, macOS, Linux)
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Parse command line arguments
const isTestMode = process.argv.includes("--test");

// Load environment variables from .env.local or .env file
function loadEnvFile() {
  // Try .env.local first, then .env
  let envPath = path.join(__dirname, "..", ".env.local");

  if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, "..", ".env");
  }

  if (!fs.existsSync(envPath)) {
    // If no env file found, return empty object (rely on process.env)
    console.log(
      "No .env.local or .env file found, using environment variables.",
    );
    return {};
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars = {};

  // Parse environment variables
  envContent.split("\n").forEach((line) => {
    // Skip comments and empty lines
    if (line.startsWith("#") || !line.trim()) return;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      let value = match[2].trim();
      // Remove surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
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
  const port = process.env.PORT || envVars.PORT || "3000";

  // Update NEXTAUTH_URL to use the same port
  envVars.NEXTAUTH_URL = `http://localhost:${port}`;

  return envVars;
}

// Parse DATABASE_URL from .env file to get relative path
function getDatabasePath(envVars) {
  const databaseUrl = envVars.DATABASE_URL;

  if (!databaseUrl) {
    console.error("Error: DATABASE_URL not found in .env file");
    process.exit(1);
  }

  const match = databaseUrl.match(/file:\.\/(.+?)$/);
  if (!match) {
    console.error(
      "Error: DATABASE_URL format not recognized. Expected file:./path",
    );
    process.exit(1);
  }

  // DATABASE_URL is relative to prisma/ directory, so we need to join with prisma/
  return path.join(__dirname, "..", "prisma", match[1]);
}

// Test mode: Initialize test database with empty schema
function initTestDatabase() {
  const testDbPath = path.join(__dirname, "..", "prisma", "test.db");
  
  console.log("Initializing test database for E2E tests...");
  
  // Remove existing test.db
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log("Removed existing test.db");
  }
  
  // Define schema SQL
  const schemaSQL = `
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "joinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalLeaves" REAL NOT NULL DEFAULT 15,
    "usedLeaves" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "checkIn" DATETIME,
    "checkOut" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ANNUAL',
    "leaveType" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "days" REAL NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "rejectedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_userId_date_key" ON "Attendance"("userId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "Holiday_date_key" ON "Holiday"("date");
`;
  
  try {
    // Create database with schema using sqlite3
    execSync(`sqlite3 "${testDbPath}"`, {
      input: schemaSQL,
      cwd: path.join(__dirname, ".."),
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log("test.db initialized with empty schema.");
  } catch (error) {
    console.error("Error initializing test database:", error.message);
    process.exit(1);
  }
}

// If in test mode, initialize test database and exit
if (isTestMode) {
  initTestDatabase();
  process.exit(0);
}

// Development/Production mode: Initialize database with Prisma
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
      { encoding: "utf-8", cwd: path.join(__dirname, "..") },
    );
    return result.trim() === "User";
  } catch (error) {
    return false;
  }
}

// Initialize database if needed
if (!hasRequiredTables()) {
  console.log(
    "Database not found or schema not initialized. Initializing database...",
  );
  try {
    // Create database file if it doesn't exist
    if (!fs.existsSync(dbPath)) {
      execSync(`sqlite3 "${dbPath}" "VACUUM;"`, {
        cwd: path.join(__dirname, ".."),
      });
    }

    // Push schema to database (with environment variables)
    execSync("npm exec prisma db push", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, ...envVars },
    });

    // Generate Prisma Client (with environment variables)
    execSync("npm exec prisma generate", {
      stdio: "pipe",
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, ...envVars },
    });

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error.message);
    process.exit(1);
  }
} else {
  console.log("Database already exists. Skipping initialization.");
}
