#!/bin/bash

# Run script for open-attendance project
# Usage:
#   ./scripts/run.sh                - Run in development mode (port from .env.local)
#   ./scripts/run.sh --dev          - Run in development mode
#   ./scripts/run.sh --port 3001    - Run in development mode with custom port
#   ./scripts/run.sh --prod         - Build and run in production mode
#   ./scripts/run.sh --prod --port  - Build and run in production mode with custom port

set -e

# Load utility functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

PROJECT_ROOT=$(get_project_root)
cd "$PROJECT_ROOT"

# Load NVM
load_nvm

# Parse command line arguments
MODE="dev"
PORT=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --dev|-d)
      MODE="dev"
      shift
      ;;
    --prod|-p)
      MODE="prod"
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [--dev|--prod] [--port PORT]"
      echo "  --dev   Run in development mode (default)"
      echo "  --prod  Build and run in production mode"
      echo "  --port  Specify custom port (default: from .env.local or 3000)"
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      echo ""
      echo "Usage: $0 [--dev|--prod] [--port PORT]"
      exit 1
      ;;
  esac
done

# Run setup.sh with the appropriate mode if needed
if [ ! -f ".env.local" ] || [ ! -d "node_modules" ]; then
  print_info "Running setup for the first time or after clean..."
  if [ "$MODE" = "prod" ]; then
    "$SCRIPT_DIR/setup.sh" --prod
  else
    "$SCRIPT_DIR/setup.sh" --dev
  fi
else
  # Setup already done, just ensure dependencies are up to date
  if [ "$MODE" = "prod" ]; then
    ensure_node_modules "npm ci"
  else
    ensure_node_modules "npm install"
  fi
fi

# After setup, check if .env.local exists (it should now)
check_env_file

# Get default port from .env.local if not specified
if [ -z "$PORT" ]; then
  PORT=$(get_port "3000")
fi

if [ "$MODE" = "prod" ]; then
  print_info "Building for production..."
  npm run build

  echo ""
  print_success "Starting production server..."
  print_warning "Server will be available at: http://localhost:${PORT}"
  echo ""
  PORT="$PORT" npm start
else
  print_info "Starting development server..."
  print_warning "Server will be available at: http://localhost:${PORT}"
  print_warning "Press Ctrl+C to stop the server"
  echo ""
  PORT="$PORT" npm run dev
fi
