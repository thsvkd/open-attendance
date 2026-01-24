#!/bin/bash

# Run script for open-attendance project
# Usage:
#   ./scripts/run.sh                - Run in development mode (port from .env.local)
#   ./scripts/run.sh --port 3001    - Run in development mode with custom port
#   ./scripts/run.sh --prod         - Build and run in production mode
#   ./scripts/run.sh --prod --port  - Build and run in production mode with custom port

set -e

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

# Check if .env.local file exists
if [ ! -f ".env.local" ]; then
  echo -e "${RED}❌ Error: .env.local file not found${NC}"
  echo -e "${YELLOW}Please run the setup script first:${NC}"
  echo -e "  ${GREEN}./scripts/setup.sh${NC}"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
  npm install
fi

# Parse command line arguments
MODE="dev"
PORT=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --prod|-p)
      MODE="prod"
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Get default port from .env.local if not specified
if [ -z "$PORT" ]; then
  PORT=$(grep -E "^PORT=" ".env.local" | cut -d '=' -f 2 | tr -d '"' || echo "3000")
fi

if [ "$MODE" = "prod" ]; then
  echo -e "${GREEN}🏗️  Building for production...${NC}"
  npm run build

  echo ""
  echo -e "${GREEN}🚀 Starting production server...${NC}"
  echo -e "${YELLOW}Server will be available at: http://localhost:${PORT}${NC}"
  echo ""
  PORT="$PORT" npm start -- --prod
else
  echo -e "${GREEN}🔧 Starting development server...${NC}"
  echo -e "${YELLOW}Server will be available at: http://localhost:${PORT}${NC}"
  echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
  echo ""
  PORT="$PORT" npm run dev
fi
