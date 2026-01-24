/**
 * Seed script for E2E test database
 * Creates a test user to bypass the initial setup requirement
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test database...");

  // Check if users already exist
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(`Database already has ${existingUsers} user(s). Skipping seed.`);
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
