import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createCatalogRuntimeState, type CatalogRuntimeState } from "./catalog-runtime-state";

export type CatalogStatePersistence = {
  databasePath: string;
  loadState: () => CatalogRuntimeState;
  saveState: (state: CatalogRuntimeState) => void;
  close: () => void;
  cleanup: () => void;
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

    return JSON.parse(row.payload) as CatalogRuntimeState;
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

  const temporaryDirectory = mkdtempSync(join(tmpdir(), "khujandi-catalog-runtime-"));
  return createCatalogStatePersistence(join(temporaryDirectory, "catalog-runtime.sqlite"), temporaryDirectory);
};
