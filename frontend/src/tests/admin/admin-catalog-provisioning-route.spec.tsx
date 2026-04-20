import { act, create, type ReactTestRenderer } from "react-test-renderer";
import {
  AdminCatalogProvisioningApiError,
  type AdminCatalogProvisioningApi,
} from "../../admin/api/admin-catalog-provisioning-api";
import { AdminCatalogProvisioningRoute } from "../../admin/routes/admin-catalog-provisioning-route";

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

const collectText = (node: unknown): string[] => {
  if (typeof node === "string") {
    return [node];
  }

  if (node === null || typeof node !== "object") {
    return [];
  }

  const children = "children" in node ? (node.children as unknown[] | null) : null;

  if (children === null) {
    return [];
  }

  return children.flatMap((child) => collectText(child));
};

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((message: unknown) => {
    if (typeof message === "string" && message.includes("react-test-renderer is deprecated")) {
      return;
    }

    process.stderr.write(String(message));
  });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("admin catalog provisioning route", () => {
  const createApi = (overrides: Partial<AdminCatalogProvisioningApi> = {}): AdminCatalogProvisioningApi => ({
    listProvisionedShops: jest.fn().mockResolvedValue([]),
    submitProvisioning: jest.fn().mockResolvedValue({
      shopId: "shop-42",
      shopName: "Night Bakery",
      shopStatus: "NOT_WORKING",
      sellerId: "seller-42",
      telegramId: "1042",
      primaryPublicPath: "seller-421",
      secondaryPublicPath: "night-bakery",
      menuPagesCount: 2,
      productsCount: 3,
    }),
    ...overrides,
  });

  it("renders the provisioning form inside the admin page shell", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminCatalogProvisioningRoute api={createApi()} />);
      await Promise.resolve();
    });

    const text = collectText(renderer.toJSON()).join(" ");

    expect(text).toContain("Catalog shop provisioning");
    expect(text).toContain("Seller Telegram ID");
    expect(text).toContain("Initial visibility");
    expect(text).toContain("Provisioned shops");
  });

  it("loads existing shops on first render and refreshes the list after provisioning", async () => {
    const api = createApi();
    (api.listProvisionedShops as jest.Mock)
      .mockResolvedValueOnce([
        {
          shopId: "shop-1",
          shopName: "Old Bakery",
          status: "WORKING",
          sellerId: "seller-1",
          telegramId: "1001",
          primaryPublicPath: "seller-11",
          secondaryPublicPath: "old-bakery",
        },
      ])
      .mockResolvedValueOnce([
        {
          shopId: "shop-1",
          shopName: "Old Bakery",
          status: "WORKING",
          sellerId: "seller-1",
          telegramId: "1001",
          primaryPublicPath: "seller-11",
          secondaryPublicPath: "old-bakery",
        },
        {
          shopId: "shop-42",
          shopName: "Night Bakery",
          status: "NOT_WORKING",
          sellerId: "seller-42",
          telegramId: "1042",
          primaryPublicPath: "seller-421",
          secondaryPublicPath: "night-bakery",
        },
      ]);
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminCatalogProvisioningRoute api={api} />);
      await Promise.resolve();
      await Promise.resolve();
    });

    const initialText = collectText(renderer.toJSON()).join(" ");
    expect(initialText).toContain("Old Bakery");
    expect(initialText).toContain("WORKING");
    expect(initialText).toContain("seller-1");
    expect(initialText).toContain("1001");

    await act(async () => {
      const inputs = renderer.root.findAllByType("input");
      inputs[0].props.onChange({ target: { value: "seller-42" } });
      inputs[1].props.onChange({ target: { value: "1042" } });
      inputs[2].props.onChange({ target: { value: "Night Bakery" } });
      inputs[3].props.onChange({ target: { value: "https://example.com/header.png" } });
      inputs[4].props.onChange({ target: { value: "https://example.com/bg.png" } });
      renderer.root.findByType("textarea").props.onChange({ target: { value: "Fresh late-night bakery" } });
      const selects = renderer.root.findAllByType("select");
      selects[0].props.onChange({ target: { value: "NOT_WORKING" } });
      await Promise.resolve();
    });

    await act(async () => {
      renderer.root.findByProps({ "data-admin-provisioning": "form" }).props.onSubmit({
        preventDefault: jest.fn(),
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(api.submitProvisioning).toHaveBeenCalledWith({
      sellerId: "seller-42",
      telegramId: "1042",
      name: "Night Bakery",
      description: "Fresh late-night bakery",
      headerImageUrl: "https://example.com/header.png",
      backgroundImageUrl: "https://example.com/bg.png",
      status: "NOT_WORKING",
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Provisioned Night Bakery (NOT_WORKING) for seller seller-42.");
    expect(text).toContain("Paths: night-bakery / seller-421.");
    expect(text).toContain("Starter pages: 2. Starter products: 3.");
    expect(text).toContain("Old Bakery");
    expect(text).toContain("Night Bakery");
    expect(text).toContain("NOT_WORKING");
    expect(text).toContain("seller-42");
    expect(text).toContain("1042");
    expect(text).toContain("old-bakery / seller-11");
    expect(text).toContain("night-bakery / seller-421");
    expect(api.listProvisionedShops).toHaveBeenCalledTimes(2);
  });

  it("renders controlled API failure feedback", async () => {
    const api = createApi({
      submitProvisioning: jest.fn().mockRejectedValue(
        new AdminCatalogProvisioningApiError("FORBIDDEN", "Admin role cannot provision shops", "trace-admin-7"),
      ),
    });
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminCatalogProvisioningRoute api={api} />);
      await Promise.resolve();
    });

    await act(async () => {
      const inputs = renderer.root.findAllByType("input");
      inputs[0].props.onChange({ target: { value: "seller-42" } });
      inputs[1].props.onChange({ target: { value: "1042" } });
      inputs[2].props.onChange({ target: { value: "Night Bakery" } });
      renderer.root.findByProps({ "data-admin-provisioning": "form" }).props.onSubmit({
        preventDefault: jest.fn(),
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Admin role cannot provision shops (trace: trace-admin-7)");
  });
});
