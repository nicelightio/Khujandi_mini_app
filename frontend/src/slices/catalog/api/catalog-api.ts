export type CatalogApi = {
  listShops: () => Promise<[]>;
};

export const createCatalogApi = (): CatalogApi => ({
  listShops: async () => [],
});
