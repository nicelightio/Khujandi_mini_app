import type { IncomingMessage } from "node:http";
import { AppError } from "../shared/errors/app-error";
import type {
  CheckoutPaymentMiniAppSessionRecord,
  CheckoutPaymentOrderRecord,
  CheckoutPaymentReplayGuardRecord,
  CheckoutPaymentUserRecord,
} from "../slices/checkout-payment/domain/checkout-payment.types";
import { hashSessionToken } from "../slices/checkout-payment/domain/telegram-auth";
import type { CheckoutPaymentPrismaProvider } from "../slices/checkout-payment/infrastructure/prisma-checkout-payment.repository";
import { parseCookies, readSingleHeader } from "./http-runtime";

type CheckoutPaymentRuntimeSessionRecord = CheckoutPaymentMiniAppSessionRecord & {
  lastUsedAt: Date;
  createdAt: Date;
};

export type CheckoutPaymentRuntimeState = {
  orders: CheckoutPaymentOrderRecord[];
  users: CheckoutPaymentUserRecord[];
  sessions: CheckoutPaymentRuntimeSessionRecord[];
  replayGuards: CheckoutPaymentReplayGuardRecord[];
  nextUserId: number;
  nextSessionId: number;
  nextOrderId: number;
};

export const createCheckoutPaymentRuntimeState = (): CheckoutPaymentRuntimeState => ({
  orders: [],
  users: [],
  sessions: [],
  replayGuards: [],
  nextUserId: 1,
  nextSessionId: 1,
  nextOrderId: 1,
});

const cloneDate = (value: Date | null): Date | null => (value === null ? null : new Date(value));

export const cloneCheckoutPaymentRuntimeState = (
  state: CheckoutPaymentRuntimeState,
): CheckoutPaymentRuntimeState => ({
  orders: state.orders.map((order) => ({ ...order })),
  users: state.users.map((user) => ({ ...user })),
  sessions: state.sessions.map((session) => ({
    ...session,
    expiresAt: new Date(session.expiresAt),
    revokedAt: cloneDate(session.revokedAt),
    lastUsedAt: new Date(session.lastUsedAt),
    createdAt: new Date(session.createdAt),
  })),
  replayGuards: state.replayGuards.map((replayGuard) => ({
    ...replayGuard,
    expiresAt: new Date(replayGuard.expiresAt),
  })),
  nextUserId: state.nextUserId,
  nextSessionId: state.nextSessionId,
  nextOrderId: state.nextOrderId,
});

export const createInMemoryCheckoutPaymentPrisma = (
  initialState: CheckoutPaymentRuntimeState = createCheckoutPaymentRuntimeState(),
  options: { persist?: (state: CheckoutPaymentRuntimeState) => void } = {},
): CheckoutPaymentPrismaProvider & {
  state: CheckoutPaymentRuntimeState;
} => {
  const state = cloneCheckoutPaymentRuntimeState(initialState);
  const persistState = (): void => {
    options.persist?.(cloneCheckoutPaymentRuntimeState(state));
  };

  const client: CheckoutPaymentPrismaProvider["client"] = {
    order: {
      findUnique: async ({ where }) =>
        state.orders.find((candidate) => candidate.paymentProviderTxId === where.paymentProviderTxId) ?? null,
      create: async ({ data }) => {
        const order: CheckoutPaymentOrderRecord = {
          id: `order-runtime-${state.nextOrderId++}`,
          ...data,
        };
        state.orders.push(order);
        persistState();
        return { ...order };
      },
    },
    user: {
      upsert: async ({ where, update, create }) => {
        const existingUser = state.users.find((candidate) => candidate.telegramId === where.telegramId);

        if (existingUser !== undefined) {
          existingUser.name = update.name;
          existingUser.username = update.username;
          existingUser.language = update.language;
          existingUser.isActive = update.isActive;
          persistState();
          return { ...existingUser };
        }

        const user: CheckoutPaymentUserRecord = {
          id: `mini-app-user-${state.nextUserId++}`,
          telegramId: create.telegramId,
          role: "client",
          name: create.name,
          username: create.username,
          language: create.language,
          isActive: create.isActive,
        };
        state.users.push(user);
        persistState();
        return { ...user };
      },
      update: async ({ where, data }) => {
        const user = state.users.find((candidate) => candidate.telegramId === where.telegramId);

        if (user === undefined) {
          throw new Error("unknown telegram user");
        }

        user.language = data.language;
        persistState();
        return { ...user };
      },
    },
    telegramAuthReplay: {
      findUnique: async ({ where }) =>
        state.replayGuards.find((candidate) => candidate.initDataHash === where.initDataHash) ?? null,
      create: async ({ data }) => {
        if (state.replayGuards.some((candidate) => candidate.initDataHash === data.initDataHash)) {
          const error = new Error("Unique constraint failed");
          (error as Error & { code: string }).code = "P2002";
          throw error;
        }

        const replay = {
          initDataHash: data.initDataHash,
          expiresAt: new Date(data.expiresAt),
        };
        state.replayGuards.push(replay);
        persistState();
        return replay;
      },
    },
    miniAppSession: {
      create: async ({ data }) => {
        const session: CheckoutPaymentRuntimeSessionRecord = {
          id: `mini-app-session-${state.nextSessionId++}`,
          userId: data.userId,
          sessionTokenHash: data.sessionTokenHash,
          expiresAt: new Date(data.expiresAt),
          revokedAt: null,
          lastUsedAt: new Date(),
          createdAt: new Date(),
        };
        state.sessions.push(session);
        persistState();
        return {
          id: session.id,
          userId: session.userId,
          sessionTokenHash: session.sessionTokenHash,
          expiresAt: new Date(session.expiresAt),
          revokedAt: session.revokedAt,
        };
      },
    },
    $transaction: async (callback) => callback(client),
  };

  return {
    state,
    client,
  };
};

export const resolveMiniAppAuthenticatedUser = async (
  request: IncomingMessage,
  dependencies: {
    state: CheckoutPaymentRuntimeState;
    authRequiredMessage?: string;
    now?: () => Date;
  },
): Promise<CheckoutPaymentUserRecord> => {
  const authRequiredMessage =
    dependencies.authRequiredMessage ?? "Mini App access requires an authenticated Telegram session";
  const cookies = parseCookies(readSingleHeader(request.headers.cookie));
  const sessionToken = cookies.khujandi_mini_app_session ?? "";

  if (sessionToken.length === 0) {
    throw new AppError("AUTH_REQUIRED", authRequiredMessage, 401);
  }

  const now = dependencies.now?.() ?? new Date();
  const sessionTokenHash = hashSessionToken(sessionToken);
  const session = dependencies.state.sessions.find(
    (candidate) =>
      candidate.sessionTokenHash === sessionTokenHash &&
      candidate.revokedAt === null &&
      candidate.expiresAt.getTime() > now.getTime(),
  );

  if (session === undefined) {
    throw new AppError("AUTH_REQUIRED", authRequiredMessage, 401);
  }

  const user = dependencies.state.users.find((candidate) => candidate.id === session.userId && candidate.isActive);

  if (user === undefined) {
    throw new AppError("AUTH_REQUIRED", authRequiredMessage, 401);
  }

  session.lastUsedAt = now;
  return { ...user };
};
