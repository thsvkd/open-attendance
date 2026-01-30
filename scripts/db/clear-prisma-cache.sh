#!/usr/bin/env bash

# Clear Prisma cache and regenerate client

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

source "$SCRIPT_DIR/../utils.sh"

cd "$PROJECT_ROOT"

print_info "Clearing Prisma cache..."

# Remove Prisma cache directories
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

print_info "Regenerating Prisma Client..."
npx prisma generate

print_success "Prisma cache cleared and client regenerated"
