<div align="center">

# 🕐 Open Attendance

## Open-source Attendance & Leave Management System

A comprehensive solution for tracking employee attendance, leave, and time-off

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

**Open Attendance** is an open-source attendance and leave management system designed for small teams (especially startups). It provides a unified platform to handle attendance tracking, annual leave management, sick leave processing, and insight reporting.

### Why Open Attendance?

- ✅ **Free & Open Source** - No licensing cost, full transparency
- 🚀 **Easy Deployment** - Simple setup with automated scripts
- 🌏 **Multilingual** - Korean and English supported by default
- 📊 **Comprehensive Reporting** - Track attendance and leave patterns
- 🔒 **Security** - Strong authentication using NextAuth.js
- 🎨 **Modern UI** - Beautiful interface built with Tailwind CSS and Radix UI

---

## ✨ Features

### 📅 Attendance Management

- **Automatic attendance recording** - Assumes attendance on all working days (excluding holidays)
- **Absence recording** - Record and track reasons for absence
- **Flexible work hours** - Supports various work schedules

### 🏖️ Leave Management

- **Annual leave tracking** - Monitor total, used, and remaining leave days
- **Leave request workflow** - Submit, approve, and track leave requests
- **Leave types**:
  - Annual leave
  - Sick leave
  - Official leave
  - Early leave
  - Other leave types
- **Korean labor law compliant** - Applies Korean annual leave regulations
- **Leave balance dashboard** - Real-time leave status

### 👥 User Management

- **Role-based access control**:
  - **Admin** - Full access to all features
  - **User** - Access to personal attendance and leave data
- **Secure authentication** - Powered by NextAuth.js
- **User profiles** - Manage personal info and settings

### 🌐 Internationalization

- **Korean** - Full Korean support
- **English** - Full English translation
- **Easy language switch** - Seamless language toggling

---

## 🚀 Quick Start

Run Open Attendance in minutes!

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Git**

### Clone the Repository

```bash

```

### Setup & Run

```bash
./scripts/setup.sh
```

```bash
./scripts/run.sh
```

Or run in production mode:

```bash
./scripts/run.sh --prod   # build then start
```

After it starts, open [http://localhost:3000](http://localhost:3000) 🎉

---

## ⚙️ Configuration

### Environment Variables

| Variable          | Description                | Required | Default                 |
| ----------------- | -------------------------- | -------- | ----------------------- |
| `DATABASE_URL`    | Database connection string | Yes      | `file:./dev.db`         |
| `NEXTAUTH_URL`    | Application URL            | Yes      | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret key        | Yes      | -                       |

### Database Setup

**Development**: SQLite (default)

```env
DATABASE_URL="file:./dev.db"
```

**Production**: PostgreSQL (recommended)

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

---

### Database Management

**Run Prisma Studio** (Database GUI):

```bash
npx prisma studio
```

**Create a migration**:

```bash
npx prisma migrate dev --name your_migration_name
```

**Initialize/Reset database**:

```bash
npx prisma migrate reset
```

---

## 🤝 Contributing

We welcome contributions from the community!

- 🐛 Bug reports
- 💡 Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

---

## 🐛 Troubleshooting

### NextAuth configuration error

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

### Database connection issues

**Error**: `Can't reach database server`

**Solution**: Check `DATABASE_URL` in `.env.local` and ensure the database server is running.

### Port already in use

**Error**: `Port 3000 is already in use`

**Solution**: Stop the process using port 3000 or use another port:

```bash
PORT=3001 npm run dev
```

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) for details.

---

## 🛠 Tech Stack

Built with:

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
