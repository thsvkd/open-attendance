#!/bin/bash

# Setup script for open-attendance project
# This script sets up the environment and prepares the application for first run

set -e

echo "🚀 Setting up open-attendance..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}📁 Project directory: $PROJECT_ROOT${NC}"

# Check if .env file exists
if [ -f ".env" ]; then
  echo -e "${YELLOW}⚠️  .env file already exists. Backing up to .env.backup${NC}"
  cp .env .env.backup
fi

# Create .env file
echo -e "${GREEN}📝 Creating .env file...${NC}"

# Generate a random secret for NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')

cat > .env << EOF
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
EOF

echo -e "${GREEN}✅ .env file created successfully${NC}"

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm install

# Generate Prisma Client
echo -e "${GREEN}🔧 Generating Prisma Client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${GREEN}🗄️  Running database migrations...${NC}"
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
