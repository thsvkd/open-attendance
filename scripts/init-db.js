#!/usr/bin/env node

/**
 * Database initialization script
 *
 * Usage:
 *   node scripts/init-db.js          - Initialize development/production database
 *   node scripts/init-db.js --test   - Initialize test database for E2E tests
 *
 * Why plain JS:
 * - Runs before any TS tooling is ready
 * - Handles env loading + Prisma CLI orchestration
 * - Needs to work in sandboxed CI/dev shells
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Parse command line arguments
const isTestMode = process.argv.includes("--test");

// Load environment variables from .env.local or .env file
function loadEnvFile() {
  let envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, "..", ".env");
  }

  if (!fs.existsSync(envPath)) {
    console.log(
      "No .env.local or .env file found, using environment variables.",
    );
    return {};
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    if (line.startsWith("#") || !line.trim()) return;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) {
      let value = match[2].trim();
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
  const port = process.env.PORT || envVars.PORT || "3000";
  envVars.NEXTAUTH_URL = `http://localhost:${port}`;
  envVars.PORT = port;
  return envVars;
}

// Run prisma db push + generate with provided env
function syncDatabase(envVars, { skipGenerate = false } = {}) {
  const env = { ...process.env, ...envVars };

  execSync("npm exec prisma db push", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
    env,
  });

  if (!skipGenerate) {
    execSync("npm exec prisma generate", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
      env,
    });
  }
}

// === Test mode (used by Playwright E2E) ===
if (isTestMode) {
  console.log("Initializing test database for E2E tests...");
  const envVars = { DATABASE_URL: "file:./test.db" };

  // Always start E2E with a clean SQLite file to avoid leftover users.
  // Prisma resolves file:./ paths relative to prisma/schema.prisma.
  const testDbPaths = [
    path.join(__dirname, "..", "prisma", "test.db"),
    path.join(__dirname, "..", "test.db"), // best-effort if path resolution changes
  ];

  for (const dbPath of testDbPaths) {
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      const journalPath = `${dbPath}-journal`;
      if (fs.existsSync(journalPath)) fs.unlinkSync(journalPath);
      // Ensure file exists so SQLite engine doesn't choke on missing path
      fs.writeFileSync(dbPath, "");
    } catch (cleanupError) {
      console.warn("Warning: failed to clean existing test DB:", cleanupError);
    }
  }

  try {
    syncDatabase(envVars, { skipGenerate: false });
    console.log("test.db initialized with Prisma schema.");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing test database:", error.message);
    process.exit(1);
  }
}

// === Dev/Prod mode ===
let envVars = loadEnvFile();
if (process.env.DATABASE_URL) {
  envVars.DATABASE_URL = process.env.DATABASE_URL;
}
envVars = applyDynamicEnvVars(envVars);

try {
  syncDatabase(envVars, { skipGenerate: false });
  console.log("Database initialized successfully!");
} catch (error) {
  console.error("Error initializing database:", error.message);
  process.exit(1);
}
