import path from "node:path";
import { PrismaClient } from "../prisma/generated/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * Resolve file: URLs to an absolute path so SQLite stays stable
 * regardless of how PM2 / npm sets the process cwd.
 */
function resolveDatabaseUrl(url: string): string {
  if (!url.startsWith("file:")) {
    return url;
  }

  let filePath = url.slice("file:".length);
  if (filePath.startsWith("///")) {
    filePath = filePath.slice(2);
  } else if (filePath.startsWith("//")) {
    filePath = filePath.slice(1);
  }

  const absolute =
    path.isAbsolute(filePath) || /^[A-Za-z]:[\\/]/.test(filePath)
      ? path.normalize(filePath)
      : path.resolve(process.cwd(), filePath);

  return `file:${absolute.replace(/\\/g, "/")}`;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(process.env.DATABASE_URL!),
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;
