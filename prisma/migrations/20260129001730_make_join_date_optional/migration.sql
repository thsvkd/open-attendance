-- AlterTable
ALTER TABLE "User" ALTER COLUMN "joinDate" DROP NOT NULL;

-- Update default values
UPDATE "User" SET "totalLeaves" = 0 WHERE "joinDate" IS NULL;
