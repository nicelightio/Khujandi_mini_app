import { existsSync, mkdirSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import {
  cloneCheckoutPaymentRuntimeState,
  createCheckoutPaymentRuntimeState,
  type CheckoutPaymentRuntimeState,
} from "./checkout-payment-runtime";

export type CheckoutPaymentStatePersistence = {
  databasePath: string;
  loadState: () => CheckoutPaymentRuntimeState;
  saveState: (state: CheckoutPaymentRuntimeState) => void;
  close: () => void;
  cleanup: () => void;
};

const cloneDate = (value: Date | string | null | undefined): Date | null =>
  value === null || value === undefined ? null : new Date(value);

const normalizeCheckoutPaymentRuntimeState = (
  state: Partial<CheckoutPaymentRuntimeState>,
): CheckoutPaymentRuntimeState => ({
  orders: (state.orders ?? []).map((order) => ({ ...order })),
  users: (state.users ?? []).map((user) => ({ ...user })),
  sessions: (state.sessions ?? []).map((session) => ({
    ...session,
    expiresAt: new Date(session.expiresAt),
    revokedAt: cloneDate(session.revokedAt),
    lastUsedAt: new Date(session.lastUsedAt),
    createdAt: new Date(session.createdAt),
  })),
  replayGuards: (state.replayGuards ?? []).map((replayGuard) => ({
    ...replayGuard,
    expiresAt: new Date(replayGuard.expiresAt),
  })),
  nextUserId: state.nextUserId ?? 1,
  nextSessionId: state.nextSessionId ?? 1,
  nextOrderId: state.nextOrderId ?? 1,
});

export const createCheckoutPaymentStatePersistence = (
  databasePath: string,
  cleanupDirectory: string | null = null,
): CheckoutPaymentStatePersistence => {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS checkout_payment_runtime_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const saveState = (state: CheckoutPaymentRuntimeState): void => {
    database
      .prepare(
        `INSERT INTO checkout_payment_runtime_state (id, payload, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      )
      .run(JSON.stringify(cloneCheckoutPaymentRuntimeState(state)), new Date().toISOString());
  };

  const loadState = (): CheckoutPaymentRuntimeState => {
    const row = database
      .prepare("SELECT payload FROM checkout_payment_runtime_state WHERE id = 1")
      .get() as { payload: string } | undefined;

    if (row === undefined) {
      const seededState = createCheckoutPaymentRuntimeState();
      saveState(seededState);
      return seededState;
    }

    return normalizeCheckoutPaymentRuntimeState(JSON.parse(row.payload) as Partial<CheckoutPaymentRuntimeState>);
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
