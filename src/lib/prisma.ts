import { Prisma, PrismaClient } from "@prisma/client";

const TRANSIENT_PRISMA_CODES = new Set(["P1001", "P1017"]);
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createPrismaClient() {
  const client = new PrismaClient();

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, model, operation }) {
          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
              return await query(args);
            } catch (error) {
              const code =
                error instanceof Prisma.PrismaClientKnownRequestError
                  ? error.code
                  : null;

              const isRetryable =
                code !== null && TRANSIENT_PRISMA_CODES.has(code);
              const isLastAttempt = attempt === MAX_RETRIES;

              if (!isRetryable || isLastAttempt) {
                throw error;
              }

              const waitMs = 150 * (attempt + 1);
              console.warn(
                `[PrismaRetry] ${model}.${operation} failed with ${code}. Retrying in ${waitMs}ms...`,
              );
              await sleep(waitMs);
            }
          }
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
