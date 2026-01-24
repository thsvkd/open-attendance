#!/usr/bin/env node

/**
 * E2E 테스트용 test.db 초기화 스크립트
 * - 기존 test.db를 삭제하고 빈 스키마로 새로 생성
 * - webServer 시작 전에 실행되어야 함
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(PROJECT_ROOT, 'prisma', 'test.db');
const SCHEMA_SQL_PATH = path.join(PROJECT_ROOT, 'prisma', 'schema.sql');

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "joinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalLeaves" REAL NOT NULL DEFAULT 15,
    "usedLeaves" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "checkIn" DATETIME,
    "checkOut" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ANNUAL',
    "leaveType" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "days" REAL NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "rejectedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_userId_date_key" ON "Attendance"("userId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "Holiday_date_key" ON "Holiday"("date");
`;

// Remove existing test.db
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Removed existing test.db');
}

// Write schema SQL to temp file and execute
fs.writeFileSync(SCHEMA_SQL_PATH, SCHEMA_SQL);

try {
  execSync(`sqlite3 "${DB_PATH}" < "${SCHEMA_SQL_PATH}"`, {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
    shell: '/bin/bash',
  });
  console.log('test.db initialized with empty schema.');
} finally {
  fs.unlinkSync(SCHEMA_SQL_PATH);
}
