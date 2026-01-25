# Scripts Directory

This directory contains utility scripts for setting up, running, and testing the open-attendance application.

## Shell Scripts

### utils.sh

Shared utility functions used by other scripts. Contains:

- Color definitions for terminal output
- Print functions (success, error, warning, info)
- Common utility functions (NVM loading, environment checks, etc.)

**Do not run directly** - this file is sourced by other scripts.

### setup.sh

Sets up the development or production environment.

**Usage:**

```bash
./scripts/setup.sh           # Development setup (npm install)
./scripts/setup.sh --dev     # Development setup (npm install)
./scripts/setup.sh --prod    # Production setup (npm ci)
./scripts/setup.sh --help    # Show help
```

**What it does:**

- Creates `.env.local` from `.env.local.example`
- Generates random NEXTAUTH_SECRET
- Installs dependencies (npm install or npm ci)
- Sets up Git hooks with Husky
- Generates Prisma Client
- Runs database migrations

### run.sh

Starts the development or production server. **Automatically runs setup if needed.**

**Usage:**

```bash
./scripts/run.sh                    # Development mode (default)
./scripts/run.sh --dev              # Development mode (explicit)
./scripts/run.sh --prod             # Production mode
./scripts/run.sh --port 3001        # Custom port
./scripts/run.sh --prod --port 8080 # Production with custom port
./scripts/run.sh --help             # Show help
```

**What it does:**

- Automatically runs `setup.sh` if `.env.local` or `node_modules` is missing
- Uses the appropriate setup mode (`--dev` or `--prod`) based on run mode
- Ensures dependencies are up to date
- Starts the Next.js development or production server

### test.sh

Runs unit tests, E2E tests, or both.

**Usage:**

```bash
./scripts/test.sh           # Run all tests
./scripts/test.sh all       # Run all tests
./scripts/test.sh unit      # Run unit/integration tests only
./scripts/test.sh e2e       # Run E2E tests only
./scripts/test.sh watch     # Run unit tests in watch mode
```

**What it does:**

- Ensures dependencies are installed with `npm ci`
- Sets up test environment variables
- Runs specified test suite(s)

### init-test-db.sh

Initializes a clean test database for E2E tests.

**Usage:**

```bash
./scripts/init-test-db.sh
```

**What it does:**

- Removes existing `prisma/test.db` if present
- Creates a new SQLite database with the application schema
- Used by Playwright before starting the test server

## JavaScript/TypeScript Scripts

### init-db.js

Database initialization script with smart detection.

**Why JavaScript:**

- Complex logic for parsing DATABASE_URL
- Needs to check database state programmatically
- Cross-platform compatibility
- Dynamic environment variable handling

**Usage:**

```bash
npm run db:init
# or
node scripts/init-db.js
```

### start-dev.js

Advanced server startup script with environment management.

**Why JavaScript:**

- Spawns Next.js server process with proper environment
- Handles output filtering for cleaner logs
- Integrates with init-db.js
- Complex signal handling for graceful shutdown
- Cross-platform process management

**Usage:**

```bash
npm run dev      # Development mode
npm start        # Production mode
```

### seed-test-db.ts

Seeds the test database with initial test data.

**Why TypeScript:**

- Uses Prisma Client for type-safe database operations
- Requires bcryptjs for password hashing
- TypeScript provides type safety for database models

**Usage:**

```bash
npx tsx scripts/seed-test-db.ts
```

## Architecture Decision

The scripts directory follows a hybrid approach:

- **Shell scripts** - For orchestration, environment setup, and simple tasks
- **JavaScript/TypeScript** - For complex logic that benefits from:
  - Node.js ecosystem libraries (Prisma, bcrypt)
  - Type safety (TypeScript)
  - Cross-platform compatibility
  - Complex process management

This approach maximizes code reusability while keeping the codebase maintainable.

## Development Workflow

1. **First Time Setup (Optional):**

   ```bash
   ./scripts/setup.sh
   ```

   Note: `run.sh` will automatically call setup if needed, so this is optional.

2. **Daily Development:**

   ```bash
   ./scripts/run.sh
   ```

   This will automatically setup if needed and start the dev server.

3. **Testing:**

   ```bash
   ./scripts/test.sh
   ```

4. **Production Deployment:**
   ```bash
   ./scripts/run.sh --prod
   ```
   This will automatically run production setup if needed, build, and start the server.
