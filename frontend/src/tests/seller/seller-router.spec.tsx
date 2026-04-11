import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { SellerRouter, resolveSellerRoute } from "../../seller/app/router";
import { SellerShopStatusRoute } from "../../seller/routes/seller-shop-status-route";
import { sellerRoutes as sellerRoutePaths } from "../../seller/lib/routes";

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

describe("seller router", () => {
  it("resolves the shop status route for the seller contour", () => {
    expect(resolveSellerRoute(sellerRoutePaths.shopStatus)?.element.type).toBe(SellerShopStatusRoute);
  });

  it("does not resolve an implicit seller fallback when pathname is unknown", () => {
    expect(resolveSellerRoute("/seller/missing")).toBeNull();
  });

  it("renders the narrow seller-web scaffold", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<SellerRouter pathname={sellerRoutePaths.shopStatus} />);
      await Promise.resolve();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    const shell = renderer.root.findByProps({ "data-seller-shell": "root" });

    expect(shell.props["data-seller-contour"]).toBe("seller-web");
    expect(text).toContain("Shop status control");
    expect(text).toContain("This contour stays narrow and separate from the shared storefront tree.");
  });

  it("renders explicit unknown seller path feedback for unsupported seller-web routes", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<SellerRouter pathname="/seller/missing" />);
      await Promise.resolve();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    const shell = renderer.root.findByProps({ "data-seller-shell": "root" });

    expect(shell.props["data-seller-contour"]).toBe("seller-web");
    expect(text).toContain("Seller page not found");
    expect(text).not.toContain("Shop status control");
  });
});
