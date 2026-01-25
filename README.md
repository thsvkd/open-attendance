<div align="center">

# 🕐 Open Attendance

## All-in-One Attendance & Leave Management for Startups

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[English](README.md) | [한국어](README.ko.md)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Open Attendance** is an open-source attendance and leave management system designed for small to medium-sized teams (especially startups). It provides a unified platform to handle daily check-in/out tracking, annual leave management, sick leave processing, and insight reporting.

### Why Open Attendance?

- ✅ **Free & Open Source** - No licensing fees, full transparency
- 🚀 **Easy Deployment** - Simple setup with automated scripts
- 🌏 **Multilingual** - Korean and English support by default
- 📊 **Comprehensive Reporting** - Track attendance and leave patterns
- 🔒 **Security** - Strong authentication using NextAuth.js
- 🎨 **Modern UI** - Beautiful interface built with Tailwind CSS and Radix UI

---

## ✨ Features

### 📅 Attendance Management

- **Attendance Recording** - Record check-in and check-out on all working days (excluding holidays)
- **Early Leave/Absence** - Record and track reasons for early leave or absence

### 🏖️ Leave Management

- **Leave Tracking** - Monitor total, used, and remaining annual leave
- **Leave Request Workflow** - Submit, approve, and track leave requests
- **Diverse Leave Types**:
  - Annual Leave
    - Full day (1.0)
    - Half day (0.5)
    - Quarter day (0.25)
  - Sick Leave
  - Official Leave
  - Early Leave
  - Other
- **Korean Labor Law Compliant** - Applies standard Korean annual leave regulations
- **Leave Balance Dashboard** - Real-time leave status at a glance

### 👥 User Management

- **Role-Based Access Control (RBAC)**:
  - **Admin (ADMIN)** - Full system access and management permissions
  - **Regular User (USER)** - View and manage personal attendance and leave data
- **Secure Authentication** - Powered by NextAuth.js
- **User Profiles** - Manage personal information and settings

### 🌐 Internationalization (i18n)

- **Korean** - Full Korean language support
- **English** - Full English translation
- **Easy Toggle** - Seamless language switching

---

## 🚀 Quick Start

Get Open Attendance up and running in minutes!

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Git**

### Clone the Repository

```bash
git clone https://github.com/thsvkd/open-attendance.git
```

### Setup & Execution

#### Dependency Installation & Initial Setup

```bash
# Development setup
./scripts/setup.sh

# Or production setup
./scripts/setup.sh --prod
```

#### Running the Server

```bash
# Run in development mode
./scripts/run.sh

# Or run in production mode
./scripts/run.sh --prod

# Run on a custom port
./scripts/run.sh --port 3001
```

After the server starts, open [http://localhost:3000](http://localhost:3000) in your browser! 🎉

> 💡 **Tip:** For detailed documentation on the provided scripts, refer to [scripts/README.md](scripts/README.md).

---

## ⚙️ Configuration

### Environment Variables

| Variable          | Description                | Required | Default                 |
| ----------------- | -------------------------- | -------- | ----------------------- |
| `DATABASE_URL`    | Database connection string | Yes      | `file:./dev.db`         |
| `NEXTAUTH_URL`    | Application URL            | Yes      | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret key        | Yes      | _`Auto-generated`_      |

### Database Setup

**Development Environment**: SQLite (Default)

```env
DATABASE_URL="file:./dev.db"
```

**Production Environment**: PostgreSQL (Recommended)

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

---

### Database Management

**Run Prisma Studio** (Database GUI):

```bash
npx prisma studio
```

**Create a Migration**:

```bash
npx prisma migrate dev --name your_migration_name
```

**Reset Database**:

```bash
npx prisma migrate reset
```

---

## 🤝 Contributing

We welcome community contributions!

- 🐛 Bug Reports
- 💡 Feature Requests
- 📝 Documentation Improvements
- 🔧 Code Contributions

For details, please refer to the [Contributing Guide](CONTRIBUTING.md).

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📚 Documentation

- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Security Policy](SECURITY.md) - Security best practices
- [Testing Guide](docs/TESTING.md) - Testing documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Architecture](docs/ARCHITECTURE.md) - System architecture overview

---

## 🐛 Troubleshooting

### NextAuth Configuration Error

**Error**:

```log
[next-auth][warn][NEXTAUTH_URL]
[next-auth][warn][NO_SECRET]
GET /api/auth/error?error=Configuration 500
```

**Solution**: Run the setup script to configure environment variables:

```bash
./scripts/setup.sh
```

### Database Connection Issues

**Error**: `Can't reach database server`

**Solution**: Verify the `DATABASE_URL` in `.env.local` and ensure your database server is reachable.

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**: Terminate the process using port 3000 or use a different port:

```bash
PORT=3001 npm run dev
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🛠 Tech Stack

Built with the following modern technologies:

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

---

<div align="center">

**[⬆ Back to Top](#-open-attendance)**

Made with ❤️ by the Open Attendance Team

</div>
