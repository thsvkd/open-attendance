/**
 * Next.js Instrumentation
 *
 * This file runs when the Next.js server starts.
 * Used to initialize default CompanyLocation with KR country code.
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeDefaultCompanyLocation } =
      await import("@/lib/init-company-location");
    await initializeDefaultCompanyLocation();
  }
}
