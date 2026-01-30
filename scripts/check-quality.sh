#!/usr/bin/env bash

# Quality check script for open-attendance project
# Usage: ./scripts/check-quality.sh [--fix]

set -e

# Load utility functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

PROJECT_ROOT=$(get_project_root)
cd "$PROJECT_ROOT"

# Load NVM
load_nvm

# Check WSL npm
check_wsl_npm

print_header "Open Attendance - Quality Checks"
echo ""

FIX_MODE=false
ESLINT_IGNORE_ARGS=()

if [[ $# -gt 0 ]]; then
  case $1 in
    --fix)
      FIX_MODE=true
      shift
      ;;
    --help|-h)
      echo "Usage: ./scripts/check-quality.sh [--fix]"
      echo ""
      echo "Options:"
      echo "  --fix  - Run formatter and ESLint auto-fix before checks"
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      echo ""
      echo "Usage: ./scripts/check-quality.sh [--fix]"
      exit 1
      ;;
  esac
fi

# Build ESLint ignore args from .gitignore (flat config doesn't support --ignore-path)
if [ -f "$PROJECT_ROOT/.gitignore" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    # Trim leading/trailing whitespace
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"

    # Skip empty lines, comments, and negations
    if [ -z "$line" ] || [[ "$line" == \#* ]] || [[ "$line" == \!* ]]; then
      continue
    fi

    # Normalize .gitignore patterns to ESLint globs
    if [[ "$line" == ./* ]]; then
      line="${line#./}"
    fi
    if [[ "$line" == /* ]]; then
      line="${line#/}"
    fi

    # If pattern ends with a slash, convert to directory glob
    if [[ "$line" == */ ]]; then
      line="${line%/}/**"
    else
      # If pattern already contains glob characters or explicit recursive glob, leave as-is
      if [[ "$line" == *"*"* || "$line" == *"?"* || "$line" == *"["* || "$line" == *"**"* ]]; then
        :
      else
        base="${line##*/}"
        # Heuristic: if basename has no dot, treat as directory and append /**
        if [[ "$base" != *.* ]]; then
          line="${line%/}/**"
        fi
      fi
    fi

    ESLINT_IGNORE_ARGS+=("--ignore-pattern" "$line")
  done < "$PROJECT_ROOT/.gitignore"
fi

# Rely on .gitignore-derived patterns only (no hardcoded ignores)
# Ensure dependencies are installed
ensure_node_modules "npm install"

if [ "$FIX_MODE" = true ]; then
  print_info "Running format and lint auto-fix..."
  npm run format -- --ignore-path .gitignore
  npm run lint:fix -- "${ESLINT_IGNORE_ARGS[@]}"
  echo ""
fi

print_warning "Step 1/3: Formatting check"
npm run format:check -- --ignore-path .gitignore

echo ""
print_warning "Step 2/3: Lint"
npm run lint -- "${ESLINT_IGNORE_ARGS[@]}"

echo ""
print_warning "Step 3/3: Type check"
npm run typecheck

echo ""
print_success "Quality checks completed!"
