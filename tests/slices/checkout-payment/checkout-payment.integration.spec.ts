import { createHmac } from "crypto";
import { createCheckoutPaymentModule } from "../../../backend/src/slices/checkout-payment/presentation/checkout-payment.module";
import type { CheckoutPaymentPrismaProvider } from "../../../backend/src/slices/checkout-payment/infrastructure/prisma-checkout-payment.repository";
import { hashSessionToken } from "../../../backend/src/slices/checkout-payment/domain/telegram-auth";

const TEST_BOT_TOKEN = "test-bot-token";
const NOW = new Date("2026-04-02T12:00:00.000Z");

const createTelegramInitData = (authDate: number, hashOverride?: string): string => {
  const params = new URLSearchParams();

  params.set("auth_date", String(authDate));
  params.set("query_id", "AAEAAAE");
  params.set(
    "user",
    JSON.stringify({
      id: 42,
      first_name: "Khujand",
      last_name: "Client",
      username: "khujandi_client",
      language_code: "ru",
    }),
  );

  const dataCheckString = Array.from(params.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(TEST_BOT_TOKEN).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  params.set("hash", hashOverride ?? hash);

  return params.toString();
};

type CheckoutPaymentPrismaClient = Omit<CheckoutPaymentPrismaProvider["client"], "$transaction">;

const createPrismaProvider = (
  client: CheckoutPaymentPrismaClient,
): CheckoutPaymentPrismaProvider => ({
  client: {
    ...client,
    $transaction: async (callback) => callback(client),
  },
});

describe("checkout-payment module integration", () => {
  it("wires controller, service and repository around the order persistence boundary", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      shopId: "shop-1",
      shopNameSnapshot: "Bakery",
      sellerId: "seller-1",
      clientId: "client-1",
      courierId: null,
      status: "CREATED",
      itemsTotalMinor: 1500,
      deliveryFeeMinor: 500,
      totalAmountMinor: 2000,
      paymentProvider: "local-provider",
      paymentProviderTxId: "tx-1",
      telegramPaymentChargeId: "telegram-charge-1",
      providerPaymentChargeId: "provider-charge-1",
      paymentStatus: "PAID",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      isDeleted: false,
    });
    const orderCreate = jest.fn().mockResolvedValue({
      id: "order-1",
      shopId: "shop-1",
      shopNameSnapshot: "Bakery",
      sellerId: "seller-1",
      clientId: "client-1",
      courierId: null,
      status: "CREATED",
      itemsTotalMinor: 1500,
      deliveryFeeMinor: 500,
      totalAmountMinor: 2000,
      paymentProvider: "local-provider",
      paymentProviderTxId: "tx-1",
      telegramPaymentChargeId: "telegram-charge-1",
      providerPaymentChargeId: "provider-charge-1",
      paymentStatus: "PAID",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      isDeleted: false,
    });
    const module = createCheckoutPaymentModule(
      createPrismaProvider({
          order: {
            findUnique: orderFindUnique,
            create: orderCreate,
          },
          user: {
            upsert: jest.fn(),
            update: jest.fn(),
          },
          telegramAuthReplay: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          miniAppSession: {
            create: jest.fn(),
          },
      }),
      {
        botToken: TEST_BOT_TOKEN,
        now: () => NOW,
      },
    );

    await expect(module.controller.getOrderByPaymentProviderTxId("tx-1")).resolves.toEqual({
      id: "order-1",
      shopId: "shop-1",
      shopNameSnapshot: "Bakery",
      sellerId: "seller-1",
      clientId: "client-1",
      courierId: null,
      status: "CREATED",
      itemsTotalMinor: 1500,
      deliveryFeeMinor: 500,
      totalAmountMinor: 2000,
      paymentProvider: "local-provider",
      paymentProviderTxId: "tx-1",
      telegramPaymentChargeId: "telegram-charge-1",
      providerPaymentChargeId: "provider-charge-1",
      paymentStatus: "PAID",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      isDeleted: false,
    });
    expect(orderFindUnique).toHaveBeenCalledWith({
      where: {
        paymentProviderTxId: "tx-1",
      },
    });

    const input = {
      shopId: "shop-1",
      shopNameSnapshot: "Bakery",
      sellerId: "seller-1",
      clientId: "client-1",
      courierId: null,
      status: "CREATED" as const,
      itemsTotalMinor: 1500,
      deliveryFeeMinor: 500,
      totalAmountMinor: 2000,
      paymentProvider: "local-provider",
      paymentProviderTxId: "tx-1",
      telegramPaymentChargeId: "telegram-charge-1",
      providerPaymentChargeId: "provider-charge-1",
      paymentStatus: "PAID" as const,
      refundStatus: "NOT_REQUIRED" as const,
      refundNote: null,
      isDeleted: false,
    };

    await expect(module.controller.createPaidOrder(input)).resolves.toEqual({
      id: "order-1",
      ...input,
    });
    expect(orderCreate).toHaveBeenCalledWith({
      data: input,
    });
  });

  it("accepts valid raw initData and returns cookie transport metadata", async () => {
    const userUpsert = jest.fn().mockResolvedValue({
      id: "user-1",
      telegramId: "42",
      role: "client",
      name: "Khujand Client",
      username: "khujandi_client",
      language: "ru",
      isActive: true,
    });
    const sessionCreate = jest.fn().mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      sessionTokenHash: "hashed-token",
      expiresAt: new Date("2026-04-05T12:00:00.000Z"),
      revokedAt: null,
    });
    const replayCreate = jest.fn().mockResolvedValue({
      initDataHash: "replay-hash",
      expiresAt: new Date("2026-04-02T12:10:00.000Z"),
    });
    const module = createCheckoutPaymentModule(
      createPrismaProvider({
          order: {
            findUnique: jest.fn(),
            create: jest.fn(),
          },
          user: {
            upsert: userUpsert,
            update: jest.fn(),
          },
          telegramAuthReplay: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: replayCreate,
          },
          miniAppSession: {
            create: sessionCreate,
          },
      }),
      {
        botToken: TEST_BOT_TOKEN,
        allowedOrigins: ["https://miniapp.example"],
        now: () => NOW,
        sessionTokenFactory: () => "session-token",
      },
    );

    await expect(
      module.controller.authenticateTelegram({
        initData: createTelegramInitData(Math.floor(NOW.getTime() / 1000)),
        origin: "https://miniapp.example",
      }),
    ).resolves.toEqual({
      user: {
        id: "user-1",
        telegramId: "42",
        role: "client",
        name: "Khujand Client",
        username: "khujandi_client",
        language: "ru",
        isActive: true,
      },
      session: {
        transport: "httpOnlyCookie",
        cookie: {
          name: "khujandi_mini_app_session",
          value: "session-token",
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAgeSeconds: 259200,
        },
        expiresAt: new Date("2026-04-05T12:00:00.000Z"),
        requiresOriginCheck: true,
      },
    });
    expect(replayCreate).toHaveBeenCalledWith({
      data: {
        initDataHash: expect.any(String),
        expiresAt: new Date("2026-04-02T12:10:00.000Z"),
      },
    });
    expect(userUpsert).toHaveBeenCalledWith({
      where: {
        telegramId: "42",
      },
      update: {
        name: "Khujand Client",
        username: "khujandi_client",
        language: "ru",
        isActive: true,
      },
      create: {
        telegramId: "42",
        role: "CLIENT",
        name: "Khujand Client",
        username: "khujandi_client",
        language: "ru",
        isActive: true,
      },
    });
    expect(sessionCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        sessionTokenHash: expect.any(String),
        expiresAt: new Date("2026-04-05T12:00:00.000Z"),
      },
    });
  });

  it("returns the raw cookie value from the shared auth boundary instead of relying on route-local token prediction", async () => {
    const sessionCreate = jest.fn().mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      sessionTokenHash: "hashed-token",
      expiresAt: new Date("2026-04-05T12:00:00.000Z"),
      revokedAt: null,
    });
    const module = createCheckoutPaymentModule(
      createPrismaProvider({
          order: {
            findUnique: jest.fn(),
            create: jest.fn(),
          },
          user: {
            upsert: jest.fn().mockResolvedValue({
              id: "user-1",
              telegramId: "42",
              role: "client",
              name: "Khujand Client",
              username: "khujandi_client",
              language: "ru",
              isActive: true,
            }),
            update: jest.fn(),
          },
          telegramAuthReplay: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              initDataHash: "replay-hash",
              expiresAt: new Date("2026-04-02T12:10:00.000Z"),
            }),
          },
          miniAppSession: {
            create: sessionCreate,
          },
      }),
      {
        botToken: TEST_BOT_TOKEN,
        allowedOrigins: ["https://miniapp.example"],
        now: () => NOW,
        sessionTokenFactory: () => "shared-cookie-value",
      },
    );

    const result = await module.controller.authenticateTelegram({
      initData: createTelegramInitData(Math.floor(NOW.getTime() / 1000)),
      origin: "https://miniapp.example",
    });

    expect(result.session.cookie.value).toBe("shared-cookie-value");
    expect(sessionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionTokenHash: hashSessionToken("shared-cookie-value"),
      }),
    });
  });

  it("rejects invalid initData signature", async () => {
    const module = createCheckoutPaymentModule(
      createPrismaProvider({
          order: {
            findUnique: jest.fn(),
            create: jest.fn(),
          },
          user: {
            upsert: jest.fn(),
            update: jest.fn(),
          },
          telegramAuthReplay: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          miniAppSession: {
            create: jest.fn(),
          },
      }),
      {
        botToken: TEST_BOT_TOKEN,
        allowedOrigins: ["https://miniapp.example"],
        now: () => NOW,
      },
    );

    await expect(
      module.controller.authenticateTelegram({
        initData: createTelegramInitData(
          Math.floor(NOW.getTime() / 1000),
          "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        ),
        origin: "https://miniapp.example",
      }),
    ).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
      statusCode: 401,
    });
  });

  it("rejects expired initData", async () => {
    const module = createCheckoutPaymentModule(
      createPrismaProvider({
          order: {
            findUnique: jest.fn(),
            create: jest.fn(),
          },
          user: {
            upsert: jest.fn(),
            update: jest.fn(),
          },
          telegramAuthReplay: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          miniAppSession: {
            create: jest.fn(),
          },
      }),
      {
        botToken: TEST_BOT_TOKEN,
        allowedOrigins: ["https://miniapp.example"],
        now: () => NOW,
      },
    );

    await expect(
      module.controller.authenticateTelegram({
        initData: createTelegramInitData(Math.floor(NOW.getTime() / 1000) - 601),
        origin: "https://miniapp.example",
      }),
    ).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
      statusCode: 401,
    });
  });

  it("rejects replayed initData when the replay guard insert loses the race", async () => {
    const replayCreate = jest.fn().mockRejectedValue({ code: "P2002" });
    const module = createCheckoutPaymentModule(
      createPrismaProvider({
          order: {
            findUnique: jest.fn(),
            create: jest.fn(),
          },
          user: {
            upsert: jest.fn(),
            update: jest.fn(),
          },
          telegramAuthReplay: {
            findUnique: jest.fn(),
            create: replayCreate,
          },
          miniAppSession: {
            create: jest.fn(),
          },
      }),
      {
        botToken: TEST_BOT_TOKEN,
        allowedOrigins: ["https://miniapp.example"],
        now: () => NOW,
      },
    );

    await expect(
      module.controller.authenticateTelegram({
        initData: createTelegramInitData(Math.floor(NOW.getTime() / 1000)),
        origin: "https://miniapp.example",
      }),
    ).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
      statusCode: 401,
    });
    expect(replayCreate).toHaveBeenCalledTimes(1);
  });

  it("updates backend user language to the explicit choice after auth", async () => {
    const userUpsert = jest.fn().mockResolvedValue({
      id: "user-1",
      telegramId: "42",
      role: "client",
      name: "Khujand Client",
      username: "khujandi_client",
      language: "ru",
      isActive: true,
    });
    const userUpdate = jest.fn().mockResolvedValue({
      id: "user-1",
      telegramId: "42",
      role: "client",
      name: "Khujand Client",
      username: "khujandi_client",
      language: "en",
      isActive: true,
    });
    const module = createCheckoutPaymentModule(
      createPrismaProvider({
          order: {
            findUnique: jest.fn(),
            create: jest.fn(),
          },
          user: {
            upsert: userUpsert,
            update: userUpdate,
          },
          telegramAuthReplay: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          miniAppSession: {
            create: jest.fn().mockResolvedValue({
              id: "session-1",
              userId: "user-1",
              sessionTokenHash: "hashed-token",
              expiresAt: new Date("2026-04-05T12:00:00.000Z"),
              revokedAt: null,
            }),
          },
      }),
      {
        botToken: TEST_BOT_TOKEN,
        allowedOrigins: ["https://miniapp.example"],
        now: () => NOW,
        sessionTokenFactory: () => "session-token",
      },
    );

    await module.controller.authenticateTelegram({
      initData: createTelegramInitData(Math.floor(NOW.getTime() / 1000)),
      origin: "https://miniapp.example",
    });

    await expect(
      module.controller.syncLanguagePreference({
        telegramId: "42",
        language: "en",
      }),
    ).resolves.toEqual({
      id: "user-1",
      telegramId: "42",
      role: "client",
      name: "Khujand Client",
      username: "khujandi_client",
      language: "en",
      isActive: true,
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: {
        telegramId: "42",
      },
      data: {
        language: "en",
      },
    });
  });

  it("creates one order for a trusted provider callback and reuses it on duplicate delivery", async () => {
    const persistedOrder = {
      id: "order-1",
      shopId: "shop-1",
      shopNameSnapshot: "Bakery",
      sellerId: "seller-1",
      clientId: "client-1",
      courierId: null,
      status: "CREATED",
      itemsTotalMinor: 1500,
      deliveryFeeMinor: 500,
      totalAmountMinor: 2000,
      paymentProvider: "local-provider",
      paymentProviderTxId: "tx-1",
      telegramPaymentChargeId: "telegram-charge-1",
      providerPaymentChargeId: "provider-charge-1",
      paymentStatus: "PAID" as const,
      refundStatus: "NOT_REQUIRED" as const,
      refundNote: null,
      isDeleted: false,
    };
    const orderFindUnique = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(persistedOrder);
    const orderCreate = jest.fn().mockResolvedValue(persistedOrder);
    const module = createCheckoutPaymentModule(
      createPrismaProvider({
          order: {
            findUnique: orderFindUnique,
            create: orderCreate,
          },
          user: {
            upsert: jest.fn(),
            update: jest.fn(),
          },
          telegramAuthReplay: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          miniAppSession: {
            create: jest.fn(),
          },
      }),
      {
        botToken: TEST_BOT_TOKEN,
        paymentProviderName: "local-provider",
        paymentSecretToken: "provider-secret",
        now: () => NOW,
      },
    );
    const input = {
      order: {
        shopId: "shop-1",
        shopNameSnapshot: "Bakery",
        sellerId: "seller-1",
        clientId: "client-1",
        courierId: null,
        itemsTotalMinor: 1500,
        deliveryFeeMinor: 500,
        totalAmountMinor: 2000,
      },
      payment: {
        provider: "local-provider",
        paymentProviderTxId: "tx-1",
        telegramPaymentChargeId: "telegram-charge-1",
        providerPaymentChargeId: "provider-charge-1",
        status: "PAID" as const,
        source: "provider_callback" as const,
        verificationToken: "provider-secret",
      },
    };

    await expect(module.controller.checkoutOrder(input)).resolves.toEqual(persistedOrder);
    await expect(
      module.controller.checkoutOrder({
        ...input,
        payment: {
          ...input.payment,
          source: "provider_status" as const,
        },
      }),
    ).resolves.toEqual(persistedOrder);
    expect(orderCreate).toHaveBeenCalledTimes(1);
    expect(orderCreate).toHaveBeenCalledWith({
      data: {
        shopId: "shop-1",
        shopNameSnapshot: "Bakery",
        sellerId: "seller-1",
        clientId: "client-1",
        courierId: null,
        status: "CREATED",
        itemsTotalMinor: 1500,
        deliveryFeeMinor: 500,
        totalAmountMinor: 2000,
        paymentProvider: "local-provider",
        paymentProviderTxId: "tx-1",
        telegramPaymentChargeId: "telegram-charge-1",
        providerPaymentChargeId: "provider-charge-1",
        paymentStatus: "PAID",
        refundStatus: "NOT_REQUIRED",
        refundNote: null,
        isDeleted: false,
      },
    });
  });

  it("rejects untrusted checkout payment confirmation before touching order persistence", async () => {
    const orderFindUnique = jest.fn();
    const orderCreate = jest.fn();
    const module = createCheckoutPaymentModule(
      createPrismaProvider({
          order: {
            findUnique: orderFindUnique,
            create: orderCreate,
          },
          user: {
            upsert: jest.fn(),
            update: jest.fn(),
          },
          telegramAuthReplay: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          miniAppSession: {
            create: jest.fn(),
          },
      }),
      {
        botToken: TEST_BOT_TOKEN,
        paymentProviderName: "local-provider",
        paymentSecretToken: "provider-secret",
        now: () => NOW,
      },
    );

    await expect(
      module.controller.checkoutOrder({
        order: {
          shopId: "shop-1",
          shopNameSnapshot: "Bakery",
          sellerId: "seller-1",
          clientId: "client-1",
          courierId: null,
          itemsTotalMinor: 1500,
          deliveryFeeMinor: 500,
          totalAmountMinor: 2000,
        },
        payment: {
          provider: "local-provider",
          paymentProviderTxId: "tx-1",
          telegramPaymentChargeId: "telegram-charge-1",
          providerPaymentChargeId: "provider-charge-1",
          status: "PAID",
          source: "client_signal",
          verificationToken: "provider-secret",
        },
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
    });
    expect(orderFindUnique).not.toHaveBeenCalled();
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it.each([
    [
      "FAILED",
      "Payment failed",
      "payment_failed",
    ],
    [
      "CANCELED",
      "Payment was canceled",
      "payment_canceled",
    ],
    [
      "PENDING",
      "Payment confirmation timed out",
      "payment_timeout",
    ],
  ] as const)(
    "returns a retry-safe controlled error for %s checkout outcomes without persisting orders",
    async (status, message, failureCategory) => {
      const orderFindUnique = jest.fn();
      const orderCreate = jest.fn();
      const module = createCheckoutPaymentModule(
        createPrismaProvider({
            order: {
              findUnique: orderFindUnique,
              create: orderCreate,
            },
            user: {
              upsert: jest.fn(),
              update: jest.fn(),
            },
            telegramAuthReplay: {
              findUnique: jest.fn().mockResolvedValue(null),
              create: jest.fn(),
            },
            miniAppSession: {
              create: jest.fn(),
            },
        }),
        {
          botToken: TEST_BOT_TOKEN,
          paymentProviderName: "local-provider",
          paymentSecretToken: "provider-secret",
          now: () => NOW,
        },
      );

      await expect(
        module.controller.checkoutOrder({
          order: {
            shopId: "shop-1",
            shopNameSnapshot: "Bakery",
            sellerId: "seller-1",
            clientId: "client-1",
            courierId: null,
            itemsTotalMinor: 1500,
            deliveryFeeMinor: 500,
            totalAmountMinor: 2000,
          },
          payment: {
            provider: "local-provider",
            paymentProviderTxId: `tx-${status.toLowerCase()}`,
            telegramPaymentChargeId: null,
            providerPaymentChargeId: null,
            status,
            source: "provider_callback",
            verificationToken: "provider-secret",
          },
        }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message,
        statusCode: 409,
        details: {
          paymentStatus: status,
          failureCategory,
          retryable: true,
          retryAction: "retry_checkout",
          orderCreated: false,
        },
      });
      expect(orderFindUnique).not.toHaveBeenCalled();
      expect(orderCreate).not.toHaveBeenCalled();
    },
  );
});
