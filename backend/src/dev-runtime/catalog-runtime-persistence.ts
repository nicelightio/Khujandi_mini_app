import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { buildUniqueShopPublicPaths } from "../slices/catalog/domain/shop-public-paths";
import { createCatalogRuntimeState, type CatalogRuntimeState } from "./catalog-runtime-state";

export type CatalogStatePersistence = {
  databasePath: string;
  loadState: () => CatalogRuntimeState;
  saveState: (state: CatalogRuntimeState) => void;
  close: () => void;
  cleanup: () => void;
};

const hasNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const defaultCatalogRuntimeDatabasePath = resolve(
  process.cwd(),
  "backend",
  "prisma",
  "dev-catalog-runtime.sqlite",
);

const isJestRuntime = () => hasNonEmptyString(process.env.JEST_WORKER_ID);

const normalizeCatalogRuntimeState = (state: CatalogRuntimeState): CatalogRuntimeState => {
  const occupiedPublicPaths = new Set<string>();
  const sellerPrimaryPublicPaths = new Map<string, string[]>();

  const normalizedShops = state.shops.map((shop) => {
    let primaryPublicPath =
      hasNonEmptyString(shop.primaryPublicPath) && !occupiedPublicPaths.has(shop.primaryPublicPath.toLowerCase())
        ? shop.primaryPublicPath
        : null;
    let secondaryPublicPath =
      hasNonEmptyString(shop.secondaryPublicPath) &&
      !occupiedPublicPaths.has(shop.secondaryPublicPath.toLowerCase()) &&
      shop.secondaryPublicPath.toLowerCase() !== primaryPublicPath?.toLowerCase()
        ? shop.secondaryPublicPath
        : null;

    if (primaryPublicPath === null) {
      primaryPublicPath = buildUniqueShopPublicPaths({
        sellerId: shop.sellerId,
        shopName: shop.name,
        existingPublicPaths: [
          ...occupiedPublicPaths,
          ...(secondaryPublicPath === null ? [] : [secondaryPublicPath.toLowerCase()]),
        ],
        existingSellerPrimaryPublicPaths: sellerPrimaryPublicPaths.get(shop.sellerId) ?? [],
      }).primaryPublicPath;
    }

    occupiedPublicPaths.add(primaryPublicPath.toLowerCase());
    sellerPrimaryPublicPaths.set(shop.sellerId, [
      ...(sellerPrimaryPublicPaths.get(shop.sellerId) ?? []),
      primaryPublicPath,
    ]);

    if (secondaryPublicPath === null) {
      secondaryPublicPath = buildUniqueShopPublicPaths({
            sellerId: shop.sellerId,
            shopName: shop.name,
            existingPublicPaths: [...occupiedPublicPaths],
            existingSellerPrimaryPublicPaths: sellerPrimaryPublicPaths.get(shop.sellerId) ?? [],
          }).secondaryPublicPath;
    }

    occupiedPublicPaths.add(secondaryPublicPath.toLowerCase());

    return {
      ...shop,
      primaryPublicPath,
      secondaryPublicPath,
    };
  });

  return {
    ...state,
    shops: normalizedShops,
  };
};

const createCatalogStatePersistence = (databasePath: string, cleanupDirectory: string | null): CatalogStatePersistence => {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS catalog_runtime_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const saveState = (state: CatalogRuntimeState): void => {
    database
      .prepare(
        `INSERT INTO catalog_runtime_state (id, payload, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      )
      .run(JSON.stringify(state), new Date().toISOString());
  };

  const loadState = (): CatalogRuntimeState => {
    const row = database.prepare("SELECT payload FROM catalog_runtime_state WHERE id = 1").get() as { payload: string } | undefined;

    if (row === undefined) {
      const seededState = createCatalogRuntimeState();
      saveState(seededState);
      return seededState;
    }

    const normalizedState = normalizeCatalogRuntimeState(JSON.parse(row.payload) as CatalogRuntimeState);

    if (JSON.stringify(normalizedState) !== row.payload) {
      saveState(normalizedState);
    }

    return normalizedState;
  };

  return {
    databasePath,
    loadState,
    saveState,
    close: () => {
      database.close();
    },
    cleanup: () => {
      if (cleanupDirectory !== null && existsSync(cleanupDirectory)) {
        rmSync(cleanupDirectory, { recursive: true, force: true });
      }
    },
  };
};

export const resolveCatalogDatabasePersistence = (databasePath: string | undefined): CatalogStatePersistence => {
  if (databasePath !== undefined) {
    return createCatalogStatePersistence(databasePath, null);
  }

  if (!isJestRuntime()) {
    return createCatalogStatePersistence(defaultCatalogRuntimeDatabasePath, null);
  }

  const temporaryDirectory = mkdtempSync(join(tmpdir(), "khujandi-catalog-runtime-"));
  return createCatalogStatePersistence(join(temporaryDirectory, "catalog-runtime.sqlite"), temporaryDirectory);
};
