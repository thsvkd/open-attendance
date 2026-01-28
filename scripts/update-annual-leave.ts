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

    for (const user of users) {
      const calculatedLeave = calculateAnnualLeave(user.joinDate, currentDate);

      if (calculatedLeave !== user.totalLeaves) {
        await db.user.update({
          where: { id: user.id },
          data: { totalLeaves: calculatedLeave },
        });

        console.log(
          `✅ Updated: ${user.name || user.email} | ` +
            `Old: ${user.totalLeaves} days → New: ${calculatedLeave} days | ` +
            `Join Date: ${user.joinDate.toISOString().split("T")[0]}`,
        );
        updatedCount++;
      } else {
        console.log(
          `✓  No change: ${user.name || user.email} | ` +
            `${user.totalLeaves} days | ` +
            `Join Date: ${user.joinDate.toISOString().split("T")[0]}`,
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
