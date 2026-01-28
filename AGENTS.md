# AI Agents Development Guide

## Project Overview

This is an open-source project for attendance and annual leave management. It provides an integrated system for systematically managing and analyzing employee attendance, time off, and vacation.

## Feature Requirements

### Employee Attendance/Check-out Management

- By default, assume attendance on all dates except legal holidays and company-designated holidays
- If actual attendance is not made, record it as absent with a reason

### Annual Leave, Vacation, and Sick Leave Management

- Annual leave balance management
- Leave request and approval workflow
  - Implement leave and sick leave requests via Slack
- Special leave handling (sick leave, family events leave, etc.)
- Leave usage tracking
- Annual leave initialization and carryover policy management
- Reflect Korean public holidays and apply Korean annual leave laws
  - Implement choice between hire date basis or fiscal year basis

### Attendance and Leave Usage Analysis and Reporting

- Monthly/quarterly/annual attendance and leave usage reports

### User Account and Permission Management

- Login and account creation
- Role-based permissions management
  - Administrator: Full access to all features
  - Regular user: Access only to their own attendance and leave information

## Development Guidelines

- Utilize vercel-react-best-practices skills
- Write code that is easy for human developers to modify later
  - Add sufficient comments to understand the code
  - Reduce code duplication and modularize
  - Follow code style guidelines
- After implementing features and feedback, follow these steps:
  - Formatting
  - Linting
  - Testing
  - Commit
- When adding new features, update related documents (README.md, AGENTS.md, etc.) and add test code
- Follow standard commit message conventions
- all commit messages should be in English
- When committing, use the -s option to create a signed commit
  - The `-s` option automatically adds a "Signed-off-by" line using the name and email currently set in git config
  - Do NOT add "Co-Authored-By" lines to commit messages
  - Example commit command: `git commit -s -m "feat: description"`
