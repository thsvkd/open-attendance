import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Prisma CLI resolves "file:./" relative to the prisma/ directory (where schema.prisma lives),
// but better-sqlite3 resolves relative to cwd. Convert to absolute path to match CLI behavior.
function resolvePrismaFileUrl(url: string): string {
  if (!url.startsWith("file:./")) return url;
  const relPath = url.slice("file:./".length);
  return `file:${path.resolve("prisma", relPath)}`;
}

const adapter = new PrismaBetterSqlite3({
  url: resolvePrismaFileUrl(process.env.DATABASE_URL || "file:./dev.db"),
});

export const db = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") global.prisma = db;
