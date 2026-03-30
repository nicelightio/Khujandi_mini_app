export type CatalogViewModel = {
  headline: string;
  statusLabel: string;
};

export const createCatalogViewModel = (): CatalogViewModel => ({
  headline: "Public catalog route shell",
  statusLabel: "Catalog data wiring lands in TASK-FT001-07.",
});
