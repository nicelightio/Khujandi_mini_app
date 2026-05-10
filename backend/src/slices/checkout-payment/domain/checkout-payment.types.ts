export type CheckoutPaymentOrderId = string;
export type CheckoutPaymentShopId = string;
export type CheckoutPaymentSellerId = string;
export type CheckoutPaymentClientId = string;
export type CheckoutPaymentCourierId = string;
export type CheckoutPaymentProviderTxId = string;
export type TelegramPaymentChargeId = string;
export type ProviderPaymentChargeId = string;
export type CheckoutPaymentTelegramId = string;
export type CheckoutPaymentLanguage = "ru" | "en" | "tj";
export type CheckoutPaymentInitDataHash = string;
export type CheckoutPaymentSessionId = string;
export type CheckoutPaymentSessionTokenHash = string;
export type CheckoutPaymentUserRole =
  | "boss"
  | "manager"
  | "operator"
  | "admin"
  | "seller"
  | "courier"
  | "client";

export type CheckoutPaymentOrderStatus =
  | "CREATED"
  | "DELAYED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED_BY_ADMIN"
  | "CANCELLED_BY_COURIER_UNAVAILABLE";

export type CheckoutPaymentStatus = "PAID" | "FAILED" | "CANCELED" | "PENDING" | "AMBIGUOUS";
export type CheckoutPaymentConfirmationSource =
  | "provider_callback"
  | "provider_status"
  | "client_signal";

export type CheckoutPaymentRefundStatus =
  | "NOT_REQUIRED"
  | "PENDING_MANUAL"
  | "DONE"
  | "REJECTED";

export type CheckoutPaymentOrderRecord = {
  id: CheckoutPaymentOrderId;
  shopId: CheckoutPaymentShopId;
  shopNameSnapshot: string;
  sellerId: CheckoutPaymentSellerId;
  clientId: CheckoutPaymentClientId;
  courierId: CheckoutPaymentCourierId | null;
  status: CheckoutPaymentOrderStatus;
  itemsTotalMinor: number;
  deliveryFeeMinor: number;
  totalAmountMinor: number;
  paymentProvider: string;
  paymentProviderTxId: CheckoutPaymentProviderTxId;
  telegramPaymentChargeId: TelegramPaymentChargeId | null;
  providerPaymentChargeId: ProviderPaymentChargeId | null;
  paymentStatus: CheckoutPaymentStatus;
  refundStatus: CheckoutPaymentRefundStatus;
  refundNote: string | null;
  isDeleted: boolean;
};

export type CheckoutPaymentUserRecord = {
  id: string;
  telegramId: CheckoutPaymentTelegramId;
  role: CheckoutPaymentUserRole;
  name: string;
  username: string | null;
  language: string | null;
  isActive: boolean;
};

export type UpsertCheckoutPaymentUserInput = Pick<
  CheckoutPaymentUserRecord,
  "telegramId" | "role" | "name" | "username" | "language" | "isActive"
>;

export type CheckoutPaymentReplayGuardRecord = {
  initDataHash: CheckoutPaymentInitDataHash;
  expiresAt: Date;
};

export type StoreCheckoutPaymentReplayGuardInput = CheckoutPaymentReplayGuardRecord;

export type IssueCheckoutPaymentMiniAppSessionInput = {
  replayGuard: StoreCheckoutPaymentReplayGuardInput;
  user: UpsertCheckoutPaymentUserInput;
  sessionTokenHash: CheckoutPaymentSessionTokenHash;
  sessionExpiresAt: Date;
};

export type IssueCheckoutPaymentMiniAppSessionResult = {
  user: CheckoutPaymentUserRecord;
  session: CheckoutPaymentMiniAppSessionRecord;
};

export type CheckoutPaymentMiniAppSessionRecord = {
  id: CheckoutPaymentSessionId;
  userId: string;
  sessionTokenHash: CheckoutPaymentSessionTokenHash;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type CreateCheckoutPaymentMiniAppSessionInput = Pick<
  CheckoutPaymentMiniAppSessionRecord,
  "userId" | "sessionTokenHash" | "expiresAt"
>;

export type AuthenticateTelegramInput = {
  initData: string;
  origin?: string | null;
  referer?: string | null;
};

export type CheckoutPaymentAuthCookie = {
  name: string;
  value: string;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAgeSeconds: number;
};

export type AuthenticateTelegramResult = {
  user: CheckoutPaymentUserRecord;
  session: {
    transport: "httpOnlyCookie";
    cookie: CheckoutPaymentAuthCookie;
    expiresAt: Date;
    requiresOriginCheck: boolean;
  };
};

export type SyncCheckoutPaymentLanguagePreferenceInput = {
  telegramId: CheckoutPaymentTelegramId;
  language: CheckoutPaymentLanguage;
};

export type CheckoutPaymentOrderDraftInput = {
  shopId: CheckoutPaymentShopId;
  shopNameSnapshot: string;
  sellerId: CheckoutPaymentSellerId;
  clientId: CheckoutPaymentClientId;
  courierId: CheckoutPaymentCourierId | null;
  itemsTotalMinor: number;
  deliveryFeeMinor: number;
  totalAmountMinor: number;
};

export type CheckoutPaymentCompositionDraft = {
  composition_id?: string;
  shop_public_path: string;
  shop_id?: CheckoutPaymentShopId;
  items: Array<{
    product_id: string;
    quantity: number;
    display_snapshot: {
      product_name: string;
      unit_price_minor: number;
      currency: string;
    };
  }>;
  preview_total: {
    amount_minor: number;
    currency: string;
  };
  created_at?: string;
};

export type CheckoutPaymentCatalogCompositionSnapshot = {
  shop: {
    id: CheckoutPaymentShopId;
    sellerId: CheckoutPaymentSellerId;
    name: string;
    status: "WORKING" | "NOT_WORKING";
    isDeleted: boolean;
  };
  products: Array<{
    id: string;
    shopId: CheckoutPaymentShopId;
    name: string;
    priceMinor: number;
    currency?: string;
    isDeleted?: boolean;
  }>;
};

export interface CheckoutPaymentCatalogCompositionReader {
  getCheckoutCompositionSnapshot(
    shopPublicPath: string,
  ): Promise<CheckoutPaymentCatalogCompositionSnapshot | null>;
}

export type FinalizeCheckoutPaymentInput = {
  order: CheckoutPaymentOrderDraftInput;
  composition?: CheckoutPaymentCompositionDraft;
  payment: {
    provider: string;
    paymentProviderTxId: CheckoutPaymentProviderTxId;
    telegramPaymentChargeId: TelegramPaymentChargeId | null;
    providerPaymentChargeId: ProviderPaymentChargeId | null;
    status: CheckoutPaymentStatus;
    source: CheckoutPaymentConfirmationSource;
    verificationToken?: string | null;
  };
};

export type CreateCheckoutPaymentOrderInput = Pick<
  CheckoutPaymentOrderRecord,
  | "shopId"
  | "shopNameSnapshot"
  | "sellerId"
  | "clientId"
  | "courierId"
  | "status"
  | "itemsTotalMinor"
  | "deliveryFeeMinor"
  | "totalAmountMinor"
  | "paymentProvider"
  | "paymentProviderTxId"
  | "telegramPaymentChargeId"
  | "providerPaymentChargeId"
  | "paymentStatus"
  | "refundStatus"
  | "refundNote"
  | "isDeleted"
>;

export interface CheckoutPaymentRepository {
  findOrderByPaymentProviderTxId(
    paymentProviderTxId: CheckoutPaymentProviderTxId,
  ): Promise<CheckoutPaymentOrderRecord | null>;
  createPaidOrder(input: CreateCheckoutPaymentOrderInput): Promise<CheckoutPaymentOrderRecord>;
  createPaidOrderIdempotently(
    input: CreateCheckoutPaymentOrderInput,
  ): Promise<CheckoutPaymentOrderRecord>;
  upsertTelegramUser(input: UpsertCheckoutPaymentUserInput): Promise<CheckoutPaymentUserRecord>;
  findReplayGuardByInitDataHash(
    initDataHash: CheckoutPaymentInitDataHash,
  ): Promise<CheckoutPaymentReplayGuardRecord | null>;
  storeReplayGuard(
    input: StoreCheckoutPaymentReplayGuardInput,
  ): Promise<CheckoutPaymentReplayGuardRecord>;
  issueMiniAppSessionWithReplayGuard(
    input: IssueCheckoutPaymentMiniAppSessionInput,
  ): Promise<IssueCheckoutPaymentMiniAppSessionResult | null>;
  createMiniAppSession(
    input: CreateCheckoutPaymentMiniAppSessionInput,
  ): Promise<CheckoutPaymentMiniAppSessionRecord>;
  updateTelegramUserLanguage(
    input: SyncCheckoutPaymentLanguagePreferenceInput,
  ): Promise<CheckoutPaymentUserRecord>;
}
