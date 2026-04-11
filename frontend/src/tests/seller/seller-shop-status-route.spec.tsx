import { act, create, type ReactTestRenderer } from "react-test-renderer";
import {
  SellerShopStatusApiError,
  type SellerShopStatusApi,
} from "../../seller/api/seller-shop-status-api";
import { SellerShopStatusRoute } from "../../seller/routes/seller-shop-status-route";

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

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

describe("seller shop status route", () => {
  const ownedShop = {
    id: "shop-1",
    name: "Night Bakery",
    description: null,
    headerImageUrl: null,
    backgroundImageUrl: null,
    status: "NOT_WORKING" as const,
  };

  const createApi = (overrides: Partial<SellerShopStatusApi> = {}): SellerShopStatusApi => ({
    listOwnedShops: jest.fn().mockResolvedValue([ownedShop]),
    updateShopStatus: jest.fn().mockImplementation(async (input) => ({
      ...ownedShop,
      status: input.status,
    })),
    ...overrides,
  });

  it("loads owned shops and renders the narrow status form", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<SellerShopStatusRoute api={createApi()} />);
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");

    expect(text).toContain("Choose one owned shop and toggle WORKING or NOT_WORKING");
    expect(text).toContain("Save status");
    expect(text).toContain("No separate seller password exists.");
    expect(text).not.toContain("Delete");
  });

  it("submits a status toggle for the selected owned shop", async () => {
    const api = createApi();
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<SellerShopStatusRoute api={api} />);
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findAllByType("select")[1].props.onChange({ target: { value: "WORKING" } });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({ "data-seller-status": "form" }).props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    expect(api.updateShopStatus).toHaveBeenCalledWith({
      id: "shop-1",
      status: "WORKING",
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Shop Night Bakery is now WORKING.");
  });

  it("renders explicit unauthenticated feedback when seller session is missing", async () => {
    const api = createApi({
      listOwnedShops: jest.fn().mockRejectedValue(
        new SellerShopStatusApiError(
          "AUTH_REQUIRED",
          "Seller access requires an authenticated Telegram session",
          "trace-seller-auth",
        ),
      ),
    });
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<SellerShopStatusRoute api={api} />);
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Seller status control requires an authenticated Telegram-linked session.");
    expect(text).toContain("Seller access requires an authenticated Telegram session (trace: trace-seller-auth)");
  });

  it("renders explicit forbidden feedback when the Telegram account has no owned shop binding", async () => {
    const api = createApi({
      listOwnedShops: jest.fn().mockRejectedValue(
        new SellerShopStatusApiError(
          "FORBIDDEN",
          "Seller access is not provisioned for this Telegram account",
          "trace-seller-forbidden",
        ),
      ),
    });
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<SellerShopStatusRoute api={api} />);
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Seller-web stays closed until this Telegram account is provisioned for an owned shop.");
    expect(text).toContain("Seller access is not provisioned for this Telegram account (trace: trace-seller-forbidden)");
  });
});
