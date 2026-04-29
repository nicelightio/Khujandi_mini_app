import { CheckoutPaymentService } from "../../../backend/src/slices/checkout-payment/application/checkout-payment.service";
import type {
  FinalizeCheckoutPaymentInput,
  CheckoutPaymentRepository,
  CheckoutPaymentCatalogCompositionReader,
  CheckoutPaymentCompositionDraft,
  CheckoutPaymentOrderRecord,
  CheckoutPaymentUserRecord,
  CreateCheckoutPaymentOrderInput,
  IssueCheckoutPaymentMiniAppSessionResult,
} from "../../../backend/src/slices/checkout-payment/domain/checkout-payment.types";
import {
  TELEGRAM_INIT_DATA_TTL_MS,
  calculateTelegramInitDataHash,
  isTelegramAuthDateFresh,
  validateTelegramInitDataSignature,
} from "../../../backend/src/slices/checkout-payment/domain/telegram-auth";
import { AppError } from "../../../backend/src/shared/errors/app-error";

const TEST_BOT_TOKEN = "test-bot-token";
const NOW = new Date("2026-04-02T12:00:00.000Z");

const createTelegramInitData = ({
  authDate = Math.floor(NOW.getTime() / 1000),
  userId = 42,
  username = "khujandi_client",
}: {
  authDate?: number;
  userId?: number;
  username?: string;
} = {}): string => {
  const params = new URLSearchParams();

  params.set("auth_date", String(authDate));
  params.set("query_id", "AAEAAAE");
  params.set(
    "user",
    JSON.stringify({
      id: userId,
      first_name: "Khujand",
      last_name: "Client",
      username,
      language_code: "ru",
    }),
  );
  params.set("hash", calculateTelegramInitDataHash(params.toString(), TEST_BOT_TOKEN));

  return params.toString();
};

const createRepository = (): CheckoutPaymentRepository => ({
  findOrderByPaymentProviderTxId: async () => null,
  createPaidOrder: async () => {
    throw new Error("not implemented");
  },
  createPaidOrderIdempotently: async () => {
    throw new Error("not implemented");
  },
  upsertTelegramUser: async () => {
    throw new Error("not implemented");
  },
  findReplayGuardByInitDataHash: async () => null,
  storeReplayGuard: async () => {
    throw new Error("not implemented");
  },
  issueMiniAppSessionWithReplayGuard: async () => {
    throw new Error("not implemented");
  },
  createMiniAppSession: async () => {
    throw new Error("not implemented");
  },
  updateTelegramUserLanguage: async () => {
    throw new Error("not implemented");
  },
});

const createComposition = (overrides: Partial<CheckoutPaymentCompositionDraft> = {}): CheckoutPaymentCompositionDraft => ({
  composition_id: "composition-1",
  shop_public_path: "bakery-1",
  shop_id: "shop-1",
  items: [
    {
      product_id: "product-1",
      quantity: 2,
      display_snapshot: {
        product_name: "Sambusa",
        unit_price_minor: 750,
        currency: "TJS",
      },
    },
  ],
  preview_total: {
    amount_minor: 1500,
    currency: "TJS",
  },
  created_at: "2026-04-02T11:55:00.000Z",
  ...overrides,
});

type FinalizeInputOverrides = Omit<
  Partial<FinalizeCheckoutPaymentInput>,
  "order" | "payment"
> & {
  order?: Partial<FinalizeCheckoutPaymentInput["order"]>;
  payment?: Partial<FinalizeCheckoutPaymentInput["payment"]>;
};

const createFinalizeInput = (
  overrides: FinalizeInputOverrides = {},
): FinalizeCheckoutPaymentInput => ({
  order: {
    shopId: "shop-1",
    shopNameSnapshot: "Bakery",
    sellerId: "seller-1",
    clientId: "client-1",
    courierId: null,
    itemsTotalMinor: 1500,
    deliveryFeeMinor: 500,
    totalAmountMinor: 2000,
    ...overrides.order,
  },
  composition: Object.prototype.hasOwnProperty.call(overrides, "composition")
    ? overrides.composition
    : createComposition(),
  payment: {
    provider: "local-provider",
    paymentProviderTxId: "tx-1",
    telegramPaymentChargeId: "telegram-charge-1",
    providerPaymentChargeId: "provider-charge-1",
    status: "PAID",
    source: "provider_callback",
    verificationToken: "provider-secret",
    ...overrides.payment,
  },
});

const createPaidOrderInput = (
  overrides: Partial<CreateCheckoutPaymentOrderInput> = {},
): CreateCheckoutPaymentOrderInput => ({
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
  ...overrides,
});

const createPaidOrderRecord = (
  overrides: Partial<CheckoutPaymentOrderRecord> = {},
): CheckoutPaymentOrderRecord => ({
  id: "order-1",
  ...createPaidOrderInput(),
  ...overrides,
});

type CatalogSnapshot = NonNullable<Awaited<ReturnType<CheckoutPaymentCatalogCompositionReader["getCheckoutCompositionSnapshot"]>>>;
type CatalogReaderOverrides = {
  shop?: Partial<CatalogSnapshot["shop"]>;
  products?: CatalogSnapshot["products"];
};

const createCatalogReader = (overrides: CatalogReaderOverrides = {}): CheckoutPaymentCatalogCompositionReader => ({
  getCheckoutCompositionSnapshot: jest.fn().mockResolvedValue({
    shop: {
      id: "shop-1",
      sellerId: "seller-1",
      name: "Bakery",
      status: "WORKING",
      isDeleted: false,
      ...overrides?.shop,
    },
    products: overrides?.products ?? [
      {
        id: "product-1",
        shopId: "shop-1",
        name: "Sambusa",
        priceMinor: 750,
        currency: "TJS",
      },
    ],
  }),
});

describe("checkout-payment service", () => {
  it("keeps payment identity lookup behind the repository boundary", async () => {
    const service = new CheckoutPaymentService(createRepository(), {
      botToken: TEST_BOT_TOKEN,
      now: () => NOW,
    });

    await expect(service.findOrderByPaymentProviderTxId("tx-1")).resolves.toBeNull();
  });

  it("delegates paid order creation to the owning repository", async () => {
    const createPaidOrder = jest.fn().mockResolvedValue(createPaidOrderRecord());
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        createPaidOrder,
      },
      {
        botToken: TEST_BOT_TOKEN,
        now: () => NOW,
      },
    );
    const input = createPaidOrderInput();

    await expect(service.createPaidOrder(input)).resolves.toEqual({
      id: "order-1",
      ...input,
    });
    expect(createPaidOrder).toHaveBeenCalledWith(input);
  });

  it("creates an order only after trusted paid confirmation", async () => {
    const createPaidOrderIdempotently = jest.fn().mockResolvedValue(createPaidOrderRecord());
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        createPaidOrderIdempotently,
      },
      {
        botToken: TEST_BOT_TOKEN,
        paymentProviderName: "local-provider",
        paymentSecretToken: "provider-secret",
        now: () => NOW,
      },
    );
    const input = createFinalizeInput({ composition: undefined });

    await expect(service.checkoutOrder(input)).resolves.toEqual(createPaidOrderRecord());
    expect(createPaidOrderIdempotently).toHaveBeenCalledWith(createPaidOrderInput());
  });

  it("revalidates composition against catalog state before order creation", async () => {
    const createPaidOrderIdempotently = jest.fn().mockResolvedValue(createPaidOrderRecord());
    const catalogReader = createCatalogReader();
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        createPaidOrderIdempotently,
      },
      {
        botToken: TEST_BOT_TOKEN,
        paymentProviderName: "local-provider",
        paymentSecretToken: "provider-secret",
        now: () => NOW,
      },
      catalogReader,
    );

    await expect(service.checkoutOrder(createFinalizeInput())).resolves.toMatchObject({
      id: "order-1",
      paymentStatus: "PAID",
    });
    expect(catalogReader.getCheckoutCompositionSnapshot).toHaveBeenCalledWith("bakery-1");
    expect(createPaidOrderIdempotently).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "shop-1",
        sellerId: "seller-1",
        itemsTotalMinor: 1500,
        totalAmountMinor: 2000,
      }),
    );
  });

  it.each([
    ["missing composition", undefined, createCatalogReader(), "composition_missing"],
    ["hidden shop", createComposition(), createCatalogReader({ shop: { status: "NOT_WORKING" } }), "shop_unavailable"],
    ["missing product", createComposition(), createCatalogReader({ products: [] }), "product_unavailable"],
    [
      "unavailable product",
      createComposition(),
      createCatalogReader({
        products: [
          {
            id: "product-1",
            shopId: "shop-1",
            name: "Sambusa",
            priceMinor: 750,
            currency: "TJS",
            isDeleted: true,
          },
        ],
      }),
      "product_unavailable",
    ],
    ["invalid quantity", createComposition({ items: [{ ...createComposition().items[0], quantity: 0 }] }), createCatalogReader(), "invalid_quantity"],
    ["price drift", createComposition(), createCatalogReader({ products: [{ id: "product-1", shopId: "shop-1", name: "Sambusa", priceMinor: 800, currency: "TJS" }] }), "price_changed"],
    ["currency drift", createComposition(), createCatalogReader({ products: [{ id: "product-1", shopId: "shop-1", name: "Sambusa", priceMinor: 750, currency: "USD" }] }), "currency_changed"],
  ] as const)(
    "blocks %s before order persistence",
    async (_caseName, composition, catalogReader, reason) => {
      const createPaidOrderIdempotently = jest.fn();
      const service = new CheckoutPaymentService(
        {
          ...createRepository(),
          createPaidOrderIdempotently,
        },
        {
          botToken: TEST_BOT_TOKEN,
          paymentProviderName: "local-provider",
          paymentSecretToken: "provider-secret",
          now: () => NOW,
        },
        catalogReader,
      );

      await expect(service.checkoutOrder(createFinalizeInput({ composition }))).rejects.toMatchObject({
        code: "COMPOSITION_REPAIR_REQUIRED",
        statusCode: 409,
        details: {
          reason,
          repairAction: "repair_composition",
          orderCreated: false,
        },
      });
      expect(createPaidOrderIdempotently).not.toHaveBeenCalled();
    },
  );

  it("returns the existing order for duplicate trusted payment confirmation", async () => {
    const findOrderByPaymentProviderTxId = jest.fn().mockResolvedValue(createPaidOrderRecord());
    const createPaidOrderIdempotently = jest.fn();
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        findOrderByPaymentProviderTxId,
        createPaidOrderIdempotently,
      },
      {
        botToken: TEST_BOT_TOKEN,
        paymentProviderName: "local-provider",
        paymentSecretToken: "provider-secret",
        now: () => NOW,
      },
    );

    await expect(
      service.checkoutOrder(
        createFinalizeInput({ composition: undefined, payment: { source: "provider_status" } }),
      ),
    ).resolves.toMatchObject({
      id: "order-1",
      paymentProviderTxId: "tx-1",
      paymentStatus: "PAID",
    });
    expect(createPaidOrderIdempotently).not.toHaveBeenCalled();
  });

  it("returns an existing paid order for duplicate confirmation without revalidating stale composition", async () => {
    const findOrderByPaymentProviderTxId = jest.fn().mockResolvedValue(createPaidOrderRecord());
    const createPaidOrderIdempotently = jest.fn();
    const catalogReader = createCatalogReader({ shop: { status: "NOT_WORKING" } });
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        findOrderByPaymentProviderTxId,
        createPaidOrderIdempotently,
      },
      {
        botToken: TEST_BOT_TOKEN,
        paymentProviderName: "local-provider",
        paymentSecretToken: "provider-secret",
        now: () => NOW,
      },
      catalogReader,
    );

    await expect(service.checkoutOrder(createFinalizeInput())).resolves.toMatchObject({
      id: "order-1",
      paymentProviderTxId: "tx-1",
    });
    expect(catalogReader.getCheckoutCompositionSnapshot).not.toHaveBeenCalled();
    expect(createPaidOrderIdempotently).not.toHaveBeenCalled();
  });

  it("rejects client-only payment signals before order creation", async () => {
    const createPaidOrderIdempotently = jest.fn();
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        createPaidOrderIdempotently,
      },
      {
        botToken: TEST_BOT_TOKEN,
        paymentProviderName: "local-provider",
        paymentSecretToken: "provider-secret",
        now: () => NOW,
      },
    );

    await expect(
      service.checkoutOrder(
        createFinalizeInput({ composition: undefined, payment: { source: "client_signal" } }),
      ),
    ).rejects.toEqual(
      new AppError("FORBIDDEN", "Client payment signals are not trusted", 403),
    );
    expect(createPaidOrderIdempotently).not.toHaveBeenCalled();
  });

  it("rejects non-paid confirmations before order creation", async () => {
    const createPaidOrderIdempotently = jest.fn();
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        createPaidOrderIdempotently,
      },
      {
        botToken: TEST_BOT_TOKEN,
        paymentProviderName: "local-provider",
        paymentSecretToken: "provider-secret",
        now: () => NOW,
      },
    );

    await expect(
      service.checkoutOrder(
        createFinalizeInput({ composition: undefined, payment: { status: "PENDING" } }),
      ),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Payment confirmation timed out", 409, {
        paymentStatus: "PENDING",
        failureCategory: "payment_timeout",
        retryable: true,
        retryAction: "retry_checkout",
        orderCreated: false,
      }),
    );
    expect(createPaidOrderIdempotently).not.toHaveBeenCalled();
  });

  it("returns retry-safe details for failed payments without creating an order", async () => {
    const createPaidOrderIdempotently = jest.fn();
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        createPaidOrderIdempotently,
      },
      {
        botToken: TEST_BOT_TOKEN,
        paymentProviderName: "local-provider",
        paymentSecretToken: "provider-secret",
        now: () => NOW,
      },
    );

    await expect(
      service.checkoutOrder(
        createFinalizeInput({ composition: undefined, payment: { status: "FAILED" } }),
      ),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Payment failed", 409, {
        paymentStatus: "FAILED",
        failureCategory: "payment_failed",
        retryable: true,
        retryAction: "retry_checkout",
        orderCreated: false,
      }),
    );
    expect(createPaidOrderIdempotently).not.toHaveBeenCalled();
  });

  it("returns retry-safe details for ambiguous payment confirmation without creating an order", async () => {
    const createPaidOrderIdempotently = jest.fn();
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        createPaidOrderIdempotently,
      },
      {
        botToken: TEST_BOT_TOKEN,
        paymentProviderName: "local-provider",
        paymentSecretToken: "provider-secret",
        now: () => NOW,
      },
    );

    await expect(
      service.checkoutOrder(
        createFinalizeInput({
          composition: undefined,
          payment: {
            paymentProviderTxId: "tx-ambiguous",
            telegramPaymentChargeId: null,
            providerPaymentChargeId: null,
            status: "AMBIGUOUS",
            source: "provider_status",
          },
        }),
      ),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Payment confirmation is ambiguous", 409, {
        paymentStatus: "AMBIGUOUS",
        failureCategory: "payment_ambiguous",
        retryable: true,
        retryAction: "retry_checkout",
        orderCreated: false,
      }),
    );
    expect(createPaidOrderIdempotently).not.toHaveBeenCalled();
  });

  it("serializes canceled payment errors into the project error contract", async () => {
    const service = new CheckoutPaymentService(createRepository(), {
      botToken: TEST_BOT_TOKEN,
      paymentProviderName: "local-provider",
      paymentSecretToken: "provider-secret",
      now: () => NOW,
    });

    const error = await service
      .checkoutOrder(
        createFinalizeInput({
          composition: undefined,
          payment: { status: "CANCELED", source: "provider_status" },
        }),
      )
      .catch((caught: AppError) => caught);

    expect(error).toEqual(
      new AppError("CONFLICT", "Payment was canceled", 409, {
        paymentStatus: "CANCELED",
        failureCategory: "payment_canceled",
        retryable: true,
        retryAction: "retry_checkout",
        orderCreated: false,
      }),
    );
    expect(error).toBeInstanceOf(AppError);

    if (!(error instanceof AppError)) {
      throw new Error("Expected AppError");
    }

    expect(error.toPayload("trace-checkout-1")).toEqual({
      error: {
        code: "CONFLICT",
        message: "Payment was canceled",
        details: {
          paymentStatus: "CANCELED",
          failureCategory: "payment_canceled",
          retryable: true,
          retryAction: "retry_checkout",
          orderCreated: false,
        },
      },
      trace_id: "trace-checkout-1",
    });
  });

  it("validates Telegram initData signatures with HMAC SHA-256", () => {
    const validInitData = createTelegramInitData();

    expect(validateTelegramInitDataSignature(validInitData, TEST_BOT_TOKEN)).toBe(true);
    expect(
      validateTelegramInitDataSignature(`${validInitData}&query_id=tampered`, TEST_BOT_TOKEN),
    ).toBe(false);
  });

  it("enforces Telegram auth_date freshness with 10 minute TTL", () => {
    const authDateNow = Math.floor(NOW.getTime() / 1000);

    expect(isTelegramAuthDateFresh(authDateNow, NOW.getTime(), TELEGRAM_INIT_DATA_TTL_MS)).toBe(
      true,
    );
    expect(
      isTelegramAuthDateFresh(
        authDateNow - TELEGRAM_INIT_DATA_TTL_MS / 1000 - 1,
        NOW.getTime(),
        TELEGRAM_INIT_DATA_TTL_MS,
      ),
    ).toBe(false);
  });

  it("issues an HttpOnly cookie session after validating Telegram initData", async () => {
    const issuedAuthSession: IssueCheckoutPaymentMiniAppSessionResult = {
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
        id: "session-1",
        userId: "user-1",
        sessionTokenHash: "hashed-token",
        expiresAt: new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000),
        revokedAt: null,
      },
    };
    const issueMiniAppSessionWithReplayGuard = jest.fn().mockResolvedValue(issuedAuthSession);
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        issueMiniAppSessionWithReplayGuard,
      },
      {
        botToken: TEST_BOT_TOKEN,
        allowedOrigins: ["https://miniapp.example"],
        now: () => NOW,
        sessionTokenFactory: () => "session-token",
      },
    );

    const result = await service.authenticateTelegram({
      initData: createTelegramInitData(),
      origin: "https://miniapp.example",
    });

    expect(result.user).toEqual({
      id: "user-1",
      telegramId: "42",
      role: "client",
      name: "Khujand Client",
      username: "khujandi_client",
      language: "ru",
      isActive: true,
    });
    expect(result.session.transport).toBe("httpOnlyCookie");
    expect(result.session.cookie).toMatchObject({
      name: "khujandi_mini_app_session",
      value: "session-token",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
    });
    expect(issueMiniAppSessionWithReplayGuard).toHaveBeenCalledWith({
      replayGuard: {
        initDataHash: expect.any(String),
        expiresAt: new Date(NOW.getTime() + TELEGRAM_INIT_DATA_TTL_MS),
      },
      user: {
        telegramId: "42",
        role: "client",
        name: "Khujand Client",
        username: "khujandi_client",
        language: "ru",
        isActive: true,
      },
      sessionTokenHash: expect.any(String),
      sessionExpiresAt: new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000),
    });
  });

  it("rejects replayed Telegram initData when the repository reports an atomic replay conflict", async () => {
    const issueMiniAppSessionWithReplayGuard = jest.fn().mockResolvedValue(null);
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        issueMiniAppSessionWithReplayGuard,
      },
      {
        botToken: TEST_BOT_TOKEN,
        allowedOrigins: ["https://miniapp.example"],
        now: () => NOW,
      },
    );

    await expect(
      service.authenticateTelegram({
        initData: createTelegramInitData(),
        origin: "https://miniapp.example",
      }),
    ).rejects.toEqual(new AppError("AUTH_REQUIRED", "Telegram initData replay detected", 401));
    expect(issueMiniAppSessionWithReplayGuard).toHaveBeenCalledTimes(1);
  });

  it("rejects missing raw initData without auth bypass", async () => {
    const service = new CheckoutPaymentService(createRepository(), {
      botToken: TEST_BOT_TOKEN,
      now: () => NOW,
    });

    await expect(
      service.authenticateTelegram({
        initData: "   ",
      }),
    ).rejects.toEqual(new AppError("VALIDATION_ERROR", "Telegram initData is required", 400));
  });

  it("syncs the explicit authenticated language preference through the repository", async () => {
    const updateTelegramUserLanguage = jest.fn().mockResolvedValue({
      id: "user-1",
      telegramId: "42",
      role: "client",
      name: "Khujand Client",
      username: "khujandi_client",
      language: "en",
      isActive: true,
    } satisfies CheckoutPaymentUserRecord);
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        updateTelegramUserLanguage,
      },
      {
        botToken: TEST_BOT_TOKEN,
        now: () => NOW,
      },
    );

    await expect(
      service.syncLanguagePreference({
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
    expect(updateTelegramUserLanguage).toHaveBeenCalledWith({
      telegramId: "42",
      language: "en",
    });
  });

  it("rejects unsupported language sync values", async () => {
    const updateTelegramUserLanguage = jest.fn();
    const service = new CheckoutPaymentService(
      {
        ...createRepository(),
        updateTelegramUserLanguage,
      },
      {
        botToken: TEST_BOT_TOKEN,
        now: () => NOW,
      },
    );

    await expect(
      service.syncLanguagePreference({
        telegramId: "42",
        language: "de" as "ru",
      }),
    ).rejects.toEqual(
      new AppError("VALIDATION_ERROR", "Language is not supported", 400, {
        language: "de",
      }),
    );
    expect(updateTelegramUserLanguage).not.toHaveBeenCalled();
  });
});
