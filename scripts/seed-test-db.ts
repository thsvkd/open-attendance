/**
 * Seed script for E2E test database
 *
 * This script MUST remain as TypeScript because:
 * - Uses Prisma Client for type-safe database operations
 * - Requires bcryptjs for password hashing
 * - TypeScript provides type safety for database models
 *
 * Creates a test user to bypass the initial setup requirement
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test database...");

  // Ensure default CompanyLocation exists with KR country
  const existingLocation = await prisma.companyLocation.findFirst({
    where: { isActive: true },
  });

  if (!existingLocation) {
    await prisma.companyLocation.create({
      data: {
        name: "Default Office",
        latitude: 37.5665, // Seoul coordinates
        longitude: 126.978,
        radius: 100,
        country: "KR",
        isActive: true,
      },
    });
    console.log("Created default CompanyLocation with country: KR");
  }

  // Check if users already exist
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(
      `Database already has ${existingUsers} user(s). Skipping seed.`,
    );
    return;
  }

  // Create a test admin user
  const hashedPassword = await bcrypt.hash("test-password-123", 10);

  const testUser = await prisma.user.create({
    data: {
      name: "Test Admin",
      email: "admin@test.com",
      password: hashedPassword,
      role: "ADMIN",
      joinDate: new Date("2024-01-01"),
      totalLeaves: 15,
      usedLeaves: 0,
    },
  });

  console.log(`Created test user: ${testUser.email} (ID: ${testUser.id})`);
  console.log("Test database seeded successfully!");
}

main()
  .catch((error) => {
    console.error("Error seeding test database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
