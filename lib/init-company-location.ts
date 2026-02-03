/**
 * Initialize default CompanyLocation
 *
 * Creates a default CompanyLocation record if none exists.
 * This ensures that holiday calculation works from the first app launch.
 */

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type TransactionClient = Prisma.TransactionClient;

const DEFAULT_COUNTRY = "KR";

export async function initializeDefaultCompanyLocation(): Promise<void> {
  try {
    await db.$transaction(async (tx: TransactionClient) => {
      // Check if any active CompanyLocation exists within the transaction
      let activeLocation = await tx.companyLocation.findFirst({
        where: { isActive: true },
      });

      if (!activeLocation) {
        // Create default CompanyLocation with Korean country code
        activeLocation = await tx.companyLocation.create({
          data: {
            name: "Default Office",
            latitude: 37.5665, // Seoul coordinates
            longitude: 126.978,
            radius: 100,
            country: DEFAULT_COUNTRY,
            isActive: true,
          },
        });
        console.log(
          `[INIT] Created default CompanyLocation with country: ${DEFAULT_COUNTRY}`,
        );
      }

      // Enforce single-active invariant by deactivating all other locations
      await tx.companyLocation.updateMany({
        where: {
          id: { not: activeLocation.id },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    });
  } catch (error) {
    // Log but don't throw - app should still work even if init fails
    console.error("[INIT] Failed to initialize CompanyLocation:", error);
  }
}
