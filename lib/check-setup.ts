import { db } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Check if initial setup is required (no users exist)
 * Redirects to /setup if no users exist
 */
export async function requireSetupComplete() {
  const userCount = await db.user.count();

  if (userCount === 0) {
    redirect("/setup");
  }
}

/**
 * Check if setup page should be accessible
 * Redirects to /login if users already exist
 */
export async function requireSetupNeeded() {
  const userCount = await db.user.count();

  if (userCount > 0) {
    redirect("/login");
  }
}

/**
 * Get user count without redirecting
 */
export async function getUserCount() {
  return await db.user.count();
}
