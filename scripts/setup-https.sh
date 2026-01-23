#!/bin/bash

# Standalone HTTPS setup script for open-attendance
# This can be used to enable HTTPS after initial setup

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 HTTPS Setup for open-attendance${NC}"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ Error: .env file not found${NC}"
  echo -e "${YELLOW}Please run the setup script first:${NC}"
  echo -e "  ${GREEN}./scripts/setup.sh${NC}"
  exit 1
fi

# Ask for domain name
echo -e "${YELLOW}Note: This requires:${NC}"
echo "  - A valid domain name pointing to this server"
echo "  - Port 80 and 443 accessible from the internet"
echo "  - Nginx and certbot installed (will be checked/installed automatically)"
echo ""
read -p "Enter your domain name (e.g., attendance.example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
  echo -e "${RED}❌ Error: Domain name cannot be empty${NC}"
  exit 1
fi

# Validate domain format (basic check)
if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$ ]]; then
  echo -e "${RED}❌ Error: Invalid domain format${NC}"
  exit 1
fi

# Ask for email for Let's Encrypt
echo ""
read -p "Enter your email for Let's Encrypt notifications: " LE_EMAIL

if [ -z "$LE_EMAIL" ]; then
  echo -e "${RED}❌ Error: Email cannot be empty${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}📝 Updating .env file...${NC}"

# Update .env file
if grep -q "^NEXTAUTH_URL=" .env; then
  sed -i.bak "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://$DOMAIN\"|" .env
else
  echo "NEXTAUTH_URL=\"https://$DOMAIN\"" >> .env
fi

if grep -q "^USE_HTTPS=" .env; then
  sed -i.bak "s|^USE_HTTPS=.*|USE_HTTPS=\"true\"|" .env
else
  echo "USE_HTTPS=\"true\"" >> .env
fi

if grep -q "^DOMAIN=" .env; then
  sed -i.bak "s|^DOMAIN=.*|DOMAIN=\"$DOMAIN\"|" .env
else
  echo "DOMAIN=\"$DOMAIN\"" >> .env
fi

echo -e "${GREEN}✅ .env file updated${NC}"

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

if sudo certbot certonly --nginx \
  --non-interactive \
  --agree-tos \
  --email "$LE_EMAIL" \
  -d "$DOMAIN"; then
  
  echo -e "${GREEN}✅ SSL certificate obtained successfully!${NC}"
  
  # Now update nginx config to use HTTPS
  echo -e "${GREEN}📝 Updating nginx configuration for HTTPS...${NC}"
  envsubst '${DOMAIN}' < "$PROJECT_ROOT/nginx/nginx.conf.template" | sudo tee /etc/nginx/sites-available/open-attendance > /dev/null
  
  # Test nginx configuration before reloading
  echo -e "${GREEN}🔍 Testing nginx configuration...${NC}"
  if sudo nginx -t; then
    echo -e "${GREEN}🔄 Reloading nginx...${NC}"
    sudo systemctl reload nginx
  else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    echo -e "${YELLOW}Reverting to HTTP-only configuration...${NC}"
    envsubst '${DOMAIN}' < "$PROJECT_ROOT/nginx/nginx-http-only.conf.template" | sudo tee /etc/nginx/sites-available/open-attendance > /dev/null
    sudo systemctl reload nginx
    exit 1
  fi
  
  # Setup automatic certificate renewal
  echo -e "${GREEN}⏰ Setting up automatic certificate renewal...${NC}"
  
  # Create cron job for certificate renewal
  CRON_JOB="0 3 * * * $PROJECT_ROOT/scripts/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1"
  (crontab -l 2>/dev/null | grep -v "renew-ssl.sh"; echo "$CRON_JOB") | crontab -
  
  echo ""
  echo -e "${GREEN}✨ HTTPS configured successfully!${NC}"
  echo ""
  echo -e "${YELLOW}Your application is now available at:${NC}"
  echo -e "  ${GREEN}https://$DOMAIN${NC}"
  echo ""
  echo -e "${YELLOW}Note:${NC}"
  echo "  - Nginx is configured as a reverse proxy"
  echo "  - SSL certificates will auto-renew via cron job"
  echo "  - Make sure your Next.js app is running (./scripts/run.sh)"
else
  echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
  echo -e "${YELLOW}Please check:${NC}"
  echo "  - Your domain DNS is properly configured"
  echo "  - Port 80 is accessible from the internet"
  echo "  - You have sudo permissions"
  exit 1
fi
