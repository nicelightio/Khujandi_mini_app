import type { IncomingMessage } from "node:http";
import type { AdminAccessModule } from "../slices/admin-access/presentation/admin-access.module";
import type { resolveProtectedAdminRouteSession } from "../slices/admin-access/presentation/admin-auth-http";
import type { CatalogModule } from "../slices/catalog/presentation/catalog.module";
import type { CheckoutPaymentCompositionDraft, CheckoutPaymentStatus } from "../slices/checkout-payment/domain/checkout-payment.types";
import type { CheckoutPaymentModule } from "../slices/checkout-payment/presentation/checkout-payment.module";
import type { ReviewsFeedbackModule } from "../slices/reviews-feedback/presentation/reviews-feedback.module";
import type { CatalogRuntimeState } from "./catalog-runtime-state";
import type { CheckoutPaymentRuntimeState } from "./checkout-payment-runtime";
import type { createOperationalRuntimeModules } from "./order-ops-runtime";
import type { RuntimeCheckoutPaymentProvider } from "./payment-provider-runtime";
import type { RuntimeMode } from "./runtime-mode";
import type { TelegramBotMessageDispatcher } from "../integrations/telegram-bot/telegram-bot-delivery-assignment.notifier";
import type { TelegramBotRuntime } from "./telegram-bot-runtime";
import type { PrismaAdminAccessOperatorStaffMetricsReader } from "../slices/admin-access/infrastructure/prisma-operator-staff-metrics.reader";
import type { PrismaCourierStaffMetricsReader } from "../slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader";
import type { PrismaOperatorStaffMetricsReader } from "../slices/delivery-tracking/infrastructure/prisma-operator-staff-metrics.reader";
import type { PrismaReviewsFeedbackStaffMetricsReader } from "../slices/reviews-feedback/infrastructure/prisma-staff-metrics.reader";

export type RuntimeServerOptions = {
  host?: string;
  port?: number;
  allowedOrigins?: string[];
  adminDatabasePath?: string;
  catalogDatabasePath?: string;
  telegramBotToken?: string;
  telegramBotPollingEnabled?: boolean;
  telegramBotPollIntervalMs?: number;
  telegramWebhookSecret?: string;
  telegramMessageDispatcher?: TelegramBotMessageDispatcher;
  paymentProvider?: string;
  nodeEnv?: string;
  appEnv?: string;
  isE2eTestModeEnabled?: boolean;
  e2eTestToken?: string;
  isDebugEnabled?: boolean;
  passwordHasher?: {
    verify: (secret: string, secretHash: string) => Promise<boolean>;
  };
  now?: () => Date;
  checkoutPaymentProviderStatusResolver?: (context: {
    userId: string;
    composition: CheckoutPaymentCompositionDraft;
  }) => CheckoutPaymentStatus;
};

export type RuntimeHttpResult = {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string;
};

export type DebugStorefrontAccess = {
  shop: Awaited<ReturnType<CatalogModule["controller"]["getSellerShop"]>>;
  actorLabel: string;
  bypassApplied: boolean;
};

export type DevApiOperationalModules = ReturnType<typeof createOperationalRuntimeModules> & {
  reviewsFeedbackModule: ReviewsFeedbackModule;
  startCompletedReviewPrompts: (orderId: string, revision: string) => Promise<void>;
};

export type DevApiRouteContext = {
  options: RuntimeServerOptions;
  allowedOrigins: string[];
  adminAccessModule: AdminAccessModule;
  catalogModule: CatalogModule;
  checkoutPaymentModule: CheckoutPaymentModule;
  checkoutPaymentState: CheckoutPaymentRuntimeState;
  catalogState: CatalogRuntimeState;
  operationalModules: DevApiOperationalModules;
  telegramBotRuntime: TelegramBotRuntime;
  isTelegramBotApiEnabled: boolean;
  telegramWebhookSecret?: string;
  staffPanelReaders: {
    adminAccessOperatorStaffMetricsReader: PrismaAdminAccessOperatorStaffMetricsReader;
    courierStaffMetricsReader: PrismaCourierStaffMetricsReader;
    operatorStaffMetricsReader: PrismaOperatorStaffMetricsReader;
    reviewsFeedbackStaffMetricsReader: PrismaReviewsFeedbackStaffMetricsReader;
  };
  isDebugEnabled: boolean;
  runtimeMode: RuntimeMode;
  checkoutPaymentProvider: RuntimeCheckoutPaymentProvider;
  stagingTestHarness: {
    reset: (input: { scope?: string }) => {
      ok: true;
      scope: "all";
      catalog: {
        shops: number;
        products: number;
        bindings: number;
      };
      checkoutPayment: {
        users: number;
        orders: number;
        sessions: number;
      };
    };
    seed: (input: { scenario: string }) => {
      ok: true;
      scenario: string;
      catalog: {
        shops: number;
        products: number;
        bindings: number;
        showcaseProducts: number;
        favoriteShops: number;
      };
      checkoutPayment: {
        users: number;
        orders: number;
        sessions: number;
      };
      operational: {
        eventCursor: string;
      };
    };
  };
  resolveProtectedAdminSession: (
    request: IncomingMessage,
    authRequiredMessage: string,
  ) => ReturnType<typeof resolveProtectedAdminRouteSession>;
  resolveDebugStorefrontAccess: (request: IncomingMessage, shopRef: string) => Promise<DebugStorefrontAccess>;
};

export type DevApiRouteInput = {
  request: IncomingMessage;
  url: URL;
  method: string;
  context: DevApiRouteContext;
};

export type DevApiRouteHandler = (input: DevApiRouteInput) => Promise<RuntimeHttpResult | undefined>;
