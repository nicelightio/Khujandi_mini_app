import { AppError } from "../../shared/errors/app-error";
import type { AdminAccessRole } from "../../slices/admin-access/domain/admin-access.types";
import { devRuntimeAdminPasswordHashing } from "../admin-access-runtime";
import type { DevApiRouteHandler, DevApiRouteContext, RuntimeHttpResult } from "../dev-api-server.types";
import { json, readJsonBody } from "../http-runtime";

type StaffPanelSession = {
  adminAccountId: string;
  role: Extract<AdminAccessRole, "admin" | "boss">;
};

const jsonStaff = (statusCode: number, payload: unknown, methods = "GET,POST,OPTIONS"): RuntimeHttpResult =>
  json(
    statusCode,
    JSON.parse(
      JSON.stringify(payload, (_key, value: unknown) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    ) as unknown,
    methods,
  );

const toTracePayload = (error: AppError, traceId: string) => error.toPayload(traceId);

const toInternalError = (message: string) =>
  new AppError("INTERNAL_ERROR", message, 500);

const handleStaffRouteError = (
  error: unknown,
  traceId: string,
  methods = "GET,POST,OPTIONS",
): RuntimeHttpResult => {
  if (error instanceof AppError) {
    return jsonStaff(error.statusCode, toTracePayload(error, traceId), methods);
  }

  if (error instanceof SyntaxError) {
    return jsonStaff(
      400,
      new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload(traceId),
      methods,
    );
  }

  return jsonStaff(
    500,
    toInternalError("Staff panel runtime is temporarily unavailable").toPayload(traceId),
    methods,
  );
};

const resolveStaffPanelSession = async (
  context: DevApiRouteContext,
  request: Parameters<DevApiRouteContext["resolveProtectedAdminSession"]>[0],
): Promise<StaffPanelSession> => {
  const session = await context.resolveProtectedAdminSession(
    request,
    "Staff panel requires an authenticated admin",
  );

  if (session.role !== "admin" && session.role !== "boss") {
    throw new AppError("FORBIDDEN", "Staff panel requires admin or boss access", 403, {
      role: session.role,
    });
  }

  return {
    adminAccountId: session.adminAccountId,
    role: session.role,
  };
};

const resolveIncludeInactive = (session: StaffPanelSession, url: URL): boolean => {
  const requested =
    url.searchParams.get("includeInactive") === "true" ||
    url.searchParams.get("include_inactive") === "true" ||
    url.searchParams.get("archive") === "true";

  if (requested && session.role !== "boss") {
    throw new AppError("FORBIDDEN", "Staff archive requires boss access", 403);
  }

  return requested;
};

const filterVisibleRows = <T extends { activeStatus: "active" | "soft_deleted" }>(
  rows: T[],
  includeInactive: boolean,
): T[] => (includeInactive ? rows : rows.filter((row) => row.activeStatus === "active"));

const listCourierRows = async (context: DevApiRouteContext, includeInactive: boolean) => {
  const firstPass = await context.staffPanelReaders.courierStaffMetricsReader.listCourierStaffTableMetrics();
  const courierIds = firstPass.map((row) => row.courierUserId);
  const averageClientReviewRatings =
    await context.staffPanelReaders.reviewsFeedbackStaffMetricsReader.listCourierAverageClientReviewRatings(
      courierIds,
    );
  const rows = await context.staffPanelReaders.courierStaffMetricsReader.listCourierStaffTableMetrics({
    averageClientReviewRatings,
  });

  return filterVisibleRows(rows, includeInactive);
};

const listCourierCards = async (context: DevApiRouteContext, includeInactive: boolean) => {
  const firstPass = await context.staffPanelReaders.courierStaffMetricsReader.listCourierStaffCards();
  const courierIds = firstPass.map((card) => card.courierUserId);
  const [averageClientReviewRatings, problemClientReviewRatings] = await Promise.all([
    context.staffPanelReaders.reviewsFeedbackStaffMetricsReader.listCourierAverageClientReviewRatings(
      courierIds,
    ),
    context.staffPanelReaders.reviewsFeedbackStaffMetricsReader.listCourierClientRatingOneProblemReviews(
      courierIds,
    ),
  ]);
  const cards = await context.staffPanelReaders.courierStaffMetricsReader.listCourierStaffCards({
    averageClientReviewRatings,
    problemClientReviewRatings,
  });

  return filterVisibleRows(cards, includeInactive);
};

const listOperatorRows = async (context: DevApiRouteContext, includeInactive: boolean) => {
  const firstPass = await context.staffPanelReaders.adminAccessOperatorStaffMetricsReader.listOperatorStaffTableMetrics();
  const operatorIds = firstPass.map((row) => row.operatorAdminAccountId);
  const processedOrderMetrics =
    await context.staffPanelReaders.operatorStaffMetricsReader.listOperatorProcessedOrderMetrics(operatorIds);
  const rows = await context.staffPanelReaders.adminAccessOperatorStaffMetricsReader.listOperatorStaffTableMetrics({
    processedOrderMetrics,
  });

  return filterVisibleRows(rows, includeInactive);
};

const listOperatorCards = async (context: DevApiRouteContext, includeInactive: boolean) => {
  const firstPass = await context.staffPanelReaders.adminAccessOperatorStaffMetricsReader.listOperatorStaffCards();
  const operatorIds = firstPass.map((card) => card.operatorAdminAccountId);
  const [processedOrderMetrics, orderHistories] = await Promise.all([
    context.staffPanelReaders.operatorStaffMetricsReader.listOperatorProcessedOrderMetrics(operatorIds),
    context.staffPanelReaders.operatorStaffMetricsReader.listOperatorStaffOrderHistories(operatorIds),
  ]);
  const cards = await context.staffPanelReaders.adminAccessOperatorStaffMetricsReader.listOperatorStaffCards({
    processedOrderMetrics,
    orderHistories,
  });

  return filterVisibleRows(cards, includeInactive);
};

const resolveRatingDelta = (value: unknown): 1 | -1 => {
  if (value === 1 || value === "+1" || value === "1") {
    return 1;
  }

  if (value === -1 || value === "-1") {
    return -1;
  }

  throw new AppError("VALIDATION_ERROR", "Rating adjustment delta must be +1 or -1", 400, {
    delta:
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
        ? value
        : null,
  });
};

export const handleAdminStaffRoutes: DevApiRouteHandler = async ({ request, url, method, context }) => {
  const couriersRootMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/couriers$/u);
  const courierCardMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/couriers\/([^/]+)$/u);
  const courierDeactivateMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/couriers\/([^/]+)\/deactivate$/u);
  const courierReactivateMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/couriers\/([^/]+)\/reactivate$/u);
  const courierRatingMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/couriers\/([^/]+)\/rating-adjustments$/u);
  const operatorsRootMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/operators$/u);
  const operatorCardMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/operators\/([^/]+)$/u);
  const operatorDeactivateMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/operators\/([^/]+)\/deactivate$/u);
  const operatorReactivateMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/operators\/([^/]+)\/reactivate$/u);
  const operatorRatingMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/operators\/([^/]+)\/rating-adjustments$/u);
  const operatorPasswordResetMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/operators\/([^/]+)\/password-reset$/u);
  const operatorNicknameMatch = url.pathname.match(/^\/api\/v1\/admin\/staff\/operators\/([^/]+)\/nickname$/u);
  const isStaffRoute = [
    couriersRootMatch,
    courierCardMatch,
    courierDeactivateMatch,
    courierReactivateMatch,
    courierRatingMatch,
    operatorsRootMatch,
    operatorCardMatch,
    operatorDeactivateMatch,
    operatorReactivateMatch,
    operatorRatingMatch,
    operatorPasswordResetMatch,
    operatorNicknameMatch,
  ].some((match) => match !== null);

  if (!isStaffRoute) {
    return undefined;
  }

  try {
    const session = await resolveStaffPanelSession(context, request);
    const includeInactive = resolveIncludeInactive(session, url);

    if (method === "GET" && couriersRootMatch !== null) {
      return jsonStaff(200, { couriers: await listCourierRows(context, includeInactive) }, "GET,OPTIONS");
    }

    if (method === "GET" && courierCardMatch !== null) {
      const courierUserId = decodeURIComponent(courierCardMatch[1]);
      const card = (await listCourierCards(context, includeInactive)).find(
        (candidate) => candidate.courierUserId === courierUserId,
      );

      if (card === undefined) {
        throw new AppError("COURIER_STAFF_NOT_FOUND", "Courier staff was not found", 404, {
          courierUserId,
        });
      }

      return jsonStaff(200, { courier: card }, "GET,OPTIONS");
    }

    if (method === "GET" && operatorsRootMatch !== null) {
      return jsonStaff(200, { operators: await listOperatorRows(context, includeInactive) }, "GET,OPTIONS");
    }

    if (method === "GET" && operatorCardMatch !== null) {
      const operatorAdminAccountId = decodeURIComponent(operatorCardMatch[1]);
      const card = (await listOperatorCards(context, includeInactive)).find(
        (candidate) => candidate.operatorAdminAccountId === operatorAdminAccountId,
      );

      if (card === undefined) {
        throw new AppError("OPERATOR_NOT_FOUND", "Operator staff account was not found", 404, {
          operatorAdminAccountId,
        });
      }

      return jsonStaff(200, { operator: card }, "GET,OPTIONS");
    }

    if (method !== "POST") {
      return jsonStaff(
        405,
        new AppError("METHOD_NOT_ALLOWED", "Method is not allowed", 405).toPayload("trace-admin-staff-runtime"),
      );
    }

    const body = await readJsonBody(request);

    if (couriersRootMatch !== null) {
      return jsonStaff(
        201,
        await context.operationalModules.deliveryAssignmentModule.service.createCourierStaff({
          actor: {
            adminAccountId: session.adminAccountId,
            role: session.role,
          },
          telegramUserId: String(body.telegram_user_id ?? ""),
          nickname: String(body.nickname ?? ""),
          now: context.options.now?.(),
        }),
      );
    }

    if (courierDeactivateMatch !== null) {
      return jsonStaff(
        200,
        await context.operationalModules.deliveryAssignmentModule.service.deactivateCourierStaff({
          actor: {
            adminAccountId: session.adminAccountId,
            role: session.role,
          },
          courierUserId: decodeURIComponent(courierDeactivateMatch[1]),
          reason: typeof body.reason === "string" ? body.reason : null,
          now: context.options.now?.(),
        }),
      );
    }

    if (courierReactivateMatch !== null) {
      return jsonStaff(
        200,
        await context.operationalModules.deliveryAssignmentModule.service.reactivateCourierStaff({
          actor: {
            adminAccountId: session.adminAccountId,
            role: session.role,
          },
          courierUserId: decodeURIComponent(courierReactivateMatch[1]),
          reason: typeof body.reason === "string" ? body.reason : null,
          now: context.options.now?.(),
        }),
      );
    }

    if (courierRatingMatch !== null) {
      return jsonStaff(
        201,
        await context.operationalModules.deliveryAssignmentModule.service.adjustCourierStaffRating({
          actor: {
            adminAccountId: session.adminAccountId,
            role: session.role,
          },
          courierUserId: decodeURIComponent(courierRatingMatch[1]),
          delta: resolveRatingDelta(body.delta),
          reason: typeof body.reason === "string" ? body.reason : null,
          now: context.options.now?.(),
        }),
      );
    }

    if (operatorsRootMatch !== null) {
      const requestedRole = typeof body.role === "string" ? body.role.toLowerCase() as AdminAccessRole : undefined;

      return jsonStaff(
        201,
        await context.adminAccessModule.controller.createOperatorStaffAccount(
          {
            actorAdminAccountId: session.adminAccountId,
            login: String(body.email ?? ""),
            nickname: String(body.nickname ?? ""),
            password: String(body.password ?? ""),
            role: requestedRole,
            now: context.options.now?.(),
          },
          {
            passwordHashing: devRuntimeAdminPasswordHashing,
          },
        ),
      );
    }

    if (operatorDeactivateMatch !== null) {
      return jsonStaff(
        200,
        await context.adminAccessModule.controller.deactivateOperatorStaff({
          actorAdminAccountId: session.adminAccountId,
          operatorAdminAccountId: decodeURIComponent(operatorDeactivateMatch[1]),
          reason: typeof body.reason === "string" ? body.reason : null,
          now: context.options.now?.(),
        }),
      );
    }

    if (operatorReactivateMatch !== null) {
      return jsonStaff(
        200,
        await context.adminAccessModule.controller.reactivateOperatorStaff({
          actorAdminAccountId: session.adminAccountId,
          operatorAdminAccountId: decodeURIComponent(operatorReactivateMatch[1]),
          reason: typeof body.reason === "string" ? body.reason : null,
          now: context.options.now?.(),
        }),
      );
    }

    if (operatorRatingMatch !== null) {
      return jsonStaff(
        201,
        await context.adminAccessModule.controller.adjustOperatorStaffRating({
          actorAdminAccountId: session.adminAccountId,
          operatorAdminAccountId: decodeURIComponent(operatorRatingMatch[1]),
          delta: resolveRatingDelta(body.delta),
          reason: typeof body.reason === "string" ? body.reason : null,
          now: context.options.now?.(),
        }),
      );
    }

    if (operatorPasswordResetMatch !== null) {
      return jsonStaff(
        200,
        await context.adminAccessModule.controller.resetOperatorStaffPassword(
          {
            actorAdminAccountId: session.adminAccountId,
            operatorAdminAccountId: decodeURIComponent(operatorPasswordResetMatch[1]),
            password: String(body.password ?? ""),
            now: context.options.now?.(),
          },
          {
            passwordHashing: devRuntimeAdminPasswordHashing,
          },
        ),
      );
    }

    if (operatorNicknameMatch !== null) {
      return jsonStaff(
        200,
        await context.adminAccessModule.controller.updateOperatorStaffNickname({
          actorAdminAccountId: session.adminAccountId,
          operatorAdminAccountId: decodeURIComponent(operatorNicknameMatch[1]),
          nickname: String(body.nickname ?? ""),
          now: context.options.now?.(),
        }),
      );
    }

    return undefined;
  } catch (error) {
    return handleStaffRouteError(error, "trace-admin-staff-runtime");
  }
};
