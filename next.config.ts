import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts");
const distDir = process.env.NEXT_DIST_DIR || ".next";

const nextConfig: NextConfig = {
  // Allow E2E tests to use their own build cache (set NEXT_DIST_DIR)
  distDir,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
};

export default withNextIntl(nextConfig);
