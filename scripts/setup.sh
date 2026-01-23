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

# Ask user if they want to enable HTTPS
echo ""
echo -e "${YELLOW}🔐 HTTPS Configuration${NC}"
echo "Do you want to enable HTTPS with Let's Encrypt? (recommended for production)"
echo -e "${YELLOW}Note: This requires:${NC}"
echo "  - A valid domain name pointing to this server"
echo "  - Port 80 and 443 accessible from the internet"
echo "  - Nginx and certbot installed (will be checked/installed automatically)"
echo ""
read -p "Enable HTTPS? (y/n): " -n 1 -r ENABLE_HTTPS
echo ""

USE_HTTPS="false"
DOMAIN=""
NEXTAUTH_URL="http://localhost:3000"

if [[ $ENABLE_HTTPS =~ ^[Yy]$ ]]; then
  USE_HTTPS="true"
  
  # Ask for domain name
  echo ""
  read -p "Enter your domain name (e.g., attendance.example.com): " DOMAIN
  
  if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Error: Domain name cannot be empty${NC}"
    exit 1
  fi
  
  # Validate domain format (basic check)
  if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${RED}❌ Error: Invalid domain format${NC}"
    exit 1
  fi
  
  NEXTAUTH_URL="https://$DOMAIN"
  
  # Ask for email for Let's Encrypt
  echo ""
  read -p "Enter your email for Let's Encrypt notifications: " LE_EMAIL
  
  if [ -z "$LE_EMAIL" ]; then
    echo -e "${RED}❌ Error: Email cannot be empty${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ HTTPS will be configured for domain: $DOMAIN${NC}"
fi

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
DATABASE_URL="file:./prisma/db/dev.db"

# NextAuth Configuration
NEXTAUTH_URL="$NEXTAUTH_URL"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# HTTPS Configuration
USE_HTTPS="$USE_HTTPS"
DOMAIN="$DOMAIN"
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

# Configure HTTPS if enabled
if [ "$USE_HTTPS" = "true" ]; then
  echo ""
  echo -e "${GREEN}🔐 Configuring HTTPS with Let's Encrypt...${NC}"
  
  # Check if nginx is installed
  if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📦 Installing nginx...${NC}"
    sudo apt-get update
    sudo apt-get install -y nginx
  fi
  
  # Check if certbot is installed
  if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}📦 Installing certbot...${NC}"
    sudo apt-get install -y certbot python3-certbot-nginx
  fi
  
  # Create directory for Let's Encrypt verification
  sudo mkdir -p /var/www/certbot
  
  # Generate nginx config for initial HTTP setup (needed for certbot)
  echo -e "${GREEN}📝 Creating nginx configuration...${NC}"
  export DOMAIN
  envsubst '${DOMAIN}' < "$PROJECT_ROOT/nginx/nginx-http-only.conf.template" | sudo tee /etc/nginx/sites-available/open-attendance > /dev/null
  
  # Enable the site
  sudo ln -sf /etc/nginx/sites-available/open-attendance /etc/nginx/sites-enabled/open-attendance
  
  # Remove default nginx site if it exists
  sudo rm -f /etc/nginx/sites-enabled/default
  
  # Test nginx configuration
  echo -e "${GREEN}🔍 Testing nginx configuration...${NC}"
  sudo nginx -t
  
  # Restart nginx
  echo -e "${GREEN}🔄 Starting nginx...${NC}"
  sudo systemctl restart nginx
  sudo systemctl enable nginx
  
  # Obtain SSL certificate
  echo -e "${GREEN}📜 Obtaining SSL certificate from Let's Encrypt...${NC}"
  echo -e "${YELLOW}This may take a minute...${NC}"
  
  sudo certbot certonly --nginx \
    --non-interactive \
    --agree-tos \
    --email "$LE_EMAIL" \
    -d "$DOMAIN"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL certificate obtained successfully!${NC}"
    
    # Now update nginx config to use HTTPS
    echo -e "${GREEN}📝 Updating nginx configuration for HTTPS...${NC}"
    envsubst '${DOMAIN}' < "$PROJECT_ROOT/nginx/nginx.conf.template" | sudo tee /etc/nginx/sites-available/open-attendance > /dev/null
    
    # Test and reload nginx
    sudo nginx -t
    sudo systemctl reload nginx
    
    # Setup automatic certificate renewal
    echo -e "${GREEN}⏰ Setting up automatic certificate renewal...${NC}"
    
    # Create cron job for certificate renewal
    CRON_JOB="0 3 * * * $PROJECT_ROOT/scripts/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1"
    (crontab -l 2>/dev/null | grep -v "renew-ssl.sh"; echo "$CRON_JOB") | crontab -
    
    echo -e "${GREEN}✅ HTTPS configured successfully!${NC}"
    echo -e "${YELLOW}Your application will be available at: https://$DOMAIN${NC}"
  else
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    echo -e "${YELLOW}Please check:${NC}"
    echo "  - Your domain DNS is properly configured"
    echo "  - Port 80 is accessible from the internet"
    echo "  - You have sudo permissions"
    echo ""
    echo -e "${YELLOW}You can retry HTTPS setup later by running:${NC}"
    echo -e "  ${GREEN}./scripts/setup-https.sh${NC}"
  fi
fi

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
if [ "$USE_HTTPS" = "true" ]; then
  echo -e "${YELLOW}HTTPS is enabled:${NC}"
  echo -e "  - Your app will be available at: ${GREEN}https://$DOMAIN${NC}"
  echo -e "  - Nginx is configured as a reverse proxy"
  echo -e "  - SSL certificates will auto-renew via cron job"
  echo ""
fi
echo -e "${YELLOW}Note:${NC} You may need to create an admin user. Check the documentation for details."
