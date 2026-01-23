#!/bin/bash

# SSL certificate renewal script for open-attendance
# This script should be run periodically (e.g., via cron) to renew SSL certificates

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Checking SSL certificate renewal...${NC}"

# Try to renew certificates
sudo certbot renew --quiet

# Check if nginx is running
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}🔄 Reloading nginx...${NC}"
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx is not running${NC}"
fi

echo -e "${GREEN}✅ Certificate renewal check completed${NC}"
