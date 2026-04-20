import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { resolveAppRoute } from "../../app/router";
import { RootRouter, isAdminPathname, isSellerPathname } from "../../app/root-router";
import { CatalogRoute } from "../../slices/catalog/routes/catalog-route";

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

describe("root router", () => {
  it("detects the admin contour by pathname prefix", () => {
    expect(isAdminPathname("/admin/login")).toBe(true);
    expect(isAdminPathname("/admin/orders/assignment")).toBe(true);
    expect(isAdminPathname("/admin")).toBe(true);
    expect(isAdminPathname("/admin-help")).toBe(false);
    expect(isAdminPathname("/")).toBe(false);
    expect(isAdminPathname("/checkout")).toBe(false);
  });

  it("detects the seller contour by pathname prefix", () => {
    expect(isSellerPathname("/seller/shops/status")).toBe(true);
    expect(isSellerPathname("/seller")).toBe(true);
    expect(isSellerPathname("/seller-guide")).toBe(false);
    expect(isSellerPathname("/admin/login")).toBe(false);
    expect(isSellerPathname("/")).toBe(false);
  });

  it("keeps storefront detail paths on the same catalog route tree", () => {
    expect(resolveAppRoute("/").element.type).toBe(CatalogRoute);
    expect(resolveAppRoute("/shops/shop-1").element.type).toBe(CatalogRoute);
  });

  it("renders the admin login page for /admin/login", async () => {
    const previousWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          pathname: "/admin/login",
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      let renderer!: ReactTestRenderer;

      await act(async () => {
        renderer = create(<RootRouter />);
        await flushPromises();
      });

      const text = collectText(renderer.toJSON()).join(" ");

      expect(text).toContain("Admin login");
      expect(text).not.toContain("Каталог");

      if (typeof document !== "undefined") {
        expect(document.body.dataset.rootContour).toBe("admin-web");
      }
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("renders explicit admin unknown-path feedback inside the admin contour", async () => {
    const previousWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          pathname: "/admin/missing",
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      let renderer!: ReactTestRenderer;

      await act(async () => {
        renderer = create(<RootRouter />);
        await flushPromises();
      });

      const text = collectText(renderer.toJSON()).join(" ");
      const root = renderer.root.findByProps({ "data-admin-shell": "root" });

      expect(root.props["data-admin-contour"]).toBe("admin-web");
      expect(text).toContain("Admin page not found");
      expect(text).not.toContain("Выберите язык");
      expect(text).not.toContain("Order assignment");
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("renders the customer app for non-admin routes", async () => {
    const previousWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          pathname: "/",
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      let renderer!: ReactTestRenderer;

      await act(async () => {
        renderer = create(<RootRouter />);
        await flushPromises();
      });

      const text = collectText(renderer.toJSON()).join(" ");
      const shellBoundary = renderer.root.findByProps({ "data-app-shell": "root" });

      expect(shellBoundary.props["data-app-shell"]).toBe("root");
      expect(text).toContain("Выберите язык");
      expect(text).not.toContain("Admin login");

      if (typeof document !== "undefined") {
        expect(document.body.dataset.rootContour).toBe("mini-app");
      }
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("keeps adjacent admin-like prefixes on the customer app contour", async () => {
    const previousWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          pathname: "/admin-help",
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      let renderer!: ReactTestRenderer;

      await act(async () => {
        renderer = create(<RootRouter />);
        await flushPromises();
      });

      const text = collectText(renderer.toJSON()).join(" ");
      const shellBoundary = renderer.root.findByProps({ "data-app-shell": "root" });

      expect(shellBoundary.props["data-app-shell"]).toBe("root");
      expect(text).toContain("Выберите язык");
      expect(text).not.toContain("Admin login");
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("keeps adjacent seller-like prefixes on the customer app contour", async () => {
    const previousWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          pathname: "/seller-guide",
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      let renderer!: ReactTestRenderer;

      await act(async () => {
        renderer = create(<RootRouter />);
        await flushPromises();
      });

      const text = collectText(renderer.toJSON()).join(" ");
      const shellBoundary = renderer.root.findByProps({ "data-app-shell": "root" });

      expect(shellBoundary.props["data-app-shell"]).toBe("root");
      expect(text).toContain("Выберите язык");
      expect(text).not.toContain("Shop status control");
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("renders the seller contour for /seller routes", async () => {
    const previousWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          pathname: "/seller/shops/status",
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      let renderer!: ReactTestRenderer;

      await act(async () => {
        renderer = create(<RootRouter />);
        await flushPromises();
      });

      const text = collectText(renderer.toJSON()).join(" ");
      const root = renderer.root.findByProps({ "data-seller-shell": "root" });

      expect(root.props["data-seller-contour"]).toBe("seller-web");
      expect(text).toContain("Shop status control");
      expect(text).not.toContain("Admin login");
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
    }
  });
});
