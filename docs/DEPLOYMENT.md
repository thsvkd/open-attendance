# Deployment Guide

This guide covers deploying Open Attendance to production environments.

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Open Attendance, as it's built with Next.js.

#### Prerequisites

- [Vercel Account](https://vercel.com/signup)
- PostgreSQL database (we recommend [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Supabase](https://supabase.com/))

#### Steps

1. **Fork/Clone the repository**

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your repository

3. **Configure Environment Variables**

Add the following environment variables in Vercel:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-generated-secret"
```

To generate `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

5. **Initialize Database**
   - After deployment, run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Option 2: Docker

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

#### Steps

1. **Create `docker-compose.yml`**

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/attendance
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=attendance
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

2. **Create `Dockerfile`**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

3. **Update `next.config.ts`**

```typescript
const nextConfig = {
  output: "standalone",
  // ... other config
};
```

4. **Deploy**

```bash
# Set NEXTAUTH_SECRET
export NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Start services
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy
```

### Option 3: VPS (Ubuntu/Debian)

#### Prerequisites

- Ubuntu 20.04+ or Debian 11+ server
- Node.js 20.x
- PostgreSQL 15+
- Nginx (recommended)

#### Steps

1. **Install Dependencies**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx
```

2. **Setup PostgreSQL**

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE attendance;
CREATE USER attendance_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE attendance TO attendance_user;
\c attendance
GRANT ALL ON SCHEMA public TO attendance_user;
EOF
```

3. **Clone and Setup Application**

```bash
# Clone repository
git clone https://github.com/thsvkd/open-attendance.git
cd open-attendance

# Install dependencies
npm ci

# Setup environment
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
```

Add:

```env
DATABASE_URL="postgresql://attendance_user:your_secure_password@localhost:5432/attendance"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

4. **Build and Run**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Start with PM2 (recommended)
sudo npm install -g pm2
pm2 start npm --name "open-attendance" -- start
pm2 save
pm2 startup
```

5. **Configure Nginx**

```bash
sudo nano /etc/nginx/sites-available/open-attendance
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/open-attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Setup SSL with Let's Encrypt**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔒 Production Security Checklist

- [ ] Use PostgreSQL instead of SQLite
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure security headers
- [ ] Monitor application logs
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Disable unnecessary ports
- [ ] Keep dependencies updated
- [ ] Implement log rotation

## 📊 Monitoring

### Application Logs

```bash
# PM2 logs
pm2 logs open-attendance

# Docker logs
docker-compose logs -f app
```

### Database Monitoring

```bash
# PostgreSQL stats
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

### Health Check Endpoint

Add a health check route at `/api/health`:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: "ok" });
}
```

## 🔄 Updates

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm ci

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart (PM2)
pm2 restart open-attendance

# Restart (Docker)
docker-compose down && docker-compose up -d --build
```

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U attendance_user -d attendance
```

### Out of Memory

Increase Node.js memory limit:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## 📚 Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Vercel Deployment](https://vercel.com/docs)
- [Prisma Production](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

---

Need help? Open an issue on [GitHub](https://github.com/thsvkd/open-attendance/issues).
