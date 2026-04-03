export type TestContext<TPrismaClient> = {
  prisma: TPrismaClient;
};

export const createTestContext = <TPrismaClient>(prisma: TPrismaClient): TestContext<TPrismaClient> => ({
  prisma,
});
