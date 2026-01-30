-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "joinDate" DATETIME,
    "totalLeaves" REAL NOT NULL DEFAULT 0,
    "usedLeaves" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "name", "email", "emailVerified", "image", "password", "role", "joinDate", "totalLeaves", "usedLeaves", "createdAt", "updatedAt") SELECT "id", "name", "email", "emailVerified", "image", "password", "role", "joinDate", "totalLeaves", "usedLeaves", "createdAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- Update default values
UPDATE "User" SET "totalLeaves" = 0 WHERE "joinDate" IS NULL;
