export type EventRecord = {
  id: bigint;
  type: string;
  entity: string;
  entityId: string;
  payload: unknown;
  createdAt: Date;
};

export type PrismaProvider<TClient> = {
  readonly client: TClient;
};

export const createPrismaProvider = <TClient>(client: TClient): PrismaProvider<TClient> => ({
  client,
});
