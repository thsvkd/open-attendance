# HTTPS Setup Documentation

## Overview

This implementation adds automatic HTTPS support using Let's Encrypt SSL certificates to the open-attendance application. Running `setup.sh` now provides an option to enable HTTPS with minimal user interaction.

## What Was Implemented

### 1. Nginx Reverse Proxy Configuration

Two nginx configuration templates were created:

- **nginx.conf.template**: Full HTTPS configuration with HTTP to HTTPS redirect
- **nginx-http-only.conf.template**: Initial HTTP-only config for Let's Encrypt verification

### 2. Automated Setup Scripts

#### setup.sh (Enhanced)
- Prompts user to enable HTTPS during initial setup
- Validates domain name format
- Collects email for Let's Encrypt notifications
- Installs nginx and certbot if not present
- Obtains SSL certificates automatically
- Configures automatic certificate renewal via cron

#### setup-https.sh (New)
- Standalone script for enabling HTTPS after initial setup
- Useful if users skip HTTPS during initial setup
- Performs same HTTPS configuration as setup.sh

#### renew-ssl.sh (New)
- Automated SSL certificate renewal script
- Runs daily via cron (3 AM)
- Reloads nginx after successful renewal
- Logs renewal status to /var/log/ssl-renewal.log

### 3. Environment Configuration

Updated `.env.example` and `.env` generation to include:
- `USE_HTTPS`: Boolean flag for HTTPS mode
- `DOMAIN`: Domain name for the application
- `NEXTAUTH_URL`: Automatically set to https:// when HTTPS is enabled

### 4. Documentation

- Updated README.md with HTTPS setup instructions
- Added troubleshooting section for common issues
- Created nginx/README.md explaining nginx configuration

## How It Works

### Initial Setup Flow

1. User runs `./scripts/setup.sh`
2. Script asks if HTTPS should be enabled
3. If yes:
   - User provides domain name and email
   - Script validates domain format
   - Installs nginx and certbot (if needed)
   - Creates HTTP-only nginx config
   - Starts nginx
   - Runs certbot to obtain SSL certificate
   - Replaces config with HTTPS version
   - Sets up automatic renewal cron job
   - Updates .env with HTTPS URL

### Certificate Renewal

- Cron job runs daily at 3 AM
- Executes `certbot renew --quiet`
- If certificates are renewed, nginx is reloaded
- Logs are written to /var/log/ssl-renewal.log

### Architecture

```
Internet → Port 443 (HTTPS) → Nginx → Port 3000 (Next.js)
           Port 80 (HTTP)   → Nginx → Redirect to HTTPS
```

## Requirements

- Ubuntu/Debian-based Linux system
- Valid domain name with DNS pointing to the server
- Ports 80 and 443 open and accessible from internet
- sudo permissions for installing packages and configuring nginx

## Usage Examples

### Initial Setup with HTTPS
```bash
./scripts/setup.sh
# Answer 'y' when asked about HTTPS
# Enter your domain name
# Enter your email
```

### Enable HTTPS After Initial Setup
```bash
./scripts/setup-https.sh
# Enter your domain name
# Enter your email
```

### Manual Certificate Renewal
```bash
./scripts/renew-ssl.sh
```

### Check nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

## Security Features

- TLS 1.2 and 1.3 only
- Strong cipher suites (ECDHE-ECDSA-AES128-GCM-SHA256, ECDHE-RSA-AES128-GCM-SHA256, etc.)
- HSTS (HTTP Strict Transport Security)
- Content-Security-Policy header (modern XSS protection)
- X-Frame-Options header (clickjacking protection)
- X-Content-Type-Options header (MIME sniffing protection)
- Automatic HTTP to HTTPS redirect

## Troubleshooting

### Certificate Issuance Fails

**Check DNS:**
```bash
nslookup your-domain.com
```

**Check firewall:**
```bash
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
```

**Check nginx:**
```bash
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Port Already in Use

```bash
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
# Stop conflicting services if needed
```

### Certificate Renewal Issues

Check renewal logs:
```bash
sudo tail -f /var/log/ssl-renewal.log
```

Test renewal:
```bash
sudo certbot renew --dry-run
```

## Files Changed

- `scripts/setup.sh` - Enhanced with HTTPS configuration
- `scripts/setup-https.sh` - New standalone HTTPS setup script
- `scripts/renew-ssl.sh` - New certificate renewal script
- `nginx/nginx.conf.template` - HTTPS nginx configuration
- `nginx/nginx-http-only.conf.template` - HTTP-only nginx configuration
- `nginx/README.md` - Nginx configuration documentation
- `.env.example` - Added HTTPS variables
- `README.md` - Added HTTPS setup documentation
- `.gitignore` - Added nginx generated files

## Benefits

1. **One-Command Setup**: Users can enable HTTPS with just `./scripts/setup.sh`
2. **Automatic Certificate Management**: Let's Encrypt certificates are obtained and renewed automatically
3. **Production-Ready**: Includes security headers and best practices
4. **Flexible**: Can enable HTTPS during initial setup or later
5. **Low Maintenance**: Auto-renewal means certificates won't expire
6. **Free SSL**: Uses Let's Encrypt (no cost)

## Future Enhancements

Potential improvements for future versions:
- Support for multiple domains
- Cloudflare DNS integration
- Docker-based deployment option
- Health check endpoints
- Rate limiting configuration
- WAF (Web Application Firewall) integration
