# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial public release of Open Attendance
- Comprehensive documentation structure
  - CONTRIBUTING.md - Contribution guidelines
  - SECURITY.md - Security policy and best practices
  - docs/DEPLOYMENT.md - Production deployment guide
  - docs/ARCHITECTURE.md - System architecture overview
  - docs/README.md - Documentation index
- Enhanced .gitignore for better security
- MIT License

### Changed
- Reorganized documentation into docs/ folder
- Updated README files with documentation references
- Formatted all code files with Prettier
- Improved code consistency with ESLint

## [0.1.0] - 2026-01-24

### Added
- **Core Features**
  - User authentication with NextAuth.js
  - Attendance management (check-in/check-out)
  - Annual leave tracking
  - Leave request workflow
  - Admin dashboard for user and leave management
  - User dashboard for personal attendance and leave data

- **Technical Features**
  - Next.js 16 with App Router
  - React 19 with Server Components
  - TypeScript for type safety
  - Prisma ORM for database management
  - Internationalization (Korean/English)
  - Dark mode support
  - Responsive design
  - Comprehensive test suite (unit, integration, E2E)

- **Documentation**
  - README with quick start guide
  - Korean README (README.ko.md)
  - Testing documentation
  - Test setup guide
  - AI agents development guide

### Security
- Environment variable management
- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- SQL injection protection with Prisma ORM
- XSS protection with React escaping

[Unreleased]: https://github.com/thsvkd/open-attendance/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/thsvkd/open-attendance/releases/tag/v0.1.0
