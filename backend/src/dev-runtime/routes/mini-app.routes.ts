import { AppError } from "../../shared/errors/app-error";
import { resolveMiniAppAuthenticatedUser } from "../checkout-payment-runtime";
import { json, readJsonBody, readSingleHeader, serializeCookie } from "../http-runtime";
import { createPaymentProviderUnavailableError } from "../payment-provider-runtime";
import type { DevApiRouteHandler } from "../dev-api-server.types";
import { toCheckoutPaymentCompositionDraft } from "../utils/checkout-composition";
import { buildRuntimePaymentProviderTxId } from "../utils/payment-transaction-id";

export const handleMiniAppRoutes: DevApiRouteHandler = async ({ request, url, method, context }) => {
  const {
    catalogModule,
    catalogState,
    checkoutPaymentModule,
    checkoutPaymentProvider,
    checkoutPaymentState,
    operationalModules,
    options,
  } = context;

  if (method === "POST" && url.pathname === "/api/v1/auth/telegram") {
    try {
      const body = await readJsonBody(request);
      const authResult = await checkoutPaymentModule.controller.authenticateTelegram({
        initData: String(body.initData ?? ""),
        origin: readSingleHeader(request.headers.origin),
        referer: readSingleHeader(request.headers.referer),
      });

      const result = json(
        200,
        {
          user: authResult.user,
          sellerCapabilities: (await catalogModule.repository.listSellerBindingsByTelegramId(authResult.user.telegramId)).length > 0,
        },
        "POST,OPTIONS",
      );
      result.headers["set-cookie"] = [
        serializeCookie(authResult.session.cookie),
      ];
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-mini-app-auth-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-mini-app-auth-runtime"),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Mini App auth runtime is temporarily unavailable", 500).toPayload("trace-mini-app-auth-runtime"),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "POST" && url.pathname === "/api/v1/auth/telegram/language") {
    try {
      const user = await resolveMiniAppAuthenticatedUser(request, {
        state: checkoutPaymentState,
        now: options.now,
      });
      const body = await readJsonBody(request);
      const language = String(body.language ?? "");

      return json(
        200,
        {
          user: await checkoutPaymentModule.controller.syncLanguagePreference({
            telegramId: user.telegramId,
            language: language as "ru" | "en" | "tj",
          }),
        },
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-mini-app-auth-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-mini-app-auth-runtime"),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Mini App auth runtime is temporarily unavailable", 500).toPayload("trace-mini-app-auth-runtime"),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "GET" && url.pathname === "/api/v1/orders/checkout/bootstrap") {
    return json(
      200,
      {
        mockPaymentAvailable:
          checkoutPaymentProvider.enabled && checkoutPaymentProvider.provider === "mock",
      },
      "GET,OPTIONS",
    );
  }

  if (method === "POST" && url.pathname === "/api/v1/orders/checkout") {
    try {
      const user = await resolveMiniAppAuthenticatedUser(request, {
        state: checkoutPaymentState,
        now: options.now,
      });
      const body = await readJsonBody(request);

      if (!checkoutPaymentProvider.enabled) {
        throw createPaymentProviderUnavailableError();
      }

      const composition = toCheckoutPaymentCompositionDraft(body.composition);
      const shop = catalogState.shops.find(
        (candidate) =>
          candidate.primaryPublicPath === composition.shop_public_path ||
          candidate.secondaryPublicPath === composition.shop_public_path,
      );

      if (shop === undefined) {
        throw new AppError("COMPOSITION_REPAIR_REQUIRED", "Shop is not available for checkout", 409, {
          reason: "shop_unavailable",
          repairAction: "repair_composition",
          orderCreated: false,
        });
      }

      const productsById = new Map(catalogState.products.map((product) => [product.id, product]));
      const itemsTotalMinor = composition.items.reduce((total, item) => {
        const product = productsById.get(item.product_id);

        return total + (product?.shopId === shop.id && product.isDeleted !== true ? product.priceMinor * item.quantity : 0);
      }, 0);
      const deliveryFeeMinor = 0;
      const order = await checkoutPaymentModule.controller.checkoutOrder({
        order: {
          shopId: shop.id,
          shopNameSnapshot: shop.name,
          sellerId: shop.sellerId,
          clientId: user.id,
          courierId: null,
          itemsTotalMinor,
          deliveryFeeMinor,
          totalAmountMinor: itemsTotalMinor + deliveryFeeMinor,
        },
        composition,
        payment: {
          provider: checkoutPaymentProvider.providerName,
          paymentProviderTxId: buildRuntimePaymentProviderTxId(user.id, composition),
          telegramPaymentChargeId: null,
          providerPaymentChargeId: null,
          status: options.checkoutPaymentProviderStatusResolver?.({
            userId: user.id,
            composition,
          }) ?? "PAID",
          source: "provider_status",
          verificationToken: checkoutPaymentProvider.secretToken,
        },
      });
      const updatedAt = options.now?.() ?? new Date();

      return json(200, {
        orderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        updated_at: updatedAt.toISOString(),
        revision: operationalModules.getCurrentEventCursor(),
        confirmationLabel: "Order paid and created.",
      });
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-checkout-payment-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-checkout-payment-runtime"),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Checkout runtime is temporarily unavailable", 500).toPayload("trace-checkout-payment-runtime"),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "GET" && url.pathname === "/api/v1/events") {
    try {
      const user = await resolveMiniAppAuthenticatedUser(request, {
        state: checkoutPaymentState,
        now: options.now,
      });
      const customerOrderIds = new Set(
        checkoutPaymentState.orders
          .filter((order) => order.clientId === user.id && order.isDeleted !== true)
          .map((order) => order.id),
      );
      const eventStream = await operationalModules.deliveryTrackingModule.controller.getEventsSince(
        url.searchParams.get("since") ?? undefined,
      );

      return json(
        200,
        {
          events: eventStream.events.filter((event) => customerOrderIds.has(event.entityId)),
          next_cursor: eventStream.nextCursor,
        },
        "GET,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-delivery-tracking-runtime"), "GET,OPTIONS");
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Events runtime is temporarily unavailable", 500).toPayload(
          "trace-delivery-tracking-runtime",
        ),
        "GET,OPTIONS",
      );
    }
  }

  return undefined;
};
