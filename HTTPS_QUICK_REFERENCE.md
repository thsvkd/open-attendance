# HTTPS Quick Reference

## 🚀 Quick Start

### Enable HTTPS During Setup
```bash
./scripts/setup.sh
# Answer 'y' when asked about HTTPS
# Enter your domain and email
```

### Enable HTTPS After Setup
```bash
./scripts/setup-https.sh
# Enter your domain and email
```

## 📋 Prerequisites

- [ ] Ubuntu/Debian Linux system
- [ ] Valid domain name (e.g., attendance.example.com)
- [ ] DNS pointing to your server
- [ ] Ports 80 and 443 open
- [ ] sudo permissions

## 🔍 Quick Checks

```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx configuration
sudo nginx -t

# View certificates
sudo certbot certificates

# Check renewal cron
crontab -l | grep renew-ssl

# View renewal logs
tail -f /var/log/ssl-renewal.log
```

## 🔧 Common Commands

```bash
# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Renew certificates manually
./scripts/renew-ssl.sh

# Test renewal (dry run)
sudo certbot renew --dry-run
```

## 🐛 Troubleshooting

### Certificate Failed
```bash
# Check DNS
nslookup your-domain.com

# Check ports
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Nginx Won't Start
```bash
# Test configuration
sudo nginx -t

# Check what's using port 80/443
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

## 📚 Documentation

- `HTTPS_SETUP.md` - Full setup guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `nginx/README.md` - Nginx configuration
- `README.md` - General documentation

## 🔐 Security Details

- **TLS Versions**: 1.2, 1.3
- **Ciphers**: ECDHE-ECDSA-AES128-GCM-SHA256, ECDHE-RSA-AES128-GCM-SHA256, etc.
- **Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **Auto-Renewal**: Daily at 3 AM via cron

## ⚙️ Environment Variables

```env
# .env file
USE_HTTPS="true"
DOMAIN="attendance.example.com"
NEXTAUTH_URL="https://attendance.example.com"
```

## 🆘 Getting Help

1. Check the documentation in `HTTPS_SETUP.md`
2. Review nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Test nginx config: `sudo nginx -t`
4. Verify DNS: `nslookup your-domain.com`
5. Check certbot: `sudo certbot certificates`
