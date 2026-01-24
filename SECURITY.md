# Security Policy

## 🔒 Security

We take the security of Open Attendance seriously. If you believe you have found a security vulnerability, please report it to us as described below.

## 📢 Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

1. **GitHub Security Advisories**: Use the [Security Advisories](https://github.com/thsvkd/open-attendance/security/advisories) page to privately report a vulnerability
2. **Email**: Send details to the project maintainers (see repository contact information)

### What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Location** of the affected source code (file path, line number)
- **Step-by-step instructions** to reproduce the issue
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)

### Response Timeline

- We will acknowledge receipt of your vulnerability report within **48 hours**
- We will provide a detailed response within **7 days** including next steps
- We will notify you when the vulnerability is fixed

## 🛡️ Security Best Practices

### For Users

#### Environment Variables

**Never commit sensitive information:**

```bash
# ❌ BAD - Don't commit this file
.env.local

# ✅ GOOD - Use environment variables
DATABASE_URL="postgresql://user:password@host:5432/db"
NEXTAUTH_SECRET="your-secret-here"
```

**Generate strong secrets:**

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

#### Database Security

**Production Setup:**

- Use **strong passwords** for database users
- Restrict **network access** to database
- Enable **SSL/TLS** for database connections
- Regular **backups** with encryption
- Use **PostgreSQL** instead of SQLite in production

**PostgreSQL Example:**

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&sslmode=require"
```

#### Authentication

**NextAuth Configuration:**

- Set a **strong NEXTAUTH_SECRET**
- Use **HTTPS** in production
- Configure **session expiration** appropriately
- Enable **CSRF protection** (enabled by default)

#### Deployment

**Production Checklist:**

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure secure headers
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

### For Developers

#### Code Security

**Input Validation:**

```typescript
// ✅ Always validate user input
import { z } from "zod";

const leaveRequestSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  leaveType: z.enum(["ANNUAL", "SICK", "OTHER"]),
  reason: z.string().max(500),
});
```

**SQL Injection Prevention:**

```typescript
// ✅ Use Prisma ORM (parameterized queries)
const user = await prisma.user.findUnique({
  where: { email },
});

// ❌ Never use raw SQL with user input
const query = `SELECT * FROM users WHERE email = '${email}'`; // Vulnerable!
```

**XSS Prevention:**

- React escapes content by default
- Use `dangerouslySetInnerHTML` **only when necessary**
- Sanitize user input before rendering
- Use Content Security Policy headers

**Authentication & Authorization:**

```typescript
// ✅ Always check authentication
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check authorization
  if (session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  // Proceed with authenticated request
}
```

#### Dependency Security

**Keep dependencies updated:**

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

**Review dependencies:**

- Only use **trusted packages**
- Check package **download statistics**
- Review **license compatibility**
- Monitor **security advisories**

#### Secure Coding Practices

**Environment Variables:**

```typescript
// ✅ Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is required");
}
```

**Error Handling:**

```typescript
// ✅ Don't expose sensitive information in errors
try {
  // Database operation
} catch (error) {
  console.error("Database error:", error); // Log for debugging
  return new Response("Internal server error", { status: 500 }); // Generic message to user
}
```

**Rate Limiting:**

Consider implementing rate limiting for API endpoints to prevent abuse:

```typescript
// Example: Rate limit leave requests
const MAX_REQUESTS_PER_HOUR = 10;
```

## 🔐 Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## 🔄 Security Updates

- Security patches are released as soon as possible
- Security advisories are published on GitHub
- Update instructions are provided in release notes

## 📚 Additional Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/security)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Prisma Security](https://www.prisma.io/docs/guides/security)

## ✅ Security Checklist

### Before Deployment

- [ ] All secrets are in environment variables
- [ ] Strong `NEXTAUTH_SECRET` is configured
- [ ] Database uses strong passwords
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Input validation is comprehensive
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date
- [ ] Security headers are configured

### Regular Maintenance

- [ ] Monitor security advisories
- [ ] Update dependencies regularly
- [ ] Review access logs
- [ ] Rotate secrets periodically
- [ ] Backup database regularly
- [ ] Test disaster recovery

---

Thank you for helping keep Open Attendance secure! 🛡️
