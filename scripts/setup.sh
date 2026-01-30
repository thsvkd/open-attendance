#!/usr/bin/env bash

# Setup script for open-attendance project
# Usage:
#   ./scripts/setup.sh          - Development setup (npm install)
#   ./scripts/setup.sh --dev    - Development setup (npm install)
#   ./scripts/setup.sh --prod   - Production setup (npm ci)

set -e

# Load utility functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

echo "🚀 Setting up open-attendance..."

# Parse command line arguments
SETUP_MODE="dev"
while [[ $# -gt 0 ]]; do
  case $1 in
    --prod|-p)
      SETUP_MODE="prod"
      shift
      ;;
    --dev|-d)
      SETUP_MODE="dev"
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--dev|--prod]"
      echo "  --dev   Development setup (npm install) - default"
      echo "  --prod  Production setup (npm ci)"
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      echo ""
      echo "Usage: $0 [--dev|--prod]"
      echo "  --dev   Development setup (npm install) - default"
      echo "  --prod  Production setup (npm ci)"
      exit 1
      ;;
  esac
done

PROJECT_ROOT=$(get_project_root)
cd "$PROJECT_ROOT"

# Load NVM
load_nvm

# Check WSL npm
check_wsl_npm

print_info "Project directory: $PROJECT_ROOT"
print_info "Setup mode: $SETUP_MODE"


# Check if .env.local file exists
if [ -f ".env.local" ]; then
  print_warning ".env.local file already exists. Backing up to .env.local.backup"
  cp .env.local .env.local.backup
fi

# Create .env.local file from .env.local.example
print_info "Creating .env.local file from .env.local.example..."

# Check if .env.local.example exists
if [ ! -f ".env.local.example" ]; then
  print_error ".env.local.example file not found"
  exit 1
fi

# Copy .env.local.example to .env.local
cp .env.local.example .env.local

# Generate a random secret for NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(generate_secret)

# Replace NEXTAUTH_SECRET in .env.local file
if command -v sed &> /dev/null; then
  sed_inplace "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" .env.local
else
  print_warning "sed not found. Please manually update NEXTAUTH_SECRET in .env.local"
fi

print_success ".env.local file created successfully"
print_success "NEXTAUTH_SECRET has been automatically generated"


# Install dependencies
if [ "$SETUP_MODE" = "prod" ]; then
  print_info "Installing dependencies with npm ci (production mode)..."
  npm ci
else
  print_info "Installing dependencies with npm install (development mode)..."
  npm install
fi

# Setup Git hooks with Husky
print_info "Setting up Git hooks..."
npx husky

# === DB Schema Version Management ===

# 1. Prisma 캐시 이슈 자동 해결
print_info "Checking for Prisma cache issues..."
if ! npx prisma validate &>/dev/null; then
  print_warning "Prisma cache issues detected. Resolving..."
  bash "$SCRIPT_DIR/db/clear-prisma-cache.sh"
  print_success "Prisma cache resolved"
else
  print_success "No Prisma cache issues detected"
fi

# Generate Prisma Client
print_info "Generating Prisma Client..."
npx prisma generate

# Run database migrations
print_info "Running database migrations..."
# Load .env.local to ensure DATABASE_URL is available
load_env_file
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo ""
print_success "Setup completed successfully!"
echo ""
print_warning "Next steps:"
echo "  1. Run the development server:"
echo -e "     ${GREEN}./scripts/run.sh${NC}"
echo ""
echo "  2. Or run in production mode:"
echo -e "     ${GREEN}./scripts/run.sh --prod${NC}"
echo ""
print_warning "Note: You may need to create an admin user. Check the documentation for details."
