-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "checkInDistance" REAL;
ALTER TABLE "Attendance" ADD COLUMN "checkInLatitude" REAL;
ALTER TABLE "Attendance" ADD COLUMN "checkInLongitude" REAL;
ALTER TABLE "Attendance" ADD COLUMN "checkInWifiBssid" TEXT;
ALTER TABLE "Attendance" ADD COLUMN "checkInWifiSsid" TEXT;
ALTER TABLE "Attendance" ADD COLUMN "checkOutDistance" REAL;
ALTER TABLE "Attendance" ADD COLUMN "checkOutLatitude" REAL;
ALTER TABLE "Attendance" ADD COLUMN "checkOutLongitude" REAL;
ALTER TABLE "Attendance" ADD COLUMN "checkOutWifiBssid" TEXT;
ALTER TABLE "Attendance" ADD COLUMN "checkOutWifiSsid" TEXT;

-- CreateTable
CREATE TABLE "CompanyLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Company Office',
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "radius" REAL NOT NULL DEFAULT 100,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RegisteredWifiNetwork" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyLocationId" TEXT NOT NULL,
    "ssid" TEXT NOT NULL,
    "bssid" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegisteredWifiNetwork_companyLocationId_fkey" FOREIGN KEY ("companyLocationId") REFERENCES "CompanyLocation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "latitude" REAL,
    "longitude" REAL,
    "wifiSsid" TEXT,
    "wifiBssid" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CompanyLocation_isActive_idx" ON "CompanyLocation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredWifiNetwork_companyLocationId_ssid_key" ON "RegisteredWifiNetwork"("companyLocationId", "ssid");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_sessionToken_key" ON "AttendanceSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AttendanceSession_sessionToken_idx" ON "AttendanceSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AttendanceSession_userId_status_idx" ON "AttendanceSession"("userId", "status");

-- CreateIndex
CREATE INDEX "AttendanceSession_expiresAt_idx" ON "AttendanceSession"("expiresAt");
