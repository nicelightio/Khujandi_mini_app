import type {
  CheckoutPaymentInitDataHash,
  CheckoutPaymentMiniAppSessionRecord,
  CheckoutPaymentOrderRecord,
  CheckoutPaymentProviderTxId,
  CheckoutPaymentRepository,
  CheckoutPaymentReplayGuardRecord,
  CheckoutPaymentUserRecord,
  CreateCheckoutPaymentMiniAppSessionInput,
  CreateCheckoutPaymentOrderInput,
  IssueCheckoutPaymentMiniAppSessionInput,
  IssueCheckoutPaymentMiniAppSessionResult,
  StoreCheckoutPaymentReplayGuardInput,
  UpsertCheckoutPaymentUserInput,
} from "../domain/checkout-payment.types";

type CheckoutPaymentOrderFindUniqueArgs = {
  where: {
    paymentProviderTxId: string;
  };
};

type CheckoutPaymentOrderCreateArgs = {
  data: CreateCheckoutPaymentOrderInput;
};

type CheckoutPaymentUserUpsertArgs = {
  where: {
    telegramId: string;
  };
  update: {
    name: string;
    username: string | null;
    language: string | null;
    isActive: boolean;
  };
  create: {
    telegramId: string;
    role: "CLIENT";
    name: string;
    username: string | null;
    language: string | null;
    isActive: boolean;
  };
};

type CheckoutPaymentUserUpdateArgs = {
  where: {
    telegramId: string;
  };
  data: {
    language: string;
  };
};

type CheckoutPaymentReplayFindUniqueArgs = {
  where: {
    initDataHash: string;
  };
};

type CheckoutPaymentReplayCreateArgs = {
  data: StoreCheckoutPaymentReplayGuardInput;
};

type CheckoutPaymentSessionCreateArgs = {
  data: CreateCheckoutPaymentMiniAppSessionInput;
};

export type CheckoutPaymentPrismaClientLike = {
  order: {
    findUnique(args: CheckoutPaymentOrderFindUniqueArgs): Promise<CheckoutPaymentOrderRecord | null>;
    create(args: CheckoutPaymentOrderCreateArgs): Promise<CheckoutPaymentOrderRecord>;
  };
  user: {
    upsert(args: CheckoutPaymentUserUpsertArgs): Promise<CheckoutPaymentUserRecord>;
    update(args: CheckoutPaymentUserUpdateArgs): Promise<CheckoutPaymentUserRecord>;
  };
  telegramAuthReplay: {
    findUnique(
      args: CheckoutPaymentReplayFindUniqueArgs,
    ): Promise<CheckoutPaymentReplayGuardRecord | null>;
    create(args: CheckoutPaymentReplayCreateArgs): Promise<CheckoutPaymentReplayGuardRecord>;
  };
  miniAppSession: {
    create(args: CheckoutPaymentSessionCreateArgs): Promise<CheckoutPaymentMiniAppSessionRecord>;
  };
};

type CheckoutPaymentPrismaTransactionalClientLike = CheckoutPaymentPrismaClientLike & {
  $transaction<T>(callback: (client: CheckoutPaymentPrismaClientLike) => Promise<T>): Promise<T>;
};

export type CheckoutPaymentPrismaProvider = {
  readonly client: CheckoutPaymentPrismaTransactionalClientLike;
};

const isPrismaUniqueConstraintError = (error: unknown): error is { code: string } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof (error as { code?: unknown }).code === "string" &&
  (error as { code: string }).code === "P2002";

export class PrismaCheckoutPaymentRepository implements CheckoutPaymentRepository {
  constructor(private readonly prisma: CheckoutPaymentPrismaProvider) {}

  findOrderByPaymentProviderTxId(
    paymentProviderTxId: CheckoutPaymentProviderTxId,
  ): Promise<CheckoutPaymentOrderRecord | null> {
    return this.prisma.client.order.findUnique({
      where: {
        paymentProviderTxId,
      },
    });
  }

  createPaidOrder(input: CreateCheckoutPaymentOrderInput): Promise<CheckoutPaymentOrderRecord> {
    return this.prisma.client.order.create({
      data: input,
    });
  }

  async createPaidOrderIdempotently(
    input: CreateCheckoutPaymentOrderInput,
  ): Promise<CheckoutPaymentOrderRecord> {
    try {
      return await this.createPaidOrder(input);
    } catch (error) {
      if (!isPrismaUniqueConstraintError(error)) {
        throw error;
      }

      const existingOrder = await this.findOrderByPaymentProviderTxId(input.paymentProviderTxId);

      if (existingOrder !== null) {
        return existingOrder;
      }

      throw error;
    }
  }

  upsertTelegramUser(input: UpsertCheckoutPaymentUserInput): Promise<CheckoutPaymentUserRecord> {
    return this.prisma.client.user.upsert({
      where: {
        telegramId: input.telegramId,
      },
      update: {
        name: input.name,
        username: input.username,
        language: input.language,
        isActive: input.isActive,
      },
      create: {
        telegramId: input.telegramId,
        role: "CLIENT",
        name: input.name,
        username: input.username,
        language: input.language,
        isActive: input.isActive,
      },
    });
  }

  findReplayGuardByInitDataHash(
    initDataHash: CheckoutPaymentInitDataHash,
  ): Promise<CheckoutPaymentReplayGuardRecord | null> {
    return this.prisma.client.telegramAuthReplay.findUnique({
      where: {
        initDataHash,
      },
    });
  }

  storeReplayGuard(
    input: StoreCheckoutPaymentReplayGuardInput,
  ): Promise<CheckoutPaymentReplayGuardRecord> {
    return this.prisma.client.telegramAuthReplay.create({
      data: input,
    });
  }

  issueMiniAppSessionWithReplayGuard(
    input: IssueCheckoutPaymentMiniAppSessionInput,
  ): Promise<IssueCheckoutPaymentMiniAppSessionResult | null> {
    return this.prisma.client.$transaction(async (transactionClient) => {
      try {
        await transactionClient.telegramAuthReplay.create({
          data: input.replayGuard,
        });
      } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
          return null;
        }

        throw error;
      }

      const user = await transactionClient.user.upsert({
        where: {
          telegramId: input.user.telegramId,
        },
        update: {
          name: input.user.name,
          username: input.user.username,
          language: input.user.language,
          isActive: input.user.isActive,
        },
        create: {
          telegramId: input.user.telegramId,
          role: "CLIENT",
          name: input.user.name,
          username: input.user.username,
          language: input.user.language,
          isActive: input.user.isActive,
        },
      });
      const session = await transactionClient.miniAppSession.create({
        data: {
          userId: user.id,
          sessionTokenHash: input.sessionTokenHash,
          expiresAt: input.sessionExpiresAt,
        },
      });

      return {
        user,
        session,
      };
    });
  }

  createMiniAppSession(
    input: CreateCheckoutPaymentMiniAppSessionInput,
  ): Promise<CheckoutPaymentMiniAppSessionRecord> {
    return this.prisma.client.miniAppSession.create({
      data: input,
    });
  }

  updateTelegramUserLanguage(input: { telegramId: string; language: string }): Promise<CheckoutPaymentUserRecord> {
    return this.prisma.client.user.update({
      where: {
        telegramId: input.telegramId,
      },
      data: {
        language: input.language,
      },
    });
  }
}
