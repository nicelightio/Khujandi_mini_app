import { AppError } from "../../shared/errors/app-error";
import { json, readJsonBody } from "../http-runtime";
import type { DevApiRouteHandler } from "../dev-api-server.types";

export const handleAdminOrderOperationRoutes: DevApiRouteHandler = async ({ request, url, method, context }) => {
  const { operationalModules, resolveProtectedAdminSession } = context;
  const adminAssignmentMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/assignment$/u);
  const adminCancellationMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/cancellation$/u);
  const adminRefundMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/refund$/u);

  if (method === "POST" && adminAssignmentMatch !== null) {
    try {
      const session = await resolveProtectedAdminSession(request, "Assignment requires an authenticated admin");
      const body = await readJsonBody(request);
      const orderId = decodeURIComponent(adminAssignmentMatch[1]);
      return json(
        200,
        await operationalModules.deliveryAssignmentModule.controller.assignCourier({
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
