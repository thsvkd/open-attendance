/**
 * Initialize default CompanyLocation
 *
 * Creates a default CompanyLocation record if none exists.
 * This ensures that holiday calculation works from the first app launch.
 * Uses a fixed ID and upsert for idempotency in multi-instance deployments.
 */

import { db } from "@/lib/db";

const DEFAULT_COUNTRY = "KR";
const DEFAULT_LOCATION_ID = "default-company-location";

export async function initializeDefaultCompanyLocation(): Promise<void> {
  try {
    // Check if any active CompanyLocation exists
    const activeLocationCount = await db.companyLocation.count({
      where: { isActive: true },
    });

    // Only proceed if no active location exists
    if (activeLocationCount === 0) {
      // Use upsert with fixed ID for idempotency
      await db.companyLocation.upsert({
        where: { id: DEFAULT_LOCATION_ID },
        create: {
          id: DEFAULT_LOCATION_ID,
          name: "Default Office",
          latitude: 37.5665, // Seoul coordinates
          longitude: 126.978,
          radius: 100,
          country: DEFAULT_COUNTRY,
          isActive: true,
        },
        update: {
          isActive: true,
        },
      });
      console.log(
        `[INIT] Initialized default CompanyLocation with country: ${DEFAULT_COUNTRY}`,
      );
    }

    // Only enforce single-active invariant if multiple active locations detected
    if (activeLocationCount > 1) {
      const firstActive = await db.companyLocation.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });

      if (firstActive) {
        await db.companyLocation.updateMany({
          where: {
            id: { not: firstActive.id },
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
        console.log(
          `[INIT] Deactivated duplicate active locations, kept: ${firstActive.id}`,
        );
      }
    }
  } catch (error) {
    // Log but don't throw - app should still work even if init fails
    console.error("[INIT] Failed to initialize CompanyLocation:", error);
  }
}
