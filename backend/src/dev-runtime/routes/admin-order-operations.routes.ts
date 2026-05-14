import { AppError } from "../../shared/errors/app-error";
import { json, readJsonBody } from "../http-runtime";
import type { DevApiRouteHandler } from "../dev-api-server.types";
import type { DeliveryTrackingOrderStatus } from "../../slices/delivery-tracking/domain/delivery-tracking.types";

const DELIVERY_TRACKING_STATUS_VALUES = new Set<string>([
  "CREATED",
  "DELAYED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_PROGRESS",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED_BY_ADMIN",
  "CANCELLED_BY_COURIER_UNAVAILABLE",
]);

export const handleAdminOrderOperationRoutes: DevApiRouteHandler = async ({ request, url, method, context }) => {
  const { operationalModules, resolveProtectedAdminSession } = context;
  const adminOperatorDeliveryOrdersMatch = url.pathname.match(/^\/api\/v1\/admin\/operator\/delivery\/orders$/u);
  const adminOperatorStatusMatch = url.pathname.match(/^\/api\/v1\/admin\/operator\/delivery\/orders\/([^/]+)\/status$/u);
  const adminOfferTimeoutTickMatch = url.pathname.match(/^\/api\/v1\/admin\/operator\/delivery\/offer-timeouts\/tick$/u);
  const adminBroadcastOfferMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/auto-offers$/u);
  const adminManualOfferMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/assignment-offers$/u);
  const adminAssignmentMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/assignment$/u);
  const adminAssignmentOverrideMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/assignment-override$/u);
  const adminCancellationMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/cancellation$/u);
  const adminRefundMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/refund$/u);

  if (method === "GET" && adminOperatorDeliveryOrdersMatch !== null) {
    try {
      await resolveProtectedAdminSession(request, "Operator delivery orders require an authenticated operator");
      return json(200, operationalModules.listOperatorDeliveryOrders(), "GET,OPTIONS");
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-operator-delivery-runtime"), "GET,OPTIONS");
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Operator delivery runtime is temporarily unavailable", 500).toPayload(
          "trace-operator-delivery-runtime",
        ),
        "GET,OPTIONS",
      );
    }
  }

  if (method === "POST" && adminOperatorStatusMatch !== null) {
    try {
      const session = await resolveProtectedAdminSession(request, "Status control requires an authenticated operator");
      const body = await readJsonBody(request);
      const orderId = decodeURIComponent(adminOperatorStatusMatch[1]);
      const nextStatus = String(body.nextStatus ?? "");

      if (!DELIVERY_TRACKING_STATUS_VALUES.has(nextStatus)) {
        throw new AppError("VALIDATION_ERROR", "Status control nextStatus is invalid", 400, {
          field: "nextStatus",
        });
      }

      return json(
        200,
        await operationalModules.deliveryTrackingModule.controller.recordOperatorStatusTransition({
          orderId,
          nextStatus: nextStatus as DeliveryTrackingOrderStatus,
          actor: {
            userId: session.adminAccountId,
            role: session.role,
            name: session.adminAccountId,
          },
        }),
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-operator-status-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload(
            "trace-operator-status-runtime",
          ),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Operator status runtime is temporarily unavailable", 500).toPayload(
          "trace-operator-status-runtime",
        ),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "POST" && adminOfferTimeoutTickMatch !== null) {
    try {
      await resolveProtectedAdminSession(request, "Offer timeout tick requires an authenticated operator");
      return json(
        200,
        await operationalModules.deliveryAssignmentModule.controller.evaluateOfferTimeouts(),
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-delivery-timeout-runtime"), "POST,OPTIONS");
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Offer timeout runtime is temporarily unavailable", 500).toPayload(
          "trace-delivery-timeout-runtime",
        ),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "POST" && adminBroadcastOfferMatch !== null) {
    try {
      const session = await resolveProtectedAdminSession(request, "Auto-offer broadcast requires an authenticated operator");
      const orderId = decodeURIComponent(adminBroadcastOfferMatch[1]);
      return json(
        201,
        await operationalModules.deliveryAssignmentModule.controller.createBroadcastOffers({
          orderId,
          actor: {
            userId: session.adminAccountId,
            role: session.role,
          },
        }),
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-delivery-auto-offer-runtime"), "POST,OPTIONS");
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Auto-offer runtime is temporarily unavailable", 500).toPayload(
          "trace-delivery-auto-offer-runtime",
        ),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "POST" && adminManualOfferMatch !== null) {
    try {
      const session = await resolveProtectedAdminSession(request, "Manual offer requires an authenticated operator");
      const body = await readJsonBody(request);
      const orderId = decodeURIComponent(adminManualOfferMatch[1]);
      return json(
        201,
        await operationalModules.deliveryAssignmentModule.controller.createManualOffer({
          orderId,
          courierId: String(body.courierId ?? ""),
          actor: {
            userId: session.adminAccountId,
            role: session.role,
          },
        }),
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-delivery-offer-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload(
            "trace-delivery-offer-runtime",
          ),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Manual offer runtime is temporarily unavailable", 500).toPayload(
          "trace-delivery-offer-runtime",
        ),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "POST" && adminAssignmentMatch !== null) {
    try {
      await resolveProtectedAdminSession(request, "Assignment requires an authenticated operator");
      return json(
        410,
        new AppError(
          "LEGACY_ASSIGNMENT_DISABLED",
          "Direct assignment is no longer a normal operator path; use assignment-offers or the explicit assignment override endpoint",
          410,
        ).toPayload("trace-delivery-assignment-runtime"),
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-delivery-assignment-runtime"), "POST,OPTIONS");
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Assignment runtime is temporarily unavailable", 500).toPayload(
          "trace-delivery-assignment-runtime",
        ),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "POST" && adminAssignmentOverrideMatch !== null) {
    try {
      const session = await resolveProtectedAdminSession(request, "Assignment override requires an authenticated operator");
      const body = await readJsonBody(request);
      const orderId = decodeURIComponent(adminAssignmentOverrideMatch[1]);
      return json(
        200,
        await operationalModules.deliveryAssignmentModule.controller.assignCourierOverride({
          orderId,
          courierId: String(body.courierId ?? ""),
          actor: {
            userId: session.adminAccountId,
            role: session.role,
          },
          override: body.confirmDirectAssignmentOverride === true ? { confirmed: true } : null,
        }),
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-delivery-assignment-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload(
            "trace-delivery-assignment-runtime",
          ),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Assignment runtime is temporarily unavailable", 500).toPayload(
          "trace-delivery-assignment-runtime",
        ),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "POST" && adminCancellationMatch !== null) {
    try {
      const session = await resolveProtectedAdminSession(request, "Cancellation requires an authenticated operator");
      const body = await readJsonBody(request);
      const orderId = decodeURIComponent(adminCancellationMatch[1]);
      return json(
        200,
        await operationalModules.orderCancellationModule.controller.cancelOrder({
          orderId,
          reasonCode: String(body.reasonCode ?? ""),
          actor: {
            userId: session.adminAccountId,
            role: session.role,
          },
        }),
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-order-cancellation-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload(
            "trace-order-cancellation-runtime",
          ),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Cancellation runtime is temporarily unavailable", 500).toPayload(
          "trace-order-cancellation-runtime",
        ),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "POST" && adminRefundMatch !== null) {
    try {
      const session = await resolveProtectedAdminSession(request, "Refund tracking requires an authenticated operator");
      const body = await readJsonBody(request);
      const orderId = decodeURIComponent(adminRefundMatch[1]);
      if (body.refundStatus !== "DONE" && body.refundStatus !== "REJECTED") {
        throw new AppError("VALIDATION_ERROR", "Refund status must be DONE or REJECTED", 400, {
          field: "refundStatus",
        });
      }
      return json(
        200,
        await operationalModules.orderCancellationModule.controller.recordRefundUpdate({
          orderId,
          refundStatus: body.refundStatus,
          refundNote: String(body.refundNote ?? ""),
          actor: {
            userId: session.adminAccountId,
            role: session.role,
          },
        }),
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-order-cancellation-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload(
            "trace-order-cancellation-runtime",
          ),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Refund runtime is temporarily unavailable", 500).toPayload(
          "trace-order-cancellation-runtime",
        ),
        "POST,OPTIONS",
      );
    }
  }

  return undefined;
};
