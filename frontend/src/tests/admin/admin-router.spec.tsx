import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AdminAuthApiError } from "../../admin/api/admin-auth-api";
import { AdminRouter, resolveAdminRoute } from "../../admin/app/router";
import { adminRoutes as adminRoutePaths } from "../../admin/lib/routes";
import {
  createAuthenticatedAdminSessionState,
  createExpiredAdminSessionState,
} from "../../admin/model/admin-access-shell";
import type { AdminAuthApi } from "../../admin/api/admin-auth-api";
import { AdminAssignmentRoute } from "../../admin/routes/admin-assignment-route";
import { AdminCatalogProvisioningRoute } from "../../admin/routes/admin-catalog-provisioning-route";
import { AdminDashboardPage } from "../../admin/components/admin-dashboard-page";
import { AdminLoginPage } from "../../admin/components/admin-login-page";
import { AdminOrderCancellationRoute } from "../../admin/routes/admin-order-cancellation-route";

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const flushRouterTransitions = async () => {
  await flushPromises();
  await flushPromises();
  await flushPromises();
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
  const createAuthApi = (overrides: Partial<AdminAuthApi> = {}): AdminAuthApi => ({
    login: jest.fn().mockResolvedValue({
      adminAccountId: "admin-account-7",
      role: "manager",
      accessTokenExpiresAt: "2026-04-05T10:15:00.000Z",
      refreshTokenExpiresAt: "2026-04-08T10:00:00.000Z",
      idleExpiresAt: "2026-04-05T10:30:00.000Z",
    }),
    refresh: jest.fn().mockRejectedValue(new Error("no session")),
    logout: jest.fn().mockResolvedValue({
      loggedOut: true,
    }),
    ...overrides,
  });

  it("resolves the login route for the admin contour", () => {
    expect(resolveAdminRoute(adminRoutePaths.login)?.element.type).toBe(AdminLoginPage);
  });

  it("resolves the main admin dashboard route", () => {
    expect(resolveAdminRoute(adminRoutePaths.home)?.element.type).toBe(AdminDashboardPage);
  });

  it("resolves the assignment route for the admin path", () => {
    expect(resolveAdminRoute(adminRoutePaths.assignment)?.element.type).toBe(AdminAssignmentRoute);
  });

  it("resolves the catalog provisioning route for the admin path", () => {
    expect(resolveAdminRoute(adminRoutePaths.catalogProvisioning)?.element.type).toBe(AdminCatalogProvisioningRoute);
  });

  it("resolves the cancellation route for the admin path", () => {
    expect(resolveAdminRoute(adminRoutePaths.cancellation)?.element.type).toBe(AdminOrderCancellationRoute);
  });

  it("does not resolve an implicit admin fallback when pathname is unknown", () => {
    expect(resolveAdminRoute("/admin/missing")).toBeNull();
  });

  it("renders the login page for the explicit login route", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminRouter pathname={adminRoutePaths.login} />);
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    const root = renderer.root.findByProps({ "data-admin-shell": "root" });

    expect(root.props["data-admin-contour"]).toBe("admin-web");
    expect(text).toContain("Admin login");
    expect(text).toContain("Protected routes redirect here until a valid admin-access session exists.");
    expect(text).toContain(`Requested path: ${adminRoutePaths.home}`);
    expect(renderer.root.findByProps({ name: "login" }).props.autoComplete).toBe("username");
    expect(renderer.root.findByType("button").props.disabled).toBe(true);
  });

  it("renders explicit unknown admin path feedback for unsupported admin-web routes", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminRouter pathname="/admin/missing" />);
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    const root = renderer.root.findByProps({ "data-admin-shell": "root" });

    expect(root.props["data-admin-contour"]).toBe("admin-web");
    expect(text).toContain("Admin page not found");
    expect(text).not.toContain("Admin login");
    expect(text).not.toContain("Order assignment");
  });

  it("renders the protected admin dashboard with links when authenticated", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AdminRouter
          pathname={adminRoutePaths.home}
          session={createAuthenticatedAdminSessionState()}
        />,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    const hrefs = renderer.root.findAllByType("a").map((link) => link.props.href);

    expect(text).toContain("Admin dashboard");
    expect(text).toContain("Все доступные интерфейсы");
    expect(hrefs).toEqual(
      expect.arrayContaining([
        adminRoutePaths.assignment,
        adminRoutePaths.cancellation,
        adminRoutePaths.catalogProvisioning,
        "/tracking",
        "/seller/shops/status",
      ]),
    );
  });

  it("renders login fallback when a protected route is requested without a session", async () => {
    const authApi = createAuthApi();
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
        renderer = create(<AdminRouter authApi={authApi} />);
        await flushRouterTransitions();
      });

      const root = renderer.root.findByProps({ "data-admin-shell": "root" });
      const text = collectText(renderer.toJSON()).join(" ");

      expect(root.props["data-admin-contour"]).toBe("admin-web");
      expect(text).toContain("Admin login");
      expect(text).toContain(`Requested path: ${adminRoutePaths.cancellation}`);
      expect(authApi.refresh).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
      }
    });

  it("restores the protected route after a successful refresh on page load", async () => {
    const authApi = createAuthApi({
      refresh: jest.fn().mockResolvedValue({
        adminAccountId: "admin-account-1",
        role: "boss",
        accessTokenExpiresAt: "2026-04-19T09:30:40.775Z",
        refreshTokenExpiresAt: "2026-04-22T09:15:40.000Z",
        idleExpiresAt: "2026-04-19T09:37:21.778Z",
      }),
    });
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminRouter pathname={adminRoutePaths.catalogProvisioning} authApi={authApi} />);
      await flushRouterTransitions();
    });

    const text = collectText(renderer.toJSON()).join(" ");

    expect(authApi.refresh).toHaveBeenCalledTimes(1);
    expect(text).toContain("Signed in as boss (admin-account-1).");
    expect(text).toContain("Catalog shop provisioning");
    expect(text).not.toContain("Admin login");
  });

  it("renders session-expired feedback for protected routes when the session is no longer valid", async () => {
    const authApi = createAuthApi({
      refresh: jest
        .fn()
        .mockRejectedValue(new AdminAuthApiError("SESSION_EXPIRED", "Admin session has expired", "trace-expired")),
    });
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AdminRouter
          pathname={adminRoutePaths.assignment}
          session={createExpiredAdminSessionState()}
          authApi={authApi}
        />,
      );
      await flushRouterTransitions();
    });

    const text = collectText(renderer.toJSON()).join(" ");

    expect(text).toContain("Admin login");
    expect(text).toContain("Your admin session expired or became unavailable. Sign in again.");
    expect(text).toContain(`Requested path: ${adminRoutePaths.assignment}`);
  });

  it("renders the protected admin page when an authenticated session placeholder is present", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AdminRouter
          pathname={adminRoutePaths.cancellation}
          session={createAuthenticatedAdminSessionState()}
        />,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    const protectedRoot = renderer.root.findByProps({ "data-admin-auth": "protected" });

    expect(protectedRoot).toBeDefined();
    expect(text).toContain("Signed in as admin (admin-account-demo).");
    expect(text).toContain("Order cancellation and refund tracking");
  });

  it("renders the catalog provisioning scaffold behind the shared admin auth boundary", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AdminRouter
          pathname={adminRoutePaths.catalogProvisioning}
          session={createAuthenticatedAdminSessionState()}
        />,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");

    expect(text).toContain("Catalog shop provisioning");
    expect(text).toContain("Protected admin session is provided by the shared admin-access boundary.");
    expect(text).toContain("Provision shop");
  });

  it("submits login from a protected route and renders the protected page after success", async () => {
    const authApi = createAuthApi();
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminRouter pathname={adminRoutePaths.assignment} authApi={authApi} />);
      await flushRouterTransitions();
    });

    await act(async () => {
      const inputs = renderer.root.findAllByType("input");
      inputs[0].props.onChange({
        target: {
          value: "ops.manager",
        },
      });
      inputs[1].props.onChange({
        target: {
          value: "correct-horse-battery",
        },
      });
      await flushRouterTransitions();
    });

    await act(async () => {
      renderer.root.findByType("form").props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushRouterTransitions();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(authApi.login).toHaveBeenCalledWith({
      login: "ops.manager",
      password: "correct-horse-battery",
    });
    expect(text).toContain("Signed in as manager (admin-account-7).");
    expect(text).toContain("Courier assignment");
  });

  it("keeps manual sign-in available while protected-route session restore is in progress", async () => {
    let resolveRefresh: ((value: {
      adminAccountId: string;
      role: "boss" | "manager" | "admin";
      accessTokenExpiresAt: string;
      refreshTokenExpiresAt: string;
      idleExpiresAt: string;
    }) => void) | null = null;
    const authApi = createAuthApi({
      refresh: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve;
          }),
      ),
    });
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminRouter pathname={adminRoutePaths.catalogProvisioning} authApi={authApi} />);
      await flushPromises();
    });

    await act(async () => {
      const inputs = renderer.root.findAllByType("input");
      inputs[0].props.onChange({ target: { value: "boss@example.com" } });
      inputs[1].props.onChange({ target: { value: "correct-horse-battery" } });
      await flushPromises();
    });

    const loginButton = renderer.root.findByType("button");
    const textBeforeSubmit = collectText(renderer.toJSON()).join(" ");

    expect(textBeforeSubmit).toContain("Checking for an existing admin session...");
    expect(loginButton.props.disabled).toBe(false);

    await act(async () => {
      renderer.root.findByType("form").props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushRouterTransitions();
    });

    const textAfterSubmit = collectText(renderer.toJSON()).join(" ");

    expect(authApi.login).toHaveBeenCalledWith({
      login: "boss@example.com",
      password: "correct-horse-battery",
    });
    expect(textAfterSubmit).toContain("Signed in as manager (admin-account-7).");
    expect(textAfterSubmit).toContain("Catalog shop provisioning");

    await act(async () => {
      resolveRefresh?.({
        adminAccountId: "ignored-refresh-account",
        role: "admin",
        accessTokenExpiresAt: "2026-04-05T10:15:00.000Z",
        refreshTokenExpiresAt: "2026-04-08T10:00:00.000Z",
        idleExpiresAt: "2026-04-05T10:30:00.000Z",
      });
      await flushPromises();
    });

    const textAfterLateRefresh = collectText(renderer.toJSON()).join(" ");

    expect(textAfterLateRefresh).toContain("Signed in as manager (admin-account-7).");
    expect(textAfterLateRefresh).toContain("Catalog shop provisioning");
    expect(textAfterLateRefresh).not.toContain("Signed in as admin (ignored-refresh-account).");
  });

  it("logs out through the shared auth boundary and returns to the login route", async () => {
    const authApi = createAuthApi();
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AdminRouter
          pathname={adminRoutePaths.assignment}
          session={createAuthenticatedAdminSessionState({
            adminAccountId: "admin-account-9",
            role: "boss",
          })}
          authApi={authApi}
        />,
      );
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({ "data-admin-auth": "logout" }).props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(text).toContain("Admin login");
    expect(text).toContain("You signed out of the admin session.");
    expect(text).toContain(`Requested path: ${adminRoutePaths.home}`);
  });
});
