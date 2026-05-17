import { AppError } from "../../shared/errors/app-error";
import { buildSellerStorefrontPayload } from "../catalog-runtime";
import {
  resolveAdminProvisioningSession,
  resolveCatalogCurationAdminSession,
} from "../admin-access-runtime";
import { resolveMiniAppAuthenticatedUser } from "../checkout-payment-runtime";
import { json, readJsonBody } from "../http-runtime";
import type { DevApiRouteHandler } from "../dev-api-server.types";
import { logStorefrontDebug, summarizeMediaValue } from "../utils/debug-storefront";
import type {
  ProvisionSellerShopInput,
  UpdateSellerShopInput,
} from "../../slices/catalog/domain/catalog.types";

export const handleCatalogRoutes: DevApiRouteHandler = async ({ request, url, method, context }) => {
  const {
    adminAccessModule,
    allowedOrigins,
    catalogModule,
    checkoutPaymentState,
    isDebugEnabled,
    options,
    resolveDebugStorefrontAccess,
  } = context;

  if (method === "GET" && url.pathname === "/api/v1/shops") {
    return json(200, await catalogModule.controller.getShops(), "GET,OPTIONS");
  }

  if (method === "GET" && url.pathname === "/api/v1/showcase") {
    try {
      return json(200, await catalogModule.controller.getStartShowcase(), "GET,OPTIONS");
    } catch {
      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "GET,OPTIONS",
      );
    }
  }

  if (method === "GET" && url.pathname === "/api/v1/admin/catalog/showcase") {
    try {
      await resolveCatalogCurationAdminSession(request, {
        controller: adminAccessModule.controller,
        allowedOrigins,
        now: options.now,
      });

      return json(200, { canCurate: true }, "GET,OPTIONS");
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "GET,OPTIONS");
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "GET,OPTIONS",
      );
    }
  }

  const storefrontMatch = url.pathname.match(/^\/api\/v1\/shops\/([^/]+)$/u);
  const productsMatch = url.pathname.match(/^\/api\/v1\/shops\/([^/]+)\/products$/u);
  const sellerShopMatch = url.pathname.match(/^\/api\/v1\/seller\/shops\/([^/]+)$/u);
  const sellerMenuPageMatch = url.pathname.match(/^\/api\/v1\/seller\/menu-pages\/([^/]+)$/u);
  const sellerProductMatch = url.pathname.match(/^\/api\/v1\/seller\/products\/([^/]+)$/u);
  const adminShowcaseProductMatch = url.pathname.match(/^\/api\/v1\/admin\/catalog\/showcase\/products\/([^/]+)$/u);
  const adminShowcaseShopMatch = url.pathname.match(/^\/api\/v1\/admin\/catalog\/showcase\/shops\/([^/]+)$/u);

  if (method === "GET" && storefrontMatch !== null) {
    try {
      const publicPath = decodeURIComponent(storefrontMatch[1]);
      return json(200, await catalogModule.controller.getStorefront(publicPath), "GET,OPTIONS");
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "GET,OPTIONS");
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "GET,OPTIONS",
      );
    }
  }

  if (method === "GET" && productsMatch !== null) {
    const shopId = decodeURIComponent(productsMatch[1]);
    return json(200, await catalogModule.controller.getProducts(shopId), "GET,OPTIONS");
  }

  if (method === "GET" && url.pathname === "/api/v1/seller/shops") {
    try {
      const user = await resolveMiniAppAuthenticatedUser(request, {
        state: checkoutPaymentState,
        authRequiredMessage: "Seller access requires an authenticated Telegram session",
        now: options.now,
      });
      return json(200, await catalogModule.controller.getSellerShops(user.telegramId), "GET,OPTIONS");
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "GET,OPTIONS");
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "GET,OPTIONS",
      );
    }
  }

  if (method === "GET" && sellerShopMatch !== null) {
    try {
      const shopId = decodeURIComponent(sellerShopMatch[1]);
      const access = await resolveDebugStorefrontAccess(request, shopId);
      const shop = access.shop;
      const [menuPages, products] = await Promise.all([
        catalogModule.repository.listSellerMenuPagesByShop(shop.id),
        catalogModule.repository.listSellerProductsByShop(shop.id),
      ]);
      const payload = buildSellerStorefrontPayload(shop, menuPages, products);

      logStorefrontDebug(isDebugEnabled, "seller-storefront-read", {
        requestedShopRef: shopId,
        resolvedShopId: shop.id,
        actor: access.actorLabel,
        bypassApplied: access.bypassApplied,
        publicPath: payload.publicPath,
        headerImage: summarizeMediaValue(payload.headerImageUrl),
        backgroundImage: summarizeMediaValue(payload.backgroundImageUrl),
        menuPageCount: payload.menuPages.length,
        unpagedProductCount: payload.unpagedProducts.length,
      });

      return json(200, payload, "GET,OPTIONS");
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "GET,OPTIONS");
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "GET,OPTIONS",
      );
    }
  }

  if (method === "PUT" && sellerShopMatch !== null) {
    try {
      const shopId = decodeURIComponent(sellerShopMatch[1]);
      const access = await resolveDebugStorefrontAccess(request, shopId);
      const ownedShop = access.shop;
      const body = await readJsonBody(request);
      const hasField = (field: string): boolean => Object.prototype.hasOwnProperty.call(body, field);
      const updateInput: UpdateSellerShopInput = {
        name: hasField("name") ? String(body.name ?? "") : ownedShop.name,
        description: hasField("description")
          ? body.description == null
            ? null
            : String(body.description)
          : undefined,
        headerImageUrl: hasField("headerImageUrl")
          ? body.headerImageUrl == null
            ? null
            : String(body.headerImageUrl)
          : undefined,
        backgroundImageUrl: hasField("backgroundImageUrl")
          ? body.backgroundImageUrl == null
            ? null
            : String(body.backgroundImageUrl)
          : undefined,
        status:
          body.status === "WORKING" || body.status === "NOT_WORKING"
            ? body.status
            : undefined,
      };

      logStorefrontDebug(isDebugEnabled, "seller-storefront-write-request", {
        requestedShopRef: shopId,
        resolvedShopId: ownedShop.id,
        actor: access.actorLabel,
        bypassApplied: access.bypassApplied,
        beforeHeaderImage: summarizeMediaValue(ownedShop.headerImageUrl),
        beforeBackgroundImage: summarizeMediaValue(ownedShop.backgroundImageUrl),
        input: {
          name: updateInput.name,
          descriptionLength: typeof updateInput.description === "string" ? updateInput.description.length : updateInput.description,
          headerImage: summarizeMediaValue(updateInput.headerImageUrl),
          backgroundImage: summarizeMediaValue(updateInput.backgroundImageUrl),
          status: updateInput.status ?? "unchanged",
        },
      });

      const updatedShop = await catalogModule.controller.updateShop(ownedShop.sellerId, shopId, updateInput);

      logStorefrontDebug(isDebugEnabled, "seller-storefront-write-result", {
        requestedShopRef: shopId,
        resolvedShopId: updatedShop.id,
        actor: access.actorLabel,
        bypassApplied: access.bypassApplied,
        afterHeaderImage: summarizeMediaValue(updatedShop.headerImageUrl),
        afterBackgroundImage: summarizeMediaValue(updatedShop.backgroundImageUrl),
        status: updatedShop.status,
      });

      return json(
        200,
        updatedShop,
        "PUT,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "PUT,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
          "PUT,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "PUT,OPTIONS",
      );
    }
  }

  if (method === "POST" && url.pathname === "/api/v1/seller/menu-pages") {
    try {
      const body = await readJsonBody(request);
      const shopId = String(body.shopId ?? "");
      const access = await resolveDebugStorefrontAccess(request, shopId);
      const ownedShop = access.shop;
      return json(
        201,
        await catalogModule.controller.createMenuPage(ownedShop.sellerId, {
          shopId,
          name: String(body.name ?? ""),
          position: Number(body.position ?? 0),
        }),
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "PUT" && sellerMenuPageMatch !== null) {
    try {
      const body = await readJsonBody(request);
      const shopId = String(body.shopId ?? "");
      const access = await resolveDebugStorefrontAccess(request, shopId);
      const ownedShop = access.shop;
      const menuPageId = decodeURIComponent(sellerMenuPageMatch[1]);
      return json(
        200,
        await catalogModule.controller.updateMenuPage(ownedShop.sellerId, menuPageId, {
          shopId,
          name: String(body.name ?? ""),
        }),
        "PUT,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "PUT,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
          "PUT,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "PUT,OPTIONS",
      );
    }
  }

  if (method === "POST" && url.pathname === "/api/v1/seller/products") {
    try {
      const body = await readJsonBody(request);
      const shopId = String(body.shopId ?? "");
      const access = await resolveDebugStorefrontAccess(request, shopId);
      const ownedShop = access.shop;
      return json(
        201,
        await catalogModule.controller.createProduct(ownedShop.sellerId, {
          shopId,
          menuPageId: body.menuPageId == null ? null : String(body.menuPageId),
          name: String(body.name ?? ""),
          description: body.description == null ? null : String(body.description),
          imageUrl: body.imageUrl == null ? null : String(body.imageUrl),
          priceMinor: Number(body.priceMinor ?? 0),
        }),
        "POST,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "POST,OPTIONS",
      );
    }
  }

  if (method === "PUT" && sellerProductMatch !== null) {
    try {
      const body = await readJsonBody(request);
      const shopId = String(body.shopId ?? "");
      const access = await resolveDebugStorefrontAccess(request, shopId);
      const ownedShop = access.shop;
      const productId = decodeURIComponent(sellerProductMatch[1]);
      return json(
        200,
        await catalogModule.controller.updateProduct(ownedShop.sellerId, productId, {
          shopId,
          menuPageId: body.menuPageId == null ? null : String(body.menuPageId),
          name: String(body.name ?? ""),
          description: body.description == null ? null : String(body.description),
          imageUrl: body.imageUrl == null ? null : String(body.imageUrl),
          priceMinor: Number(body.priceMinor ?? 0),
        }),
        "PUT,OPTIONS",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "PUT,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
          "PUT,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "PUT,OPTIONS",
      );
    }
  }

  if (method === "GET" && url.pathname === "/api/v1/admin/catalog/shops") {
    try {
      await resolveAdminProvisioningSession(request, {
        controller: adminAccessModule.controller,
        allowedOrigins,
        now: options.now,
      });
      return json(200, await catalogModule.controller.getAdminProvisionedShops(), "GET,OPTIONS");
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "GET,OPTIONS");
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "GET,OPTIONS",
      );
    }
  }

  if ((method === "POST" || method === "DELETE") && adminShowcaseProductMatch !== null) {
    try {
      await resolveCatalogCurationAdminSession(request, {
        controller: adminAccessModule.controller,
        allowedOrigins,
        now: options.now,
      });
      const productId = decodeURIComponent(adminShowcaseProductMatch[1]);

      if (method === "POST") {
        await catalogModule.controller.addShowcaseProduct(productId);
        return json(200, { ok: true }, "POST,OPTIONS");
      }

      await catalogModule.controller.unlinkShowcaseProduct(productId);
      return json(200, { ok: true }, "DELETE,OPTIONS");
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), `${method},OPTIONS`);
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        `${method},OPTIONS`,
      );
    }
  }

  if ((method === "POST" || method === "DELETE") && adminShowcaseShopMatch !== null) {
    try {
      await resolveCatalogCurationAdminSession(request, {
        controller: adminAccessModule.controller,
        allowedOrigins,
        now: options.now,
      });
      const shopId = decodeURIComponent(adminShowcaseShopMatch[1]);

      if (method === "POST") {
        await catalogModule.controller.favoriteShop(shopId);
        return json(200, { ok: true }, "POST,OPTIONS");
      }

      await catalogModule.controller.unfavoriteShop(shopId);
      return json(200, { ok: true }, "DELETE,OPTIONS");
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), `${method},OPTIONS`);
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        `${method},OPTIONS`,
      );
    }
  }

  if (method === "POST" && url.pathname === "/api/v1/admin/catalog/shops/provision") {
    try {
      await resolveAdminProvisioningSession(request, {
        controller: adminAccessModule.controller,
        allowedOrigins,
        now: options.now,
      });
      const body = await readJsonBody(request);
      const provisionInput: ProvisionSellerShopInput = {
        sellerId: String(body.sellerId ?? ""),
        telegramId: String(body.telegramId ?? ""),
        name: String(body.name ?? ""),
        description: body.description == null ? undefined : String(body.description),
        headerImageUrl: body.headerImageUrl == null ? undefined : String(body.headerImageUrl),
        backgroundImageUrl: body.backgroundImageUrl == null ? undefined : String(body.backgroundImageUrl),
        status:
          body.status === "WORKING" || body.status === "NOT_WORKING"
            ? body.status
            : undefined,
      };
      const provisioned = await catalogModule.controller.provisionShop(provisionInput);
      return json(201, provisioned, "POST,OPTIONS");
    } catch (error) {
      if (error instanceof AppError) {
        return json(error.statusCode, error.toPayload("trace-catalog-runtime"), "POST,OPTIONS");
      }

      if (error instanceof SyntaxError) {
        return json(
          400,
          new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
          "POST,OPTIONS",
        );
      }

      return json(
        500,
        new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
        "POST,OPTIONS",
      );
    }
  }

  return undefined;
};
