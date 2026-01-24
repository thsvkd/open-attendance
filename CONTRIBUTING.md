# Contributing to Open Attendance

First off, thank you for considering contributing to Open Attendance! It's people like you that make Open Attendance such a great tool.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, Node version, browser, etc.)

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case and motivation**
- **Possible implementation approach**
- **Alternatives you've considered**

### 🔧 Code Contributions

1. **Find or create an issue** - Make sure there's an issue for your contribution
2. **Fork the repository** - Create your own fork
3. **Create a branch** - Use a descriptive branch name
4. **Make your changes** - Follow our coding standards
5. **Test your changes** - Ensure all tests pass
6. **Submit a pull request** - Reference the issue number

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git

### Setup Steps

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR-USERNAME/open-attendance.git
cd open-attendance
```

2. **Run setup script**

```bash
./scripts/setup.sh
```

This will:

- Install dependencies
- Create `.env.local` file
- Initialize the database

3. **Start development server**

```bash
./scripts/run.sh
```

4. **Open in browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Development Commands

```bash
# Development server
npm run dev

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## Pull Request Process

1. **Update documentation** - Update README.md or other docs if needed
2. **Add/update tests** - Ensure your changes are tested
3. **Run all tests** - Make sure everything passes
4. **Run linter** - Fix any linting issues
5. **Update CHANGELOG** - Add your changes (if applicable)
6. **Create PR** - Provide clear description of changes
7. **Address feedback** - Respond to review comments

### PR Title Format

Use conventional commit format:

```
type(scope): description

Examples:
feat(attendance): add bulk check-in feature
fix(leaves): correct leave balance calculation
docs(readme): update installation instructions
refactor(api): simplify authentication flow
```

## Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** configuration
- Use **Prettier** for formatting
- Write **clear, self-documenting code**
- Add **JSDoc comments** for complex functions

### Code Style

```typescript
// ✅ Good
interface UserLeaveBalance {
  userId: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

// ❌ Bad
interface ULB {
  u: string;
  t: number;
  us: number;
  r: number;
}
```

### File Organization

```
app/              # Next.js app directory
├── api/          # API routes
├── dashboard/    # Dashboard pages
├── auth/         # Authentication pages
components/       # React components
├── ui/           # Reusable UI components
lib/              # Utility functions
hooks/            # Custom React hooks
types/            # TypeScript type definitions
prisma/           # Database schema and migrations
tests/            # Test files
```

### Component Guidelines

- Use **functional components** with hooks
- Keep components **small and focused**
- Extract **reusable logic** into custom hooks
- Use **TypeScript interfaces** for props
- Follow **component naming conventions**

Example:

```typescript
interface LeaveRequestFormProps {
  userId: string;
  onSubmit: (data: LeaveRequest) => void;
}

export function LeaveRequestForm({ userId, onSubmit }: LeaveRequestFormProps) {
  // Component implementation
}
```

## Commit Messages

Follow conventional commit format:

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(leaves): add sick leave approval workflow
fix(attendance): correct timezone handling for check-in
docs(contributing): add code style guidelines
refactor(api): simplify error handling
test(leaves): add unit tests for leave calculation
```

## Testing

### Unit Tests

- Write tests for **all new features**
- Use **Vitest** for unit testing
- Place tests next to source files or in `tests/` directory
- Aim for **high code coverage**

```bash
npm run test
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### E2E Tests

- Write E2E tests for **critical user flows**
- Use **Playwright** for E2E testing
- Place E2E tests in `tests/e2e/` directory

```bash
npm run test:e2e
npm run test:e2e:ui      # UI mode
npm run test:e2e:headed  # Headed mode
```

### Test Guidelines

- **Test behavior, not implementation**
- Use **descriptive test names**
- Follow **Arrange-Act-Assert** pattern
- **Mock external dependencies**
- Keep tests **fast and isolated**

Example:

```typescript
describe("Leave Balance Calculation", () => {
  it("should calculate remaining days correctly", () => {
    // Arrange
    const totalDays = 15;
    const usedDays = 5;

    // Act
    const remaining = calculateRemainingDays(totalDays, usedDays);

    // Assert
    expect(remaining).toBe(10);
  });
});
```

## Database Changes

### Prisma Migrations

When modifying the database schema:

1. **Edit schema** - Update `prisma/schema.prisma`
2. **Create migration** - Run `npx prisma migrate dev --name descriptive_name`
3. **Test migration** - Ensure it works on clean database
4. **Update seed data** - If needed, update seed scripts
5. **Document changes** - Add comments in schema file

## Documentation

- Update **README.md** for user-facing changes
- Update **code comments** for developer-facing changes
- Add **JSDoc** for public APIs
- Include **examples** where helpful
- Keep documentation **up-to-date**

## Questions?

Feel free to:

- 💬 Open a **Discussion** on GitHub
- 🐛 Create an **Issue** for bugs
- 💡 Suggest **Enhancements** via issues
- 📧 Contact maintainers (see README.md)

---

Thank you for contributing to Open Attendance! 🎉
