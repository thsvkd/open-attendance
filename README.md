<div align="center">

# 🕐 Open Attendance

### Open-source Attendance & Leave Management System

*A comprehensive solution for tracking employee attendance, leaves, and work hours*

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
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Development](#-development)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Open Attendance** is an open-source attendance and leave management system designed for small to medium-sized teams (especially startups). It provides a comprehensive platform to track employee attendance, manage annual leave, handle sick leave, and generate insightful reports.

### Why Open Attendance?

- ✅ **Free & Open Source** - No licensing fees, full transparency
- 🚀 **Easy to Deploy** - Simple setup with automated scripts
- 🌏 **Multilingual** - Supports Korean and English out of the box
- 📊 **Comprehensive Reporting** - Track attendance and leave patterns
- 🔒 **Secure** - Built with NextAuth.js for robust authentication
- 🎨 **Modern UI** - Beautiful interface built with Tailwind CSS and Radix UI

---

## ✨ Features

### 📅 Attendance Management
- **Automatic Attendance Tracking** - Assumes attendance on all working days (excluding holidays)
- **Absence Recording** - Record and track absence reasons
- **Flexible Work Hours** - Support for various work schedules

### 🏖️ Leave Management
- **Annual Leave Tracking** - Monitor total, used, and remaining annual leave days
- **Leave Request Workflow** - Submit, approve, and track leave requests
- **Multiple Leave Types**:
  - Annual leave (연차)
  - Sick leave (병가)
  - Official leave (공가)
  - Early departure (조퇴)
  - Other leave types
- **Korean Labor Law Compliance** - Follows Korean annual leave regulations
- **Leave Balance Dashboard** - Real-time view of leave entitlements

### 📊 Reporting & Analytics
- **Monthly Reports** - Detailed monthly attendance and leave summaries
- **Quarterly Reports** - Quarter-wise analysis of attendance patterns
- **Annual Reports** - Yearly overview of employee attendance
- **Customizable Views** - Filter and sort data by various criteria

### 👥 User Management
- **Role-Based Access Control**:
  - **Administrators** - Full system access and management capabilities
  - **Regular Users** - View and manage personal attendance/leave data
- **Secure Authentication** - Powered by NextAuth.js
- **User Profiles** - Manage personal information and preferences

### 🌐 Internationalization
- **Korean (한국어)** - Full Korean language support
- **English** - Complete English translation
- **Easy Language Switching** - Toggle between languages seamlessly

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://reactjs.org/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **i18n**: [next-intl](https://next-intl-docs.vercel.app/)

### Backend
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **ORM**: [Prisma](https://www.prisma.io/)
- **API**: Next.js API Routes

### DevOps
- **Package Manager**: npm
- **Code Quality**: ESLint
- **Version Control**: Git

---

## 🚀 Quick Start

Get Open Attendance up and running in minutes!

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git**

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/thsvkd/open-attendance.git
cd open-attendance

# Run the automated setup script
./scripts/setup.sh

# Start the development server
./scripts/run.sh
```

🎉 Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 📦 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/thsvkd/open-attendance.git
cd open-attendance
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"
```

> 💡 **Tip**: Use `openssl rand -base64 32` to generate a secure `NEXTAUTH_SECRET`

### Step 4: Initialize Database

```bash
npx prisma generate
npx prisma migrate dev
```

### Step 5: Start Development Server

```bash
npm run dev
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Database connection string | Yes | `file:./prisma/dev.db` |
| `NEXTAUTH_URL` | Application URL | Yes | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes | - |

### Database Configuration

**Development**: SQLite (default)
```env
DATABASE_URL="file:./prisma/dev.db"
```

**Production**: PostgreSQL (recommended)
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

---

## 💻 Development

### Running Development Server

```bash
npm run dev
# or
./scripts/run.sh
```

### Building for Production

```bash
npm run build
npm start
# or
./scripts/run.sh --prod
```

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

### Project Structure

```
open-attendance/
├── app/                    # Next.js app directory (pages & API routes)
│   ├── api/               # API endpoints
│   ├── dashboard/         # Dashboard pages
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── dashboard/        # Dashboard-specific components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions & configurations
├── messages/             # i18n translation files
│   ├── en.json           # English translations
│   └── ko.json           # Korean translations
├── prisma/               # Database schema & migrations
├── public/               # Static assets
└── scripts/              # Utility scripts
```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thsvkd/open-attendance)

1. Click the "Deploy" button above
2. Configure environment variables
3. Deploy!

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Setup for Production

1. Set up a PostgreSQL database
2. Configure environment variables in your hosting platform
3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## 📚 Documentation

- **[Features](FEATURES.md)** - Detailed feature documentation
- **[API Documentation](docs/API.md)** - API endpoints reference *(coming soon)*
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deployment instructions *(coming soon)*
- **[Contributing](CONTRIBUTING.md)** - How to contribute *(coming soon)*

### Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions

Please feel free to open an issue or submit a pull request.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 🐛 Troubleshooting

### NextAuth Configuration Error

**Error**:
```
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

**Solution**: Check your `DATABASE_URL` in `.env` and ensure the database server is running.

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**: Kill the process using port 3000 or specify a different port:
```bash
PORT=3001 npm run dev
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

---

## 📞 Support

- 🌟 Star this repository if you find it helpful!
- 🐛 [Report Issues](https://github.com/thsvkd/open-attendance/issues)
- 💬 [Discussions](https://github.com/thsvkd/open-attendance/discussions)

---

<div align="center">

**[⬆ Back to Top](#-open-attendance)**

Made with ❤️ by the Open Attendance Team

</div>
