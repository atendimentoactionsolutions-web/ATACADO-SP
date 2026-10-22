import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaWalConfigured: boolean | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (!global.prismaWalConfigured) {
  global.prismaWalConfigured = true;
  prisma
    .$queryRawUnsafe("PRAGMA journal_mode = WAL;")
    .then(() => prisma.$queryRawUnsafe("PRAGMA busy_timeout = 10000;"))
    .then(() => prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;"))
    .catch(() => {});
}

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
