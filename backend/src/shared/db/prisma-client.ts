export interface PrismaClientLike {
  shop: unknown;
  product: unknown;
}

export type PrismaProvider = {
  readonly client: PrismaClientLike;
};

export const createPrismaProvider = (client: PrismaClientLike): PrismaProvider => ({
  client,
});
