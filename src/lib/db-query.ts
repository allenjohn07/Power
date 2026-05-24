import { prisma } from "@/lib/prisma";

const RETRYABLE =
  /connect|connection|timeout|ECONNREFUSED|Can't reach database|P1001|P1017/i;

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
