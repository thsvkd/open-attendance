#!/bin/bash

# Setup script for open-attendance project
# This script sets up the environment and prepares the application for first run

set -e

echo "🚀 Setting up open-attendance..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Try to load NVM if it exists to ensure we use the correct Node/npm version
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh" > /dev/null 2>&1
  # Use default or first installed version if no version is active or if current is Windows
  if ! command -v node >/dev/null || ! command -v npm >/dev/null || which node | grep -q "/mnt/c/" || which npm | grep -q "/mnt/c/"; then
    if nvm use default > /dev/null 2>&1; then
      : # Success
    else
      # Try to find any installed version
      LATEST_VERSION=$(ls "$NVM_DIR/versions/node" 2>/dev/null | head -n 1)
      if [ -n "$LATEST_VERSION" ]; then
        nvm use "$LATEST_VERSION" > /dev/null 2>&1 || true
      fi
    fi
  fi
fi
hash -r 2>/dev/null

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in WSL and using Windows npm
if grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null; then
  NPM_PATH=$(which npm 2>/dev/null || true)
  if [[ "$NPM_PATH" == *"/mnt/c/"* ]] || [[ "$NPM_PATH" == *".cmd" ]] || [[ "$NPM_PATH" == *".exe" ]]; then
    echo -e "${RED}❌ Error: It seems you are using the Windows version of npm in WSL.${NC}"
    echo -e "${YELLOW}Please install npm in WSL (sudo apt install npm) or use NVM.${NC}"
    echo -e "${YELLOW}Current npm path: $NPM_PATH${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}📁 Project directory: $PROJECT_ROOT${NC}"

# Check if .env.local file exists
if [ -f ".env.local" ]; then
  echo -e "${YELLOW}⚠️  .env.local file already exists. Backing up to .env.local.backup${NC}"
  cp .env.local .env.local.backup
fi

# Create .env.local file from .env.local.example
echo -e "${GREEN}📝 Creating .env.local file from .env.local.example...${NC}"

# Check if .env.local.example exists
if [ ! -f ".env.local.example" ]; then
  echo -e "${RED}❌ Error: .env.local.example file not found${NC}"
  exit 1
fi

# Copy .env.local.example to .env.local
cp .env.local.example .env.local

# Generate a random secret for NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')

# Replace NEXTAUTH_SECRET in .env.local file
if command -v sed &> /dev/null; then
  # Use different sed syntax for macOS and Linux
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" .env.local
  else
    sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" .env.local
  fi
else
  echo -e "${YELLOW}⚠️  sed not found. Please manually update NEXTAUTH_SECRET in .env.local${NC}"
fi

echo -e "${GREEN}✅ .env.local file created successfully${NC}"
echo -e "${GREEN}🔑 NEXTAUTH_SECRET has been automatically generated${NC}"

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm install

# Setup Git hooks with Husky
echo -e "${GREEN}🪝 Setting up Git hooks...${NC}"
npx husky

# Generate Prisma Client
echo -e "${GREEN}🔧 Generating Prisma Client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${GREEN}🗄️  Running database migrations...${NC}"
# Load .env.local to ensure DATABASE_URL is available
set -a
source .env.local 2>/dev/null || true
set +a
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo ""
echo -e "${GREEN}✨ Setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Run the development server:"
echo -e "     ${GREEN}./scripts/run.sh${NC}"
echo ""
echo "  2. Or run in production mode:"
echo -e "     ${GREEN}./scripts/run.sh --prod${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} You may need to create an admin user. Check the documentation for details."
