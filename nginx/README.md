# Nginx Configuration

This directory contains Nginx configuration templates for the open-attendance application with HTTPS support.

## Files

### nginx.conf.template
Full HTTPS configuration with:
- HTTP to HTTPS redirect
- SSL/TLS configuration
- Security headers
- Reverse proxy to Next.js app on port 3000
- Static file caching

### nginx-http-only.conf.template
HTTP-only configuration used during initial setup for Let's Encrypt verification.

## How It Works

1. During `setup.sh` or `setup-https.sh` execution:
   - The `${DOMAIN}` variable in templates is replaced with your actual domain
   - The generated config is placed in `/etc/nginx/sites-available/open-attendance`
   - A symlink is created in `/etc/nginx/sites-enabled/`

2. For initial SSL certificate acquisition:
   - `nginx-http-only.conf.template` is used first
   - This allows certbot to verify domain ownership via HTTP
   - After certificate is obtained, it's replaced with `nginx.conf.template`

3. The final configuration:
   - Serves your Next.js app via HTTPS
   - Automatically redirects HTTP to HTTPS
   - Handles WebSocket connections for hot reload
   - Includes security best practices

## Manual Configuration

If you need to customize the nginx configuration:

1. Edit the template files in this directory
2. Re-run the setup script to regenerate the configuration:
   ```bash
   ./scripts/setup-https.sh
   ```

## Testing Configuration

To test the nginx configuration:
```bash
sudo nginx -t
```

To reload nginx after changes:
```bash
sudo systemctl reload nginx
```

## Troubleshooting

If nginx fails to start:
1. Check the error log: `sudo tail -f /var/log/nginx/error.log`
2. Verify the configuration: `sudo nginx -t`
3. Check if port 80/443 are already in use: `sudo netstat -tlnp | grep :80`
