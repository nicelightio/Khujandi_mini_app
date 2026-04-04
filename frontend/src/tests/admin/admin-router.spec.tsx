import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AdminRouter, resolveAdminRoute } from "../../admin/app/router";
import { adminRoutes as adminRoutePaths } from "../../admin/lib/routes";
import { AdminAssignmentRoute } from "../../admin/routes/admin-assignment-route";
import { AdminOrderCancellationRoute } from "../../admin/routes/admin-order-cancellation-route";

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

describe("admin router", () => {
  it("resolves the assignment route for the admin path", () => {
    expect(resolveAdminRoute(adminRoutePaths.assignment).element.type).toBe(AdminAssignmentRoute);
  });

  it("resolves the cancellation route for the admin path", () => {
    expect(resolveAdminRoute(adminRoutePaths.cancellation).element.type).toBe(AdminOrderCancellationRoute);
  });

  it("falls back to the assignment route when pathname is unknown", () => {
    expect(resolveAdminRoute("/admin/missing").element.type).toBe(AdminAssignmentRoute);
  });

  it("uses the browser pathname at runtime and renders inside the admin shell", async () => {
    const previousWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          pathname: adminRoutePaths.cancellation,
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      let renderer!: ReactTestRenderer;

      await act(async () => {
        renderer = create(<AdminRouter />);
        await flushPromises();
      });

      const root = renderer.root.findByProps({ "data-admin-shell": "root" });
      expect(root.props["data-admin-contour"]).toBe("admin-web");
      expect(collectText(renderer.toJSON()).join(" ")).toContain("Order cancellation and refund tracking");
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
    }
  });
});
