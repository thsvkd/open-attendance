#!/bin/bash

# Utility functions and constants for open-attendance scripts
# Source this file in other scripts: source "$(dirname "$0")/utils.sh"

# Color definitions for terminal output
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export RED='\033[0;31m'
export BLUE='\033[0;34m'
export NC='\033[0m' # No Color

# Print colored messages
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_header() {
  echo -e "${GREEN}======================================${NC}"
  echo -e "${GREEN}  $1${NC}"
  echo -e "${GREEN}======================================${NC}"
}

# Get project root directory
get_project_root() {
  local script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
  echo "$(dirname "$script_dir")"
}

# Load NVM if available
load_nvm() {
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
}

# Check if running in WSL with Windows npm (not allowed)
check_wsl_npm() {
  if grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null; then
    NPM_PATH=$(which npm 2>/dev/null || true)
    if [[ "$NPM_PATH" == *"/mnt/c/"* ]] || [[ "$NPM_PATH" == *".cmd" ]] || [[ "$NPM_PATH" == *".exe" ]]; then
      print_error "It seems you are using the Windows version of npm in WSL."
      print_warning "Please install npm in WSL (sudo apt install npm) or use NVM."
      print_warning "Current npm path: $NPM_PATH"
      exit 1
    fi
  fi
}

# Check if .env.local file exists
check_env_file() {
  if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found"
    print_warning "Please run the setup script first:"
    echo -e "  ${GREEN}./scripts/setup.sh${NC}"
    exit 1
  fi
}

# Check if node_modules exists and install if needed
ensure_node_modules() {
  local install_cmd="${1:-npm install}"
  
  if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Running ${install_cmd}..."
    $install_cmd
  fi
}

# Generate a random secret using openssl
generate_secret() {
  openssl rand -base64 32 | tr -d '\n'
}

# Update sed command based on OS (macOS vs Linux)
sed_inplace() {
  local pattern="$1"
  local file="$2"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$pattern" "$file"
  else
    sed -i "$pattern" "$file"
  fi
}

# Load environment variables from .env.local
load_env_file() {
  if [ -f ".env.local" ]; then
    set -a
    source .env.local 2>/dev/null || true
    set +a
  fi
}

# Get PORT from .env.local or use default
get_port() {
  local default_port="${1:-3000}"
  
  if [ -f ".env.local" ]; then
    local port=$(grep -E "^PORT=" ".env.local" | cut -d '=' -f 2 | tr -d '"' || echo "$default_port")
    echo "$port"
  else
    echo "$default_port"
  fi
}
