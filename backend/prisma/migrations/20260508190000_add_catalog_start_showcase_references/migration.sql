-- Catalog-owned FT-015 showcase curation stores references plus ordering metadata only.
CREATE TABLE "CatalogShowcaseProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogShowcaseProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CatalogFavoriteShop" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogFavoriteShop_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogShowcaseProduct_productId_key" ON "CatalogShowcaseProduct"("productId");
CREATE INDEX "CatalogShowcaseProduct_isActive_sortOrder_idx" ON "CatalogShowcaseProduct"("isActive", "sortOrder");

CREATE UNIQUE INDEX "CatalogFavoriteShop_shopId_key" ON "CatalogFavoriteShop"("shopId");
CREATE INDEX "CatalogFavoriteShop_isActive_sortOrder_idx" ON "CatalogFavoriteShop"("isActive", "sortOrder");

ALTER TABLE "CatalogShowcaseProduct"
    ADD CONSTRAINT "CatalogShowcaseProduct_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CatalogFavoriteShop"
    ADD CONSTRAINT "CatalogFavoriteShop_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
