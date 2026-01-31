/**
 * Initialize default CompanyLocation
 *
 * Creates a default CompanyLocation record if none exists.
 * This ensures that holiday calculation works from the first app launch.
 */

import { db } from "@/lib/db";

const DEFAULT_COUNTRY = "KR";

export async function initializeDefaultCompanyLocation(): Promise<void> {
  try {
    // Check if any active CompanyLocation exists
    const existingLocation = await db.companyLocation.findFirst({
      where: { isActive: true },
    });

    if (!existingLocation) {
      // Create default CompanyLocation with Korean country code
      await db.companyLocation.create({
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
  } catch (error) {
    // Log but don't throw - app should still work even if init fails
    console.error("[INIT] Failed to initialize CompanyLocation:", error);
  }
}
