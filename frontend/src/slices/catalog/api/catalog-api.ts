export type CatalogShop = {
  id: string;
  name: string;
  publicPath: string;
};

export type CatalogProduct = {
  id: string;
  shopId: string;
  name: string;
  priceMinor: number;
};

export type CatalogShowcaseFavoriteShop = {
  id: string;
  name: string;
  publicPath: string;
  description: string | null;
  headerImageUrl: string | null;
};

export type CatalogShowcaseProduct = {
  id: string;
  productId: string;
  shopId: string;
  shopPublicPath: string;
  shopName: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceMinor: number;
  currency: string;
  sortOrder: number | null;
};

export type CatalogStartShowcase = {
  favoriteShops: CatalogShowcaseFavoriteShop[];
  allKhujandLink: {
    label: string;
    target: string;
  };
  popularTodayProducts: CatalogShowcaseProduct[];
};

export type CatalogShowcaseAdminState = {
  canCurate: boolean;
};

export type SellerStorefrontAccess = {
  id: string;
  publicPath: string;
  sellerId: string;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  backgroundImageUrl: string | null;
  status: "WORKING" | "NOT_WORKING";
  renameCount: number;
  requiresManualRenameReview: boolean;
  menuPages: SellerStorefrontMenuPage[];
  unpagedProducts: SellerStorefrontProduct[];
};

export type PublicStorefront = {
  shop: {
    id: string;
    publicPath: string;
    name: string;
    description: string | null;
    headerImageUrl: string | null;
    backgroundImageUrl: string | null;
  };
  menuPages: PublicStorefrontMenuPage[];
  unpagedProducts: PublicStorefrontProduct[];
};

export type PublicStorefrontProduct = {
  id: string;
  shopId: string;
  menuPageId: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceMinor: number;
};

export type PublicStorefrontMenuPage = {
  id: string;
  shopId: string;
  name: string;
  position: number;
  products: PublicStorefrontProduct[];
};

export type SellerStorefrontProduct = {
  id: string;
  shopId: string;
  menuPageId: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceMinor: number;
};

export type SellerStorefrontMenuPage = {
  id: string;
  shopId: string;
  name: string;
  position: number;
  products: SellerStorefrontProduct[];
};

export type UpdateSellerShopRequest = {
  shopId: string;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  backgroundImageUrl: string | null;
};

export type CreateSellerMenuPageRequest = {
  shopId: string;
  name: string;
  position: number;
};

export type UpdateSellerMenuPageRequest = {
  menuPageId: string;
  shopId: string;
  name: string;
};

export type CreateSellerProductRequest = {
  shopId: string;
  menuPageId: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceMinor: number;
};

export type UpdateSellerProductRequest = CreateSellerProductRequest & {
  productId: string;
};

export type CatalogShopWithProducts = CatalogShop & {
  products: CatalogProduct[];
};

export type CatalogHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

export type CatalogFetch = (input: string, init?: RequestInit) => Promise<CatalogHttpResponse>;

export type CatalogApi = {
  getStartShowcase: () => Promise<CatalogStartShowcase>;
  getShowcaseAdminState: () => Promise<CatalogShowcaseAdminState>;
  addShowcaseProduct: (productId: string) => Promise<void>;
  removeShowcaseProduct: (productId: string) => Promise<void>;
  addShowcaseShop: (shopId: string) => Promise<void>;
  removeShowcaseShop: (shopId: string) => Promise<void>;
  listCatalog: () => Promise<CatalogShopWithProducts[]>;
  getPublicStorefront: (publicPath: string) => Promise<PublicStorefront | null>;
  getSellerStorefrontAccess: (shopId: string) => Promise<SellerStorefrontAccess | null>;
  updateSellerShop: (input: UpdateSellerShopRequest) => Promise<void>;
  createSellerMenuPage: (input: CreateSellerMenuPageRequest) => Promise<void>;
  updateSellerMenuPage: (input: UpdateSellerMenuPageRequest) => Promise<void>;
  createSellerProduct: (input: CreateSellerProductRequest) => Promise<void>;
  updateSellerProduct: (input: UpdateSellerProductRequest) => Promise<void>;
};

type CatalogApiOptions = {
  baseUrl?: string;
  fetch?: CatalogFetch;
};

const defaultFetch: CatalogFetch = async (input, init) => {
  const response = await fetch(input, init);

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

const mapValidArray = <T>(value: unknown, mapper: (entry: unknown) => T | null): T[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.map((entry) => mapper(entry));

  if (items.some((entry) => entry === null)) {
    return null;
  }

  return items as T[];
};

const toCatalogShop = (value: unknown): CatalogShop | null => {
  const record = ensureObject(value);

  if (
    record === null ||
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.publicPath !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    publicPath: record.publicPath,
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

const nullableString = (value: unknown): string | null | undefined => {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
};

const toCatalogShowcaseFavoriteShop = (value: unknown): CatalogShowcaseFavoriteShop | null => {
  const record = ensureObject(value);
  const description = nullableString(record?.description);
  const headerImageUrl = nullableString(record?.headerImageUrl ?? record?.imageUrl);

  if (
    record === null ||
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.publicPath !== "string" ||
    description === undefined ||
    headerImageUrl === undefined
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    publicPath: record.publicPath,
    description,
    headerImageUrl,
  };
};

const readPriceMinor = (record: Record<string, unknown>): number | null => {
  if (typeof record.priceMinor === "number") {
    return record.priceMinor;
  }

  if (typeof record.price === "number") {
    return record.price;
  }

  return null;
};

const toCatalogShowcaseProduct = (value: unknown): CatalogShowcaseProduct | null => {
  const record = ensureObject(value);
  const productId = typeof record?.productId === "string" ? record.productId : record?.id;
  const description = nullableString(record?.description);
  const imageUrl = nullableString(record?.imageUrl ?? record?.media);
  const priceMinor = record === null ? null : readPriceMinor(record);
  const sortOrder = record?.sortOrder === null || record?.sortOrder === undefined ? null : record.sortOrder;

  if (
    record === null ||
    typeof record.id !== "string" ||
    typeof productId !== "string" ||
    typeof record.shopId !== "string" ||
    typeof record.shopPublicPath !== "string" ||
    typeof record.shopName !== "string" ||
    typeof record.name !== "string" ||
    description === undefined ||
    imageUrl === undefined ||
    priceMinor === null ||
    (record.currency !== undefined && typeof record.currency !== "string") ||
    (sortOrder !== null && typeof sortOrder !== "number")
  ) {
    return null;
  }

  return {
    id: record.id,
    productId,
    shopId: record.shopId,
    shopPublicPath: record.shopPublicPath,
    shopName: record.shopName,
    name: record.name,
    description,
    imageUrl,
    priceMinor,
    currency: record.currency ?? "TJS",
    sortOrder,
  };
};

const toCatalogStartShowcase = (value: unknown): CatalogStartShowcase | null => {
  const record = ensureObject(value);
  const favoriteShops = mapValidArray(record?.favoriteShops, toCatalogShowcaseFavoriteShop);
  const popularTodayProducts = mapValidArray(record?.popularTodayProducts, toCatalogShowcaseProduct);
  const allKhujandLink = ensureObject(record?.allKhujandLink);

  if (
    record === null ||
    favoriteShops === null ||
    popularTodayProducts === null ||
    (allKhujandLink !== null &&
      ((allKhujandLink.label !== undefined && typeof allKhujandLink.label !== "string") ||
        (allKhujandLink.target !== undefined && typeof allKhujandLink.target !== "string")))
  ) {
    return null;
  }

  return {
    favoriteShops: favoriteShops.slice(0, 3),
    allKhujandLink: {
      label: typeof allKhujandLink?.label === "string" ? allKhujandLink.label : "весь Худжанд",
      target: typeof allKhujandLink?.target === "string" ? allKhujandLink.target : "/shops",
    },
    popularTodayProducts,
  };
};

const toCatalogShowcaseAdminState = (value: unknown): CatalogShowcaseAdminState | null => {
  const record = ensureObject(value);

  if (record === null || typeof record.canCurate !== "boolean") {
    return null;
  }

  return {
    canCurate: record.canCurate,
  };
};

const toSellerStorefrontAccess = (value: unknown): SellerStorefrontAccess | null => {
  const record = ensureObject(value);
  const menuPages = toSellerStorefrontMenuPages(record?.menuPages);
  const unpagedProducts = toSellerStorefrontProducts(record?.unpagedProducts);

  if (
    record === null ||
    typeof record.id !== "string" ||
    typeof record.publicPath !== "string" ||
    typeof record.sellerId !== "string" ||
    typeof record.name !== "string" ||
    (record.description !== null && typeof record.description !== "string") ||
    (record.headerImageUrl !== null && typeof record.headerImageUrl !== "string") ||
    (record.backgroundImageUrl !== null && typeof record.backgroundImageUrl !== "string") ||
    (record.status !== "WORKING" && record.status !== "NOT_WORKING") ||
    typeof record.renameCount !== "number" ||
    typeof record.requiresManualRenameReview !== "boolean" ||
    menuPages === null ||
    unpagedProducts === null
  ) {
    return null;
  }

  return {
    id: record.id,
    publicPath: record.publicPath,
    sellerId: record.sellerId,
    name: record.name,
    description: record.description,
    headerImageUrl: record.headerImageUrl,
    backgroundImageUrl: record.backgroundImageUrl,
    status: record.status,
    renameCount: record.renameCount,
    requiresManualRenameReview: record.requiresManualRenameReview,
    menuPages,
    unpagedProducts,
  };
};

const toPublicStorefront = (value: unknown): PublicStorefront | null => {
  const record = ensureObject(value);
  const shopRecord = ensureObject(record?.shop);
  const menuPages = toPublicStorefrontMenuPages(record?.menuPages);
  const unpagedProducts = toPublicStorefrontProducts(record?.unpagedProducts);

  if (
    record === null ||
    shopRecord === null ||
    typeof shopRecord.id !== "string" ||
    typeof shopRecord.publicPath !== "string" ||
    typeof shopRecord.name !== "string" ||
    (shopRecord.description !== null && typeof shopRecord.description !== "string") ||
    (shopRecord.headerImageUrl !== null && typeof shopRecord.headerImageUrl !== "string") ||
    (shopRecord.backgroundImageUrl !== null && typeof shopRecord.backgroundImageUrl !== "string") ||
    menuPages === null ||
    unpagedProducts === null
  ) {
    return null;
  }

  return {
    shop: {
      id: shopRecord.id,
      publicPath: shopRecord.publicPath,
      name: shopRecord.name,
      description: shopRecord.description,
      headerImageUrl: shopRecord.headerImageUrl,
      backgroundImageUrl: shopRecord.backgroundImageUrl,
    },
    menuPages,
    unpagedProducts,
  };
};

const toSellerStorefrontProduct = (value: unknown): SellerStorefrontProduct | null => {
  const record = ensureObject(value);

  if (
    record === null ||
    typeof record.id !== "string" ||
    typeof record.shopId !== "string" ||
    (record.menuPageId !== null && typeof record.menuPageId !== "string") ||
    typeof record.name !== "string" ||
    (record.description !== null && typeof record.description !== "string") ||
    (record.imageUrl !== null && typeof record.imageUrl !== "string") ||
    typeof record.priceMinor !== "number"
  ) {
    return null;
  }

  return {
    id: record.id,
    shopId: record.shopId,
    menuPageId: record.menuPageId,
    name: record.name,
    description: record.description,
    imageUrl: record.imageUrl,
    priceMinor: record.priceMinor,
  };
};

const toPublicStorefrontProduct = (value: unknown): PublicStorefrontProduct | null => {
  const record = ensureObject(value);

  if (
    record === null ||
    typeof record.id !== "string" ||
    typeof record.shopId !== "string" ||
    (record.menuPageId !== null && typeof record.menuPageId !== "string") ||
    typeof record.name !== "string" ||
    (record.description !== null && typeof record.description !== "string") ||
    (record.imageUrl !== null && typeof record.imageUrl !== "string") ||
    typeof record.priceMinor !== "number"
  ) {
    return null;
  }

  return {
    id: record.id,
    shopId: record.shopId,
    menuPageId: record.menuPageId,
    name: record.name,
    description: record.description,
    imageUrl: record.imageUrl,
    priceMinor: record.priceMinor,
  };
};

const toSellerStorefrontMenuPage = (value: unknown): SellerStorefrontMenuPage | null => {
  const record = ensureObject(value);

  if (
    record === null ||
    typeof record.id !== "string" ||
    typeof record.shopId !== "string" ||
    typeof record.name !== "string" ||
    typeof record.position !== "number" ||
    !Array.isArray(record.products)
  ) {
    return null;
  }

  const products = mapValidArray(record.products, toSellerStorefrontProduct);

  if (products === null) {
    return null;
  }

  return {
    id: record.id,
    shopId: record.shopId,
    name: record.name,
    position: record.position,
    products,
  };
};

const toPublicStorefrontMenuPage = (value: unknown): PublicStorefrontMenuPage | null => {
  const record = ensureObject(value);

  if (
    record === null ||
    typeof record.id !== "string" ||
    typeof record.shopId !== "string" ||
    typeof record.name !== "string" ||
    typeof record.position !== "number" ||
    !Array.isArray(record.products)
  ) {
    return null;
  }

  const products = mapValidArray(record.products, toPublicStorefrontProduct);

  if (products === null) {
    return null;
  }

  return {
    id: record.id,
    shopId: record.shopId,
    name: record.name,
    position: record.position,
    products,
  };
};

const toSellerStorefrontMenuPages = (value: unknown): SellerStorefrontMenuPage[] | null => {
  return mapValidArray(value, toSellerStorefrontMenuPage);
};

const toSellerStorefrontProducts = (value: unknown): SellerStorefrontProduct[] | null => {
  return mapValidArray(value, toSellerStorefrontProduct);
};

const toPublicStorefrontMenuPages = (value: unknown): PublicStorefrontMenuPage[] | null => {
  return mapValidArray(value, toPublicStorefrontMenuPage);
};

const toPublicStorefrontProducts = (value: unknown): PublicStorefrontProduct[] | null => {
  return mapValidArray(value, toPublicStorefrontProduct);
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

const requestJson = async (request: Promise<CatalogHttpResponse>): Promise<void> => {
  const response = await request;

  if (!response.ok) {
    throw new Error(`Catalog request failed with status ${response.status}.`);
  }
};

export const createCatalogApi = (options: CatalogApiOptions = {}): CatalogApi => {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetch ?? defaultFetch;

  return {
    getStartShowcase: async () => {
      const showcase = toCatalogStartShowcase(await readJson(fetchImpl(`${baseUrl}/api/v1/showcase`)));

      if (showcase === null) {
        throw new Error("Catalog showcase payload is invalid.");
      }

      return showcase;
    },
    getShowcaseAdminState: async () => {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/catalog/showcase`, {
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403 || response.status === 404) {
        return { canCurate: false };
      }

      if (!response.ok) {
        throw new Error(`Catalog request failed with status ${response.status}.`);
      }

      const state = toCatalogShowcaseAdminState(await response.json());

      if (state === null) {
        throw new Error("Catalog showcase admin payload is invalid.");
      }

      return state;
    },
    addShowcaseProduct: async (productId) => {
      await requestJson(
        fetchImpl(`${baseUrl}/api/v1/admin/catalog/showcase/products/${encodeURIComponent(productId)}`, {
          method: "POST",
          credentials: "include",
        }),
      );
    },
    removeShowcaseProduct: async (productId) => {
      await requestJson(
        fetchImpl(`${baseUrl}/api/v1/admin/catalog/showcase/products/${encodeURIComponent(productId)}`, {
          method: "DELETE",
          credentials: "include",
        }),
      );
    },
    addShowcaseShop: async (shopId) => {
      await requestJson(
        fetchImpl(`${baseUrl}/api/v1/admin/catalog/showcase/shops/${encodeURIComponent(shopId)}`, {
          method: "POST",
          credentials: "include",
        }),
      );
    },
    removeShowcaseShop: async (shopId) => {
      await requestJson(
        fetchImpl(`${baseUrl}/api/v1/admin/catalog/showcase/shops/${encodeURIComponent(shopId)}`, {
          method: "DELETE",
          credentials: "include",
        }),
      );
    },
    listCatalog: async () => {
      const shops = toCatalogShops(await readJson(fetchImpl(`${baseUrl}/api/v1/shops`)));

      const shopsWithProducts = await Promise.all(
        shops.map(async (shop) => {
          const products = toCatalogProducts(
            await readJson(fetchImpl(`${baseUrl}/api/v1/shops/${encodeURIComponent(shop.publicPath)}/products`)),
          );

          return {
            ...shop,
            products,
          };
        }),
      );

      return shopsWithProducts;
    },
    getPublicStorefront: async (publicPath) => {
      const response = await fetchImpl(`${baseUrl}/api/v1/shops/${encodeURIComponent(publicPath)}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Catalog request failed with status ${response.status}.`);
      }

      const publicStorefront = toPublicStorefront(await response.json());

      if (publicStorefront === null) {
        throw new Error("Public storefront payload is invalid.");
      }

      return publicStorefront;
    },
    getSellerStorefrontAccess: async (publicPath) => {
      const response = await fetchImpl(`${baseUrl}/api/v1/seller/shops/${encodeURIComponent(publicPath)}`, {
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403 || response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Catalog request failed with status ${response.status}.`);
      }

      const sellerStorefrontAccess = toSellerStorefrontAccess(await response.json());

      if (sellerStorefrontAccess === null) {
        throw new Error("Seller storefront access payload is invalid.");
      }

      return sellerStorefrontAccess;
    },
    updateSellerShop: async (input) => {
      await requestJson(
        fetchImpl(`${baseUrl}/api/v1/seller/shops/${encodeURIComponent(input.shopId)}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: input.name,
            description: input.description,
            headerImageUrl: input.headerImageUrl,
            backgroundImageUrl: input.backgroundImageUrl,
          }),
        }),
      );
    },
    createSellerMenuPage: async (input) => {
      await requestJson(
        fetchImpl(`${baseUrl}/api/v1/seller/menu-pages`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        }),
      );
    },
    updateSellerMenuPage: async (input) => {
      await requestJson(
        fetchImpl(`${baseUrl}/api/v1/seller/menu-pages/${encodeURIComponent(input.menuPageId)}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shopId: input.shopId,
            name: input.name,
          }),
        }),
      );
    },
    createSellerProduct: async (input) => {
      await requestJson(
        fetchImpl(`${baseUrl}/api/v1/seller/products`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        }),
      );
    },
    updateSellerProduct: async (input) => {
      await requestJson(
        fetchImpl(`${baseUrl}/api/v1/seller/products/${encodeURIComponent(input.productId)}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shopId: input.shopId,
            menuPageId: input.menuPageId,
            name: input.name,
            description: input.description,
            imageUrl: input.imageUrl,
            priceMinor: input.priceMinor,
          }),
        }),
      );
    },
  };
};
