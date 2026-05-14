import { fetchProtectedAdminRoute } from "./admin-protected-api";

export type AdminStaffActiveStatus = "active" | "soft_deleted";

export type AdminCourierStaffRow = {
  courierUserId: string;
  nickname: string | null;
  telegramUserId: string;
  activeStatus: AdminStaffActiveStatus;
  deliveredOrdersCount: number;
  manualRatingAdjustment: number;
  automaticPenalties: number;
  courierOrderRating: number;
  courierAverageReviewRating: number | null;
  courierClientReviewCount: number;
  unsuccessfulOrdersCount: number;
  unsuccessfulPercent: number;
};

export type AdminOperatorStaffRow = {
  operatorAdminAccountId: string;
  nickname: string | null;
  email: string;
  activeStatus: AdminStaffActiveStatus;
  authActive: boolean;
  processedOrdersCount: number;
  manualRatingAdjustment: number;
  operatorRating: number;
};

export type AdminStaffLifecycleAction = "created" | "deactivated" | "reactivated" | "nickname_updated";

export type AdminStaffLifecycleHistoryItem = {
  actorAdminAccountId: string;
  action: AdminStaffLifecycleAction;
  previousNickname: string | null;
  newNickname: string | null;
  reason: string | null;
  createdAt: string;
};

export type AdminStaffRatingAdjustmentHistoryItem = {
  actorAdminAccountId: string;
  delta: AdminStaffRatingDelta;
  reason: string | null;
  createdAt: string;
};

export type AdminCourierStaffOrderProblemReason = "unfinished" | "future_failed" | "client_rating_1";

export type AdminCourierStaffCardOrder = {
  orderId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  clientReviewRating: number | null;
  problemReasons: AdminCourierStaffOrderProblemReason[];
};

export type AdminCourierStaffCard = AdminCourierStaffRow & {
  addedByAdminAccountId: string | null;
  addedAt: string | null;
  deactivatedByAdminAccountId: string | null;
  deactivatedAt: string | null;
  reactivatedByAdminAccountId: string | null;
  reactivatedAt: string | null;
  lifecycleHistory: AdminStaffLifecycleHistoryItem[];
  deactivationHistory: AdminStaffLifecycleHistoryItem[];
  reactivationHistory: AdminStaffLifecycleHistoryItem[];
  manualRatingAdjustmentHistory: AdminStaffRatingAdjustmentHistoryItem[];
  lastOrders: AdminCourierStaffCardOrder[];
  problemOrders: AdminCourierStaffCardOrder[];
};

export type AdminOperatorStaffOrderProblemReason = "future_failed" | "not_personally_completed";

export type AdminOperatorStaffCardOrder = {
  orderId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastWriteAt: string;
  actionTypes: string[];
  personallyCompleted: boolean;
  problemReasons: AdminOperatorStaffOrderProblemReason[];
};

export type AdminOperatorStaffCard = AdminOperatorStaffRow & {
  addedByAdminAccountId: string | null;
  addedAt: string | null;
  deactivatedByAdminAccountId: string | null;
  deactivatedAt: string | null;
  reactivatedByAdminAccountId: string | null;
  reactivatedAt: string | null;
  lifecycleHistory: AdminStaffLifecycleHistoryItem[];
  deactivationHistory: AdminStaffLifecycleHistoryItem[];
  reactivationHistory: AdminStaffLifecycleHistoryItem[];
  manualRatingAdjustmentHistory: AdminStaffRatingAdjustmentHistoryItem[];
  lastProcessedOrders: AdminOperatorStaffCardOrder[];
  problemOrders: AdminOperatorStaffCardOrder[];
};

export type AdminStaffTablesResult = {
  couriers: AdminCourierStaffRow[];
  operators: AdminOperatorStaffRow[];
};

export type AdminStaffListInput = {
  includeInactive?: boolean;
};

export type AdminStaffRatingDelta = 1 | -1;

export type AdminStaffCourierCardInput = {
  courierUserId: string;
  includeInactive?: boolean;
};

export type AdminStaffOperatorCardInput = {
  operatorAdminAccountId: string;
  includeInactive?: boolean;
};

export type AdminStaffCreateCourierInput = {
  telegramUserId: string;
  nickname: string;
};

export type AdminStaffCreateOperatorInput = {
  email: string;
  nickname: string;
  password: string;
};

export type AdminStaffResourceCommandInput = {
  reason?: string | null;
};

export type AdminStaffCourierCommandInput = AdminStaffResourceCommandInput & {
  courierUserId: string;
};

export type AdminStaffOperatorCommandInput = AdminStaffResourceCommandInput & {
  operatorAdminAccountId: string;
};

export type AdminStaffRatingAdjustmentInput = {
  delta: AdminStaffRatingDelta;
  reason?: string | null;
};

export type AdminStaffCourierRatingAdjustmentInput = AdminStaffRatingAdjustmentInput & {
  courierUserId: string;
};

export type AdminStaffOperatorRatingAdjustmentInput = AdminStaffRatingAdjustmentInput & {
  operatorAdminAccountId: string;
};

export type AdminStaffOperatorPasswordResetInput = {
  operatorAdminAccountId: string;
  password: string;
};

export type AdminStaffOperatorNicknameInput = {
  operatorAdminAccountId: string;
  nickname: string;
};

export type AdminStaffCommandResult = {
  ok: true;
};

export type AdminStaffOperatorPasswordResult = {
  oneTimePassword: string;
};

type AdminStaffErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  trace_id?: unknown;
};

export class AdminStaffApiError extends Error {
  readonly code: string;
  readonly traceId: string | null;
  readonly details: unknown;

  constructor(code: string, message: string, traceId: string | null = null, details: unknown = null) {
    super(traceId === null ? message : `${message} (trace: ${traceId})`);
    this.code = code;
    this.traceId = traceId;
    this.details = details;
  }
}

type AdminStaffHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type AdminStaffFetch = (input: string, init?: RequestInit) => Promise<AdminStaffHttpResponse>;

type AdminStaffApiOptions = {
  baseUrl?: string;
  fetch?: AdminStaffFetch;
};

export type AdminStaffApi = {
  listCouriers: (input?: AdminStaffListInput) => Promise<AdminCourierStaffRow[]>;
  listOperators: (input?: AdminStaffListInput) => Promise<AdminOperatorStaffRow[]>;
  listStaffTables: (input?: AdminStaffListInput) => Promise<AdminStaffTablesResult>;
  getCourierCard: (input: AdminStaffCourierCardInput) => Promise<AdminCourierStaffCard>;
  getOperatorCard: (input: AdminStaffOperatorCardInput) => Promise<AdminOperatorStaffCard>;
  createCourier: (input: AdminStaffCreateCourierInput) => Promise<AdminStaffCommandResult>;
  createOperator: (input: AdminStaffCreateOperatorInput) => Promise<AdminStaffOperatorPasswordResult>;
  deactivateCourier: (input: AdminStaffCourierCommandInput) => Promise<AdminStaffCommandResult>;
  deactivateOperator: (input: AdminStaffOperatorCommandInput) => Promise<AdminStaffCommandResult>;
  reactivateCourier: (input: AdminStaffCourierCommandInput) => Promise<AdminStaffCommandResult>;
  reactivateOperator: (input: AdminStaffOperatorCommandInput) => Promise<AdminStaffCommandResult>;
  adjustCourierRating: (input: AdminStaffCourierRatingAdjustmentInput) => Promise<AdminStaffCommandResult>;
  adjustOperatorRating: (input: AdminStaffOperatorRatingAdjustmentInput) => Promise<AdminStaffCommandResult>;
  resetOperatorPassword: (input: AdminStaffOperatorPasswordResetInput) => Promise<AdminStaffOperatorPasswordResult>;
  updateOperatorNickname: (input: AdminStaffOperatorNicknameInput) => Promise<AdminStaffCommandResult>;
};

const defaultFetch: AdminStaffFetch = async (input, init) => {
  const response = await fetch(input, init);

  return {
    ok: response.ok,
    status: response.status,
    json: async () => response.json(),
  };
};

const ensureObject = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const ensureString = (value: unknown, field: string): string => {
  if (typeof value !== "string") {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return value;
};

const ensureNullableString = (value: unknown, field: string): string | null => {
  if (value === null || typeof value === "string") {
    return value;
  }

  throw new Error(`Некорректный payload Staff panel: ${field}.`);
};

const ensureNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return value;
};

const ensureNullableNumber = (value: unknown, field: string): number | null => {
  if (value === null) {
    return null;
  }

  return ensureNumber(value, field);
};

const ensureBoolean = (value: unknown, field: string): boolean => {
  if (typeof value !== "boolean") {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return value;
};

const ensureActiveStatus = (value: unknown, field: string): AdminStaffActiveStatus => {
  if (value === "active" || value === "soft_deleted") {
    return value;
  }

  throw new Error(`Некорректный payload Staff panel: ${field}.`);
};

const ensureRatingDelta = (value: unknown, field: string): AdminStaffRatingDelta => {
  if (value === 1 || value === -1) {
    return value;
  }

  throw new Error(`Некорректный payload Staff panel: ${field}.`);
};

const ensureLifecycleAction = (value: unknown, field: string): AdminStaffLifecycleAction => {
  if (value === "created" || value === "deactivated" || value === "reactivated" || value === "nickname_updated") {
    return value;
  }

  throw new Error(`Некорректный payload Staff panel: ${field}.`);
};

const ensureCourierProblemReason = (value: unknown, field: string): AdminCourierStaffOrderProblemReason => {
  if (value === "unfinished" || value === "future_failed" || value === "client_rating_1") {
    return value;
  }

  throw new Error(`Некорректный payload Staff panel: ${field}.`);
};

const ensureOperatorProblemReason = (value: unknown, field: string): AdminOperatorStaffOrderProblemReason => {
  if (value === "future_failed" || value === "not_personally_completed") {
    return value;
  }

  throw new Error(`Некорректный payload Staff panel: ${field}.`);
};

const ensureStringArray = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return value.map((item, index) => ensureString(item, `${field}.${index}`));
};

const toCourierRow = (value: unknown): AdminCourierStaffRow => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error("Некорректный payload Staff panel: courier.");
  }

  return {
    courierUserId: ensureString(record.courierUserId, "courier.courierUserId"),
    nickname: ensureNullableString(record.nickname, "courier.nickname"),
    telegramUserId: ensureString(record.telegramUserId, "courier.telegramUserId"),
    activeStatus: ensureActiveStatus(record.activeStatus, "courier.activeStatus"),
    deliveredOrdersCount: ensureNumber(record.deliveredOrdersCount, "courier.deliveredOrdersCount"),
    manualRatingAdjustment: ensureNumber(record.manualRatingAdjustment, "courier.manualRatingAdjustment"),
    automaticPenalties: ensureNumber(record.automaticPenalties, "courier.automaticPenalties"),
    courierOrderRating: ensureNumber(record.courierOrderRating, "courier.courierOrderRating"),
    courierAverageReviewRating: ensureNullableNumber(
      record.courierAverageReviewRating,
      "courier.courierAverageReviewRating",
    ),
    courierClientReviewCount: ensureNumber(record.courierClientReviewCount, "courier.courierClientReviewCount"),
    unsuccessfulOrdersCount: ensureNumber(record.unsuccessfulOrdersCount, "courier.unsuccessfulOrdersCount"),
    unsuccessfulPercent: ensureNumber(record.unsuccessfulPercent, "courier.unsuccessfulPercent"),
  };
};

const toOperatorRow = (value: unknown): AdminOperatorStaffRow => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error("Некорректный payload Staff panel: operator.");
  }

  return {
    operatorAdminAccountId: ensureString(record.operatorAdminAccountId, "operator.operatorAdminAccountId"),
    nickname: ensureNullableString(record.nickname, "operator.nickname"),
    email: ensureString(record.email, "operator.email"),
    activeStatus: ensureActiveStatus(record.activeStatus, "operator.activeStatus"),
    authActive: ensureBoolean(record.authActive, "operator.authActive"),
    processedOrdersCount: ensureNumber(record.processedOrdersCount, "operator.processedOrdersCount"),
    manualRatingAdjustment: ensureNumber(record.manualRatingAdjustment, "operator.manualRatingAdjustment"),
    operatorRating: ensureNumber(record.operatorRating, "operator.operatorRating"),
  };
};

const toCourierRows = (value: unknown): AdminCourierStaffRow[] => {
  const record = ensureObject(value);

  if (record === null || !Array.isArray(record.couriers)) {
    throw new Error("Некорректный payload Staff panel: couriers.");
  }

  return record.couriers.map(toCourierRow);
};

const toOperatorRows = (value: unknown): AdminOperatorStaffRow[] => {
  const record = ensureObject(value);

  if (record === null || !Array.isArray(record.operators)) {
    throw new Error("Некорректный payload Staff panel: operators.");
  }

  return record.operators.map(toOperatorRow);
};

const toLifecycleHistoryItem = (value: unknown, field: string): AdminStaffLifecycleHistoryItem => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return {
    actorAdminAccountId: ensureString(record.actorAdminAccountId, `${field}.actorAdminAccountId`),
    action: ensureLifecycleAction(record.action, `${field}.action`),
    previousNickname: ensureNullableString(record.previousNickname, `${field}.previousNickname`),
    newNickname: ensureNullableString(record.newNickname, `${field}.newNickname`),
    reason: ensureNullableString(record.reason, `${field}.reason`),
    createdAt: ensureString(record.createdAt, `${field}.createdAt`),
  };
};

const toRatingAdjustmentHistoryItem = (value: unknown, field: string): AdminStaffRatingAdjustmentHistoryItem => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return {
    actorAdminAccountId: ensureString(record.actorAdminAccountId, `${field}.actorAdminAccountId`),
    delta: ensureRatingDelta(record.delta, `${field}.delta`),
    reason: ensureNullableString(record.reason, `${field}.reason`),
    createdAt: ensureString(record.createdAt, `${field}.createdAt`),
  };
};

const toLifecycleHistory = (value: unknown, field: string): AdminStaffLifecycleHistoryItem[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return value.map((item, index) => toLifecycleHistoryItem(item, `${field}.${index}`));
};

const toRatingAdjustmentHistory = (
  value: unknown,
  field: string,
): AdminStaffRatingAdjustmentHistoryItem[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return value.map((item, index) => toRatingAdjustmentHistoryItem(item, `${field}.${index}`));
};

const toCourierCardOrder = (value: unknown, field: string): AdminCourierStaffCardOrder => {
  const record = ensureObject(value);

  if (record === null || !Array.isArray(record.problemReasons)) {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return {
    orderId: ensureString(record.orderId, `${field}.orderId`),
    status: ensureString(record.status, `${field}.status`),
    createdAt: ensureString(record.createdAt, `${field}.createdAt`),
    updatedAt: ensureString(record.updatedAt, `${field}.updatedAt`),
    clientReviewRating: ensureNullableNumber(record.clientReviewRating, `${field}.clientReviewRating`),
    problemReasons: record.problemReasons.map((item, index) =>
      ensureCourierProblemReason(item, `${field}.problemReasons.${index}`),
    ),
  };
};

const toCourierCardOrders = (value: unknown, field: string): AdminCourierStaffCardOrder[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return value.map((item, index) => toCourierCardOrder(item, `${field}.${index}`));
};

const toOperatorCardOrder = (value: unknown, field: string): AdminOperatorStaffCardOrder => {
  const record = ensureObject(value);

  if (record === null || !Array.isArray(record.problemReasons)) {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return {
    orderId: ensureString(record.orderId, `${field}.orderId`),
    status: ensureString(record.status, `${field}.status`),
    createdAt: ensureString(record.createdAt, `${field}.createdAt`),
    updatedAt: ensureString(record.updatedAt, `${field}.updatedAt`),
    lastWriteAt: ensureString(record.lastWriteAt, `${field}.lastWriteAt`),
    actionTypes: ensureStringArray(record.actionTypes, `${field}.actionTypes`),
    personallyCompleted: ensureBoolean(record.personallyCompleted, `${field}.personallyCompleted`),
    problemReasons: record.problemReasons.map((item, index) =>
      ensureOperatorProblemReason(item, `${field}.problemReasons.${index}`),
    ),
  };
};

const toOperatorCardOrders = (value: unknown, field: string): AdminOperatorStaffCardOrder[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Некорректный payload Staff panel: ${field}.`);
  }

  return value.map((item, index) => toOperatorCardOrder(item, `${field}.${index}`));
};

const toCourierCard = (value: unknown): AdminCourierStaffCard => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error("Некорректный payload Staff panel: courier card.");
  }

  return {
    ...toCourierRow(record),
    addedByAdminAccountId: ensureNullableString(record.addedByAdminAccountId, "courier.addedByAdminAccountId"),
    addedAt: ensureNullableString(record.addedAt, "courier.addedAt"),
    deactivatedByAdminAccountId: ensureNullableString(
      record.deactivatedByAdminAccountId,
      "courier.deactivatedByAdminAccountId",
    ),
    deactivatedAt: ensureNullableString(record.deactivatedAt, "courier.deactivatedAt"),
    reactivatedByAdminAccountId: ensureNullableString(
      record.reactivatedByAdminAccountId,
      "courier.reactivatedByAdminAccountId",
    ),
    reactivatedAt: ensureNullableString(record.reactivatedAt, "courier.reactivatedAt"),
    lifecycleHistory: toLifecycleHistory(record.lifecycleHistory, "courier.lifecycleHistory"),
    deactivationHistory: toLifecycleHistory(record.deactivationHistory, "courier.deactivationHistory"),
    reactivationHistory: toLifecycleHistory(record.reactivationHistory, "courier.reactivationHistory"),
    manualRatingAdjustmentHistory: toRatingAdjustmentHistory(
      record.manualRatingAdjustmentHistory,
      "courier.manualRatingAdjustmentHistory",
    ),
    lastOrders: toCourierCardOrders(record.lastOrders, "courier.lastOrders"),
    problemOrders: toCourierCardOrders(record.problemOrders, "courier.problemOrders"),
  };
};

const toOperatorCard = (value: unknown): AdminOperatorStaffCard => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error("Некорректный payload Staff panel: operator card.");
  }

  return {
    ...toOperatorRow(record),
    addedByAdminAccountId: ensureNullableString(record.addedByAdminAccountId, "operator.addedByAdminAccountId"),
    addedAt: ensureNullableString(record.addedAt, "operator.addedAt"),
    deactivatedByAdminAccountId: ensureNullableString(
      record.deactivatedByAdminAccountId,
      "operator.deactivatedByAdminAccountId",
    ),
    deactivatedAt: ensureNullableString(record.deactivatedAt, "operator.deactivatedAt"),
    reactivatedByAdminAccountId: ensureNullableString(
      record.reactivatedByAdminAccountId,
      "operator.reactivatedByAdminAccountId",
    ),
    reactivatedAt: ensureNullableString(record.reactivatedAt, "operator.reactivatedAt"),
    lifecycleHistory: toLifecycleHistory(record.lifecycleHistory, "operator.lifecycleHistory"),
    deactivationHistory: toLifecycleHistory(record.deactivationHistory, "operator.deactivationHistory"),
    reactivationHistory: toLifecycleHistory(record.reactivationHistory, "operator.reactivationHistory"),
    manualRatingAdjustmentHistory: toRatingAdjustmentHistory(
      record.manualRatingAdjustmentHistory,
      "operator.manualRatingAdjustmentHistory",
    ),
    lastProcessedOrders: toOperatorCardOrders(record.lastProcessedOrders, "operator.lastProcessedOrders"),
    problemOrders: toOperatorCardOrders(record.problemOrders, "operator.problemOrders"),
  };
};

const toCourierCardPayload = (value: unknown): AdminCourierStaffCard => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error("Некорректный payload Staff panel: courier card payload.");
  }

  return toCourierCard(record.courier);
};

const toOperatorCardPayload = (value: unknown): AdminOperatorStaffCard => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error("Некорректный payload Staff panel: operator card payload.");
  }

  return toOperatorCard(record.operator);
};

const toApiError = (payload: unknown, status: number): AdminStaffApiError => {
  const record = ensureObject(payload) as AdminStaffErrorPayload | null;
  const code = typeof record?.error?.code === "string" ? record.error.code : `HTTP_${status}`;
  const message =
    typeof record?.error?.message === "string"
      ? record.error.message
      : "Таблицы Staff panel временно недоступны.";
  const traceId = typeof record?.trace_id === "string" ? record.trace_id : null;

  return new AdminStaffApiError(code, message, traceId, record?.error?.details ?? null);
};

const buildStaffListPath = (
  baseUrl: string,
  resource: "couriers" | "operators",
  includeInactive: boolean,
): string => {
  const path = `${baseUrl}/api/v1/admin/staff/${resource}`;

  return includeInactive ? `${path}?includeInactive=true` : path;
};

const buildStaffCommandPath = (
  baseUrl: string,
  resource: "couriers" | "operators",
  resourceId?: string,
  command?: string,
): string => {
  const path = `${baseUrl}/api/v1/admin/staff/${resource}`;

  if (resourceId === undefined) {
    return path;
  }

  const encodedId = encodeURIComponent(resourceId);

  return command === undefined ? `${path}/${encodedId}` : `${path}/${encodedId}/${command}`;
};

const buildStaffCardPath = (
  baseUrl: string,
  resource: "couriers" | "operators",
  resourceId: string,
  includeInactive: boolean,
): string => {
  const path = buildStaffCommandPath(baseUrl, resource, resourceId);

  return includeInactive ? `${path}?includeInactive=true` : path;
};

const toCommandResult = (value: unknown): AdminStaffCommandResult => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error("Некорректный payload Staff panel: command.");
  }

  return {
    ok: true,
  };
};

const toOperatorPasswordResult = (value: unknown): AdminStaffOperatorPasswordResult => {
  const record = ensureObject(value);

  if (record === null || typeof record.oneTimePassword !== "string") {
    throw new Error("Некорректный payload Staff panel: oneTimePassword.");
  }

  return {
    oneTimePassword: record.oneTimePassword,
  };
};

export const createAdminStaffApi = (options: AdminStaffApiOptions = {}): AdminStaffApi => {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetch ?? defaultFetch;

  const postCommand = async <TResult>(
    path: string,
    body: Record<string, unknown>,
    parseResult: (value: unknown) => TResult,
  ): Promise<TResult> => {
    const response = await fetchProtectedAdminRoute(fetchImpl, baseUrl, path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw toApiError(payload, response.status);
    }

    return parseResult(payload);
  };

  const getCard = async <TResult>(
    path: string,
    parseResult: (value: unknown) => TResult,
  ): Promise<TResult> => {
    const response = await fetchProtectedAdminRoute(fetchImpl, baseUrl, path, {
      method: "GET",
      credentials: "include",
    });
    const payload = await response.json();

    if (!response.ok) {
      throw toApiError(payload, response.status);
    }

    return parseResult(payload);
  };

  const listCouriers = async (input: AdminStaffListInput = {}) => {
    const response = await fetchProtectedAdminRoute(
      fetchImpl,
      baseUrl,
      buildStaffListPath(baseUrl, "couriers", input.includeInactive === true),
      {
        method: "GET",
        credentials: "include",
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      throw toApiError(payload, response.status);
    }

    return toCourierRows(payload);
  };

  const listOperators = async (input: AdminStaffListInput = {}) => {
    const response = await fetchProtectedAdminRoute(
      fetchImpl,
      baseUrl,
      buildStaffListPath(baseUrl, "operators", input.includeInactive === true),
      {
        method: "GET",
        credentials: "include",
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      throw toApiError(payload, response.status);
    }

    return toOperatorRows(payload);
  };

  return {
    listCouriers,
    listOperators,
    listStaffTables: async (input = {}) => {
      const [couriers, operators] = await Promise.all([
        listCouriers(input),
        listOperators(input),
      ]);

      return {
        couriers,
        operators,
      };
    },
    getCourierCard: (input) =>
      getCard(
        buildStaffCardPath(baseUrl, "couriers", input.courierUserId, input.includeInactive === true),
        toCourierCardPayload,
      ),
    getOperatorCard: (input) =>
      getCard(
        buildStaffCardPath(baseUrl, "operators", input.operatorAdminAccountId, input.includeInactive === true),
        toOperatorCardPayload,
      ),
    createCourier: (input) =>
      postCommand(
        buildStaffCommandPath(baseUrl, "couriers"),
        {
          telegram_user_id: input.telegramUserId,
          nickname: input.nickname,
        },
        toCommandResult,
      ),
    createOperator: (input) =>
      postCommand(
        buildStaffCommandPath(baseUrl, "operators"),
        {
          email: input.email,
          nickname: input.nickname,
          password: input.password,
        },
        toOperatorPasswordResult,
      ),
    deactivateCourier: (input) =>
      postCommand(
        buildStaffCommandPath(baseUrl, "couriers", input.courierUserId, "deactivate"),
        {
          reason: input.reason ?? null,
        },
        toCommandResult,
      ),
    deactivateOperator: (input) =>
      postCommand(
        buildStaffCommandPath(baseUrl, "operators", input.operatorAdminAccountId, "deactivate"),
        {
          reason: input.reason ?? null,
        },
        toCommandResult,
      ),
    reactivateCourier: (input) =>
      postCommand(
        buildStaffCommandPath(baseUrl, "couriers", input.courierUserId, "reactivate"),
        {
          reason: input.reason ?? null,
        },
        toCommandResult,
      ),
    reactivateOperator: (input) =>
      postCommand(
        buildStaffCommandPath(baseUrl, "operators", input.operatorAdminAccountId, "reactivate"),
        {
          reason: input.reason ?? null,
        },
        toCommandResult,
      ),
    adjustCourierRating: (input) =>
      postCommand(
        buildStaffCommandPath(baseUrl, "couriers", input.courierUserId, "rating-adjustments"),
        {
          delta: input.delta,
          reason: input.reason ?? null,
        },
        toCommandResult,
      ),
    adjustOperatorRating: (input) =>
      postCommand(
        buildStaffCommandPath(baseUrl, "operators", input.operatorAdminAccountId, "rating-adjustments"),
        {
          delta: input.delta,
          reason: input.reason ?? null,
        },
        toCommandResult,
      ),
    resetOperatorPassword: (input) =>
      postCommand(
        buildStaffCommandPath(baseUrl, "operators", input.operatorAdminAccountId, "password-reset"),
        {
          password: input.password,
        },
        toOperatorPasswordResult,
      ),
    updateOperatorNickname: (input) =>
      postCommand(
        buildStaffCommandPath(baseUrl, "operators", input.operatorAdminAccountId, "nickname"),
        {
          nickname: input.nickname,
        },
        toCommandResult,
      ),
  };
};
