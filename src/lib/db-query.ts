import { prisma } from "@/lib/prisma";

/** Match transient Postgres / Prisma connection failures common on campus Wi‑Fi. */
const RETRYABLE =
  /connect|connection|timeout|ECONNREFUSED|Can't reach database|P1001|P1017/i;

/**
 * Wrap read-heavy Prisma calls with bounded retries + reconnect.
 * Feed and map pages hit the DB on every filter change; a single blip
 * should not blank the UI during a hackathon demo.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 2,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!RETRYABLE.test(message) || attempt === retries) break;
      await prisma.$connect();
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  }

  throw lastError;
}
