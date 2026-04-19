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
      menuPagesCount: 2,
      productsCount: 3,
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
});
