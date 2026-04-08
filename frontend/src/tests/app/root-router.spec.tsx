import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { RootRouter, isAdminPathname } from "../../app/root-router";

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
    expect(isAdminPathname("/")).toBe(false);
    expect(isAdminPathname("/checkout")).toBe(false);
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
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
    }
  });
});
