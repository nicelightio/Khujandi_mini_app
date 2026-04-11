import type {
  AuthenticateTelegramInput,
  AuthenticateTelegramResult,
  SyncCheckoutPaymentLanguagePreferenceInput,
  FinalizeCheckoutPaymentInput,
  CheckoutPaymentOrderRecord,
  CheckoutPaymentProviderTxId,
  CheckoutPaymentRepository,
  CreateCheckoutPaymentOrderInput,
} from "../domain/checkout-payment.types";
import {
  TELEGRAM_INIT_DATA_TTL_MS,
  buildTelegramDisplayName,
  createMiniAppSessionToken,
  hashSessionToken,
  hashTelegramReplayKey,
  isTelegramAuthDateFresh,
  parseTelegramInitData,
  validateTelegramInitDataSignature,
} from "../domain/telegram-auth";
import { AppError } from "../../../shared/errors/app-error";

export type CheckoutPaymentRuntimeConfig = {
  botToken: string;
  allowedOrigins?: string[];
  initDataTtlMs?: number;
  sessionTtlMs?: number;
  sessionCookieName?: string;
  secureCookies?: boolean;
  paymentProviderName?: string;
  paymentSecretToken?: string;
  now?: () => Date;
  sessionTokenFactory?: () => string;
};

const DEFAULT_SESSION_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const DEFAULT_SESSION_COOKIE_NAME = "khujandi_mini_app_session";
const supportedCheckoutPaymentLanguages = new Set(["ru", "en", "tj"]);

export class CheckoutPaymentService {
  private readonly allowedOrigins: string[];
  private readonly initDataTtlMs: number;
  private readonly sessionTtlMs: number;
  private readonly sessionCookieName: string;
  private readonly secureCookies: boolean;
  private readonly paymentProviderName: string | null;
  private readonly paymentSecretToken: string | null;
  private readonly now: () => Date;
  private readonly sessionTokenFactory: () => string;

  constructor(
    private readonly repository: CheckoutPaymentRepository,
    private readonly authConfig: CheckoutPaymentRuntimeConfig,
  ) {
    this.allowedOrigins = authConfig.allowedOrigins ?? [];
    this.initDataTtlMs = authConfig.initDataTtlMs ?? TELEGRAM_INIT_DATA_TTL_MS;
    this.sessionTtlMs = authConfig.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
    this.sessionCookieName = authConfig.sessionCookieName ?? DEFAULT_SESSION_COOKIE_NAME;
    this.secureCookies = authConfig.secureCookies ?? true;
    this.paymentProviderName = authConfig.paymentProviderName ?? null;
    this.paymentSecretToken = authConfig.paymentSecretToken ?? null;
    this.now = authConfig.now ?? (() => new Date());
    this.sessionTokenFactory = authConfig.sessionTokenFactory ?? createMiniAppSessionToken;
  }

  findOrderByPaymentProviderTxId(
    paymentProviderTxId: CheckoutPaymentProviderTxId,
  ): Promise<CheckoutPaymentOrderRecord | null> {
    return this.repository.findOrderByPaymentProviderTxId(paymentProviderTxId);
  }

  createPaidOrder(input: CreateCheckoutPaymentOrderInput): Promise<CheckoutPaymentOrderRecord> {
    return this.repository.createPaidOrder(input);
  }

  async checkoutOrder(input: FinalizeCheckoutPaymentInput): Promise<CheckoutPaymentOrderRecord> {
    this.assertTrustedPayment(input);

    const existingOrder = await this.repository.findOrderByPaymentProviderTxId(
      input.payment.paymentProviderTxId,
    );

    if (existingOrder !== null) {
      return existingOrder;
    }

    return this.repository.createPaidOrderIdempotently({
      shopId: input.order.shopId,
      shopNameSnapshot: input.order.shopNameSnapshot,
      sellerId: input.order.sellerId,
      clientId: input.order.clientId,
      courierId: input.order.courierId,
      status: "CREATED",
      itemsTotalMinor: input.order.itemsTotalMinor,
      deliveryFeeMinor: input.order.deliveryFeeMinor,
      totalAmountMinor: input.order.totalAmountMinor,
      paymentProvider: input.payment.provider,
      paymentProviderTxId: input.payment.paymentProviderTxId,
      telegramPaymentChargeId: input.payment.telegramPaymentChargeId,
      providerPaymentChargeId: input.payment.providerPaymentChargeId,
      paymentStatus: "PAID",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      isDeleted: false,
    });
  }

  async authenticateTelegram(
    input: AuthenticateTelegramInput,
  ): Promise<AuthenticateTelegramResult> {
    const initData = input.initData.trim();

    if (initData.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Telegram initData is required", 400);
    }

    this.assertAllowedOrigin(input.origin, input.referer);

    const parsed = this.parseAndValidateInitData(initData);
    const now = this.now();
    const nowMs = now.getTime();
    const sessionToken = this.sessionTokenFactory();

    if (!isTelegramAuthDateFresh(parsed.authDate, nowMs, this.initDataTtlMs)) {
      throw new AppError("AUTH_REQUIRED", "Telegram initData has expired", 401, {
        authDate: parsed.authDate,
      });
    }

    const initDataHash = hashTelegramReplayKey(initData);
    const authSession = await this.repository.issueMiniAppSessionWithReplayGuard({
      replayGuard: {
        initDataHash,
        expiresAt: new Date(parsed.authDate * 1000 + this.initDataTtlMs),
      },
      user: {
        telegramId: parsed.user.id,
        role: "client",
        name: buildTelegramDisplayName(parsed.user),
        username: parsed.user.username,
        language: parsed.user.languageCode,
        isActive: true,
      },
      sessionTokenHash: hashSessionToken(sessionToken),
      sessionExpiresAt: new Date(nowMs + this.sessionTtlMs),
    });

    if (authSession === null) {
      throw new AppError("AUTH_REQUIRED", "Telegram initData replay detected", 401);
    }

    return {
      user: authSession.user,
      session: {
        transport: "httpOnlyCookie",
        cookie: {
          name: this.sessionCookieName,
          value: sessionToken,
          httpOnly: true,
          sameSite: "lax",
          secure: this.secureCookies,
          path: "/",
          maxAgeSeconds: Math.floor(this.sessionTtlMs / 1000),
        },
        expiresAt: authSession.session.expiresAt,
        requiresOriginCheck: this.allowedOrigins.length > 0,
      },
    };
  }

  async syncLanguagePreference(
    input: SyncCheckoutPaymentLanguagePreferenceInput,
  ): Promise<AuthenticateTelegramResult["user"]> {
    const telegramId = input.telegramId.trim();
    const language = input.language.trim().toLowerCase();

    if (telegramId.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Telegram id is required", 400);
    }

    if (!supportedCheckoutPaymentLanguages.has(language)) {
      throw new AppError("VALIDATION_ERROR", "Language is not supported", 400, {
        language: input.language,
      });
    }

    return this.repository.updateTelegramUserLanguage({
      telegramId,
      language: language as SyncCheckoutPaymentLanguagePreferenceInput["language"],
    });
  }

  private parseAndValidateInitData(initData: string) {
    try {
      const parsed = parseTelegramInitData(initData);

      if (!validateTelegramInitDataSignature(initData, this.authConfig.botToken)) {
        throw new AppError("AUTH_REQUIRED", "Telegram initData signature is invalid", 401);
      }

      return parsed;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("VALIDATION_ERROR", "Telegram initData payload is invalid", 400);
    }
  }

  private assertTrustedPayment(input: FinalizeCheckoutPaymentInput): void {
    const provider = input.payment.provider.trim();
    const paymentProviderTxId = input.payment.paymentProviderTxId.trim();
    const verificationToken = input.payment.verificationToken?.trim() ?? "";

    if (provider.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Payment provider is required", 400);
    }

    if (paymentProviderTxId.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Payment provider transaction id is required", 400);
    }

    if (input.payment.source === "client_signal") {
      throw new AppError("FORBIDDEN", "Client payment signals are not trusted", 403);
    }

    if (this.paymentProviderName !== null && provider !== this.paymentProviderName) {
      throw new AppError("FORBIDDEN", "Payment provider is not allowed", 403, {
        provider,
      });
    }

    if (this.paymentSecretToken === null || this.paymentSecretToken.trim().length === 0) {
      throw new AppError("INTERNAL_ERROR", "Payment confirmation secret is not configured", 500);
    }

    if (verificationToken !== this.paymentSecretToken) {
      throw new AppError("FORBIDDEN", "Payment confirmation token is invalid", 403);
    }

    if (input.payment.status !== "PAID") {
      throw this.buildPaymentFailureError(input.payment.status);
    }
  }

  private buildPaymentFailureError(
    paymentStatus: FinalizeCheckoutPaymentInput["payment"]["status"],
  ): AppError {
    switch (paymentStatus) {
      case "FAILED":
        return new AppError("CONFLICT", "Payment failed", 409, {
          paymentStatus,
          failureCategory: "payment_failed",
          retryable: true,
          retryAction: "retry_checkout",
          orderCreated: false,
        });
      case "CANCELED":
        return new AppError("CONFLICT", "Payment was canceled", 409, {
          paymentStatus,
          failureCategory: "payment_canceled",
          retryable: true,
          retryAction: "retry_checkout",
          orderCreated: false,
        });
      case "PENDING":
        return new AppError("CONFLICT", "Payment confirmation timed out", 409, {
          paymentStatus,
          failureCategory: "payment_timeout",
          retryable: true,
          retryAction: "retry_checkout",
          orderCreated: false,
        });
      default:
        return new AppError("CONFLICT", "Payment is not confirmed as paid", 409, {
          paymentStatus,
          retryable: true,
          retryAction: "retry_checkout",
          orderCreated: false,
        });
    }
  }

  private assertAllowedOrigin(origin?: string | null, referer?: string | null): void {
    if (this.allowedOrigins.length === 0) {
      return;
    }

    const matchesOrigin = (candidate: string | null | undefined): boolean =>
      candidate !== null &&
      candidate !== undefined &&
      this.allowedOrigins.some((allowedOrigin) => allowedOrigin === candidate);

    if (matchesOrigin(origin)) {
      return;
    }

    if (referer !== null && referer !== undefined) {
      try {
        const refererOrigin = new URL(referer).origin;

        if (matchesOrigin(refererOrigin)) {
          return;
        }
      } catch {
        throw new AppError("FORBIDDEN", "Referer header is invalid", 403);
      }
    }

    throw new AppError("FORBIDDEN", "Origin or Referer is not allowed", 403);
  }
}
