/**
 * Script to update annual leave balances for all users.
 * This recalculates annual leave based on join date according to Korean labor law.
 *
 * Usage:
 *   npm run db:update-annual-leave
 *   or
 *   npx tsx scripts/update-annual-leave.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { calculateAnnualLeave } from "../lib/annual-leave-calculator";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const db = new PrismaClient();

async function main() {
  console.log("🔄 Starting annual leave balance update...\n");

  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        joinDate: true,
        totalLeaves: true,
      },
    });

    console.log(`Found ${users.length} user(s) to process\n`);

    const currentDate = new Date();
    let updatedCount = 0;
    let unchangedCount = 0;

    // Prepare updates and collect info
    const updateData: Array<{
      user: (typeof users)[0];
      calculatedLeave: number;
      needsUpdate: boolean;
    }> = [];

    for (const user of users) {
      const calculatedLeave = calculateAnnualLeave(user.joinDate, currentDate);
      updateData.push({
        user,
        calculatedLeave,
        needsUpdate: calculatedLeave !== user.totalLeaves,
      });
    }

    // Execute all updates in parallel
    await Promise.all(
      updateData
        .filter((data) => data.needsUpdate)
        .map((data) =>
          db.user.update({
            where: { id: data.user.id },
            data: { totalLeaves: data.calculatedLeave },
          }),
        ),
    );

    // Log results
    for (const data of updateData) {
      if (data.needsUpdate) {
        console.log(
          `✅ Updated: ${data.user.name || data.user.email} | ` +
            `Old: ${data.user.totalLeaves} days → New: ${data.calculatedLeave} days | ` +
            `Join Date: ${data.user.joinDate!.toISOString().split("T")[0]}`,
        );
        updatedCount++;
      } else {
        console.log(
          `✓  No change: ${data.user.name || data.user.email} | ` +
            `${data.user.totalLeaves} days | ` +
            `Join Date: ${data.user.joinDate!.toISOString().split("T")[0]}`,
        );
        unchangedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total users: ${users.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Unchanged: ${unchangedCount}`);
    console.log(`\n✨ Annual leave balance update completed successfully!`);
  } catch (error) {
    console.error("❌ Error updating annual leave balances:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
