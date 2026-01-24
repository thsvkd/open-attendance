# System Architecture

This document provides an overview of the Open Attendance system architecture.

## 🏗️ Architecture Overview

Open Attendance is built using a modern full-stack architecture with Next.js as the primary framework.

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 19 + Next.js 16 (App Router)                  │   │
│  │  - Server Components & Client Components             │   │
│  │  - Internationalization (next-intl)                  │   │
│  │  - UI Components (Radix UI + Tailwind CSS)          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js API Routes                                  │   │
│  │  - RESTful API endpoints                             │   │
│  │  - Server Actions                                    │   │
│  │  - Middleware                                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Authentication Layer                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  NextAuth.js                                         │   │
│  │  - Credentials Provider                              │   │
│  │  - Session Management                                │   │
│  │  - JWT Tokens                                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Access Layer                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Prisma ORM                                          │   │
│  │  - Type-safe database queries                        │   │
│  │  - Migrations                                        │   │
│  │  - Schema management                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Database Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL / SQLite                                 │   │
│  │  - User data                                         │   │
│  │  - Attendance records                                │   │
│  │  - Leave management                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Core Components

### Frontend Layer

#### Technology Stack

- **React 19**: Modern React with concurrent features
- **Next.js 16**: App Router for server-side rendering
- **TypeScript**: Type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **next-intl**: Internationalization support

#### Key Features

- Server-side rendering (SSR)
- Static site generation (SSG) where applicable
- Client-side hydration
- Responsive design
- Dark mode support
- Internationalization (Korean/English)

### Application Layer

#### API Routes Structure

```
app/api/
├── auth/              # Authentication endpoints (NextAuth)
├── attendance/        # Attendance management
│   ├── today/        # Today's attendance status
│   ├── check-in/     # Check-in endpoint
│   ├── check-out/    # Check-out endpoint
│   └── history/      # Attendance history
├── leaves/           # Leave request management
├── annual-leave/     # Annual leave balance
└── admin/            # Admin-only endpoints
    ├── users/        # User management
    └── leaves/       # Leave approval
```

#### Request Flow

```
User Request
    ↓
Next.js Middleware (authentication check)
    ↓
API Route Handler
    ↓
Session Verification (NextAuth)
    ↓
Authorization Check (role-based)
    ↓
Business Logic
    ↓
Prisma Query
    ↓
Database Operation
    ↓
Response
```

### Authentication System

#### NextAuth.js Configuration

```typescript
// Authentication flow
1. User submits credentials
2. Credentials provider validates against database
3. Password verified with bcrypt
4. JWT token generated
5. Session created
6. User redirected to dashboard
```

#### Session Management

- JWT-based sessions
- Secure HTTP-only cookies
- Session expiration handling
- CSRF protection

#### Authorization

- Role-based access control (RBAC)
- Admin vs User permissions
- Protected API routes
- Protected pages

### Data Layer

#### Prisma Schema

```prisma
// Core models
User
├── id
├── email
├── password (hashed)
├── name
├── role (ADMIN/USER)
├── joinDate
└── relationships: Attendance[], AnnualLeave[], Leave[]

Attendance
├── id
├── userId
├── date
├── checkIn
├── checkOut
├── status
└── relationships: User

AnnualLeave
├── id
├── userId
├── year
├── totalDays
├── usedDays
└── relationships: User

Leave
├── id
├── userId
├── type (ANNUAL/SICK/OTHER)
├── startDate
├── endDate
├── status (PENDING/APPROVED/REJECTED)
├── reason
└── relationships: User
```

#### Database Operations

**Query Pattern:**

```typescript
// Example: Get user with attendance
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    attendance: {
      where: { date: today },
    },
    annualLeave: {
      where: { year: currentYear },
    },
  },
});
```

## 🔄 Data Flow Examples

### Attendance Check-In Flow

```
1. User clicks "Check In" button
   ↓
2. Client component calls API: POST /api/attendance/check-in
   ↓
3. API route verifies session
   ↓
4. Check if already checked in today
   ↓
5. Create/Update attendance record
   ↓
6. Return updated attendance data
   ↓
7. Client updates UI
```

### Leave Request Flow

```
1. User fills leave request form
   ↓
2. Client validates form data (react-hook-form + zod)
   ↓
3. Submit to API: POST /api/leaves
   ↓
4. API validates and checks leave balance
   ↓
5. Create leave request with PENDING status
   ↓
6. Admin receives notification (future feature)
   ↓
7. Admin approves/rejects: PATCH /api/admin/leaves
   ↓
8. Update leave status
   ↓
9. Update annual leave balance (if approved)
   ↓
10. User sees updated status
```

## 🔐 Security Architecture

### Authentication Security

- Password hashing with bcrypt (10 rounds)
- JWT tokens with secure secret
- HTTP-only cookies
- CSRF protection
- Session expiration

### API Security

- Authentication middleware
- Role-based authorization
- Input validation (Zod schemas)
- SQL injection protection (Prisma ORM)
- XSS protection (React escaping)

### Data Security

- Environment variable management
- Database connection encryption (production)
- Sensitive data not in logs
- Secure password storage

## 📊 State Management

### Server State

- Next.js Server Components (default)
- Server Actions for mutations
- Automatic revalidation

### Client State

- React hooks (useState, useReducer)
- Form state (react-hook-form)
- No global state management needed (server-first approach)

### Session State

- NextAuth session provider
- Server-side session validation
- Client-side session access

## 🌐 Internationalization

### Structure

```
messages/
├── en.json          # English translations
└── ko.json          # Korean translations
```

### Implementation

- next-intl for i18n
- Server-side translation
- Client component translation
- URL-based locale switching
- Type-safe translation keys

## 🧪 Testing Architecture

### Unit Tests

- **Framework**: Vitest
- **Location**: Colocated with source files
- **Coverage**: Business logic, utilities

### Integration Tests

- **Framework**: Vitest + React Testing Library
- **Scope**: Component integration, API routes

### E2E Tests

- **Framework**: Playwright
- **Scope**: Critical user flows
- **Environment**: Isolated test database

## 📁 Directory Structure

```
open-attendance/
├── app/                    # Next.js app directory
│   ├── [locale]/          # Internationalized routes
│   │   ├── auth/          # Authentication pages
│   │   └── dashboard/     # Protected dashboard pages
│   ├── api/               # API routes
│   └── generated/         # Generated Prisma client
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── attendance/       # Attendance-specific components
│   ├── leaves/           # Leave-specific components
│   └── layout/           # Layout components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client instance
│   └── utils.ts          # Utility functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── messages/              # i18n translations
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # E2E tests
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

## 🚀 Performance Considerations

### Optimizations

- Server Components by default (reduced JavaScript)
- Static generation where possible
- Database query optimization
- Image optimization (Next.js Image)
- Code splitting (automatic)
- Font optimization

### Caching Strategy

- Next.js automatic caching
- Database query caching (Prisma)
- Static asset caching
- API route caching where appropriate

## 🔮 Future Architecture Considerations

### Planned Improvements

- [ ] Redis for session storage
- [ ] Background job processing (leave notifications)
- [ ] Real-time updates (WebSocket)
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Microservices for scaling

### Scalability

- Horizontal scaling with load balancer
- Database read replicas
- CDN for static assets
- Caching layer (Redis)
- Queue system for async tasks

---

**[⬆ Back to Documentation](README.md)**
