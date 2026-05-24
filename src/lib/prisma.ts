import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function isUsableClient(client: PrismaClient | undefined): client is PrismaClient {
  return typeof client?.user?.findUnique === "function";
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (isUsableClient(cached)) return cached;

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

/**
 * Proxy ensures dev hot-reload picks up new Prisma models after `db push`.
 * Next.js invalidates modules often; a stale singleton missing new delegates
 * was a real footgun during schema iteration.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
