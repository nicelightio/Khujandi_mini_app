import {
  AdminCatalogProvisioningApiError,
  createAdminCatalogProvisioningApi,
} from "../../admin/api/admin-catalog-provisioning-api";

describe("admin catalog provisioning api", () => {
  it("loads the admin provisioning shop list from the backend read path", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          shopId: "shop-1",
          shopName: "Night Bakery",
          status: "NOT_WORKING",
          sellerId: "seller-42",
          telegramId: "1042",
          primaryPublicPath: "seller-421",
          secondaryPublicPath: "night-bakery",
        },
      ],
    });

    await expect(
      createAdminCatalogProvisioningApi({ fetch: fetchMock }).listProvisionedShops(),
    ).resolves.toEqual([
      {
        shopId: "shop-1",
        shopName: "Night Bakery",
        status: "NOT_WORKING",
        sellerId: "seller-42",
        telegramId: "1042",
        primaryPublicPath: "seller-421",
        secondaryPublicPath: "night-bakery",
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/catalog/shops", {
      method: "GET",
      credentials: "include",
    });
  });

  it("posts provisioning input to the protected admin command path", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        shop: {
          id: "shop-42",
          name: "Night Bakery",
          primaryPublicPath: "seller-421",
          secondaryPublicPath: "night-bakery",
          status: "NOT_WORKING",
        },
        binding: {
          sellerId: "seller-42",
          telegramId: "1042",
        },
        menuPages: [{ id: "page-1" }, { id: "page-2" }],
        products: [{ id: "product-1" }, { id: "product-2" }, { id: "product-3" }],
      }),
    });

    await expect(
      createAdminCatalogProvisioningApi({ fetch: fetchMock }).submitProvisioning({
        sellerId: "seller-42",
        telegramId: "1042",
        name: "Night Bakery",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "NOT_WORKING",
      }),
    ).resolves.toEqual({
      shopId: "shop-42",
      shopName: "Night Bakery",
      shopStatus: "NOT_WORKING",
      sellerId: "seller-42",
      telegramId: "1042",
      primaryPublicPath: "seller-421",
      secondaryPublicPath: "night-bakery",
      menuPagesCount: 2,
      productsCount: 3,
    });
  });

  it("refreshes the protected admin session once and retries provisioning after auth-required", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: "AUTH_REQUIRED",
            message: "Provisioning requires an authenticated admin",
          },
          trace_id: "trace-auth-required",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          session: {
            adminAccountId: "admin-account-1",
            role: "boss",
            accessTokenExpiresAt: "2026-04-21T12:15:00.000Z",
            refreshTokenExpiresAt: "2026-04-24T12:00:00.000Z",
            idleExpiresAt: "2026-04-21T12:30:00.000Z",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          shop: {
            id: "shop-42",
            name: "Night Bakery",
            primaryPublicPath: "seller-421",
            secondaryPublicPath: "night-bakery",
            status: "WORKING",
          },
          binding: {
            sellerId: "seller-42",
            telegramId: "1042",
          },
          menuPages: [{ id: "page-1" }],
          products: [{ id: "product-1" }],
        }),
      });

    await expect(
      createAdminCatalogProvisioningApi({ fetch: fetchMock }).submitProvisioning({
        sellerId: "seller-42",
        telegramId: "1042",
        name: "Night Bakery",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "WORKING",
      }),
    ).resolves.toEqual({
      shopId: "shop-42",
      shopName: "Night Bakery",
      shopStatus: "WORKING",
      sellerId: "seller-42",
      telegramId: "1042",
      primaryPublicPath: "seller-421",
      secondaryPublicPath: "night-bakery",
      menuPagesCount: 1,
      productsCount: 1,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/admin/catalog/shops/provision", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        sellerId: "seller-42",
        telegramId: "1042",
        name: "Night Bakery",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "WORKING",
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/admin/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/v1/admin/catalog/shops/provision", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        sellerId: "seller-42",
        telegramId: "1042",
        name: "Night Bakery",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "WORKING",
      }),
    });
  });

  it("maps read-path failures to the project error contract", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: {
          code: "FORBIDDEN",
          message: "User role cannot provision seller shops",
        },
        trace_id: "trace-admin-catalog-list",
      }),
    });

    await expect(
      createAdminCatalogProvisioningApi({ fetch: fetchMock }).listProvisionedShops(),
    ).rejects.toEqual(
      new AdminCatalogProvisioningApiError(
        "FORBIDDEN",
        "User role cannot provision seller shops",
        "trace-admin-catalog-list",
      ),
    );
  });

  it("rejects the legacy provisioned shops payload shape without fallback", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          shop: {
            id: "shop-1",
            name: "Night Bakery",
            status: "NOT_WORKING",
            primaryPublicPath: "seller-421",
            secondaryPublicPath: "night-bakery",
          },
          binding: {
            sellerId: "seller-42",
            telegramId: "1042",
          },
        },
      ],
    });

    await expect(
      createAdminCatalogProvisioningApi({ fetch: fetchMock }).listProvisionedShops(),
    ).rejects.toThrow("Provisioned shops payload is invalid.");
  });
});
