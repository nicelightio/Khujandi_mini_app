import type { PrismaClientLike } from "../db/prisma-client";

export type TestContext = {
  prisma: PrismaClientLike;
};

export const createTestContext = (prisma: PrismaClientLike): TestContext => ({
  prisma,
});
