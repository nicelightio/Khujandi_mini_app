export type CatalogShop = {
  id: string;
  name: string;
};

export type CatalogProduct = {
  id: string;
  shopId: string;
  name: string;
  priceMinor: number;
};

export type CatalogShopWithProducts = CatalogShop & {
  products: CatalogProduct[];
};

export type CatalogHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

export type CatalogFetch = (input: string) => Promise<CatalogHttpResponse>;

export type CatalogApi = {
  listCatalog: () => Promise<CatalogShopWithProducts[]>;
};

type CatalogApiOptions = {
  baseUrl?: string;
  fetch?: CatalogFetch;
};

const defaultFetch: CatalogFetch = async (input) => {
  const response = await fetch(input);

  return {
    ok: response.ok,
    status: response.status,
    json: async () => response.json(),
  };
};

const ensureObject = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const toCatalogShop = (value: unknown): CatalogShop | null => {
  const record = ensureObject(value);

  if (record === null || typeof record.id !== "string" || typeof record.name !== "string") {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
  };
};

const toCatalogProduct = (value: unknown): CatalogProduct | null => {
  const record = ensureObject(value);

  if (
    record === null ||
    typeof record.id !== "string" ||
    typeof record.shopId !== "string" ||
    typeof record.name !== "string" ||
    typeof record.priceMinor !== "number"
  ) {
    return null;
  }

  return {
    id: record.id,
    shopId: record.shopId,
    name: record.name,
    priceMinor: record.priceMinor,
  };
};

const toCatalogShops = (value: unknown): CatalogShop[] => {
  if (!Array.isArray(value)) {
    throw new Error("Catalog shops response is invalid.");
  }

  return value.map((entry) => {
    const shop = toCatalogShop(entry);

    if (shop === null) {
      throw new Error("Catalog shop payload is invalid.");
    }

    return shop;
  });
};

const toCatalogProducts = (value: unknown): CatalogProduct[] => {
  if (!Array.isArray(value)) {
    throw new Error("Catalog products response is invalid.");
  }

  return value.map((entry) => {
    const product = toCatalogProduct(entry);

    if (product === null) {
      throw new Error("Catalog product payload is invalid.");
    }

    return product;
  });
};

const readJson = async (request: Promise<CatalogHttpResponse>): Promise<unknown> => {
  const response = await request;

  if (!response.ok) {
    throw new Error(`Catalog request failed with status ${response.status}.`);
  }

  return response.json();
};

export const createCatalogApi = (options: CatalogApiOptions = {}): CatalogApi => {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetch ?? defaultFetch;

  return {
    listCatalog: async () => {
      const shops = toCatalogShops(await readJson(fetchImpl(`${baseUrl}/api/v1/shops`)));

      const shopsWithProducts = await Promise.all(
        shops.map(async (shop) => {
          const products = toCatalogProducts(
            await readJson(fetchImpl(`${baseUrl}/api/v1/shops/${encodeURIComponent(shop.id)}/products`)),
          );

          return {
            ...shop,
            products,
          };
        }),
      );

      return shopsWithProducts;
    },
  };
};
