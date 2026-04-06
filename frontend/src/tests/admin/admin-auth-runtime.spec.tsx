import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createAdminAuthApi } from "../../admin/api/admin-auth-api";
import { AdminRouter } from "../../admin/app/router";
import { AdminLoginPage } from "../../admin/components/admin-login-page";
import { AdminProtectedShell } from "../../admin/components/admin-protected-shell";
import { adminRoutes as adminRoutePaths } from "../../admin/lib/routes";
import { startAdminAuthRuntimeServer } from "../../../../tests/slices/admin-access/admin-auth-runtime.test-helpers";

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

const flushRouterTransitions = async () => {
  await flushPromises();
  await flushPromises();
  await flushPromises();
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

  return children === null ? [] : children.flatMap((child) => collectText(child));
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

describe("admin router runtime auth boundary", () => {
  it("restores, signs in, and signs out through the real admin auth HTTP cookie runtime", async () => {
    const runtime = await startAdminAuthRuntimeServer();
    const client = runtime.createClient();
    const authApi = createAdminAuthApi({
      baseUrl: runtime.baseUrl,
      fetch: async (input, init) => {
        const response = await client.request({
          path: input,
          method: init?.method ?? "GET",
          origin: "https://admin.example",
          headers: Object.fromEntries(
            Object.entries(init?.headers ?? {}).map(([key, value]) => [key, String(value)]),
          ),
          body: typeof init?.body === "string" && init.body.length > 0 ? JSON.parse(init.body) : undefined,
        });

        return {
          ok: response.status >= 200 && response.status < 300,
          status: response.status,
          json: async () => response.body,
        };
      },
    });

    try {
      let renderer!: ReactTestRenderer;

      await act(async () => {
        renderer = create(<AdminRouter pathname={adminRoutePaths.assignment} authApi={authApi} />);
        await flushRouterTransitions();
      });

      let text = collectText(renderer.toJSON()).join(" ");
      expect(text).toContain("Admin login");

      await act(async () => {
        const inputs = renderer.root.findAllByType("input");
        inputs[0].props.onChange({ target: { value: "boss@example.com" } });
        inputs[1].props.onChange({ target: { value: "super-secret-01" } });
        await flushRouterTransitions();
      });

      await act(async () => {
        await renderer.root.findByType(AdminLoginPage).props.onLogin({
          login: "boss@example.com",
          password: "super-secret-01",
        });
        await flushRouterTransitions();
      });

      text = collectText(renderer.toJSON()).join(" ");
      expect(text).toContain("Signed in as boss (admin-account-1).");
      expect(text).toContain("Courier assignment");

      await expect(authApi.refresh()).resolves.toEqual({
        adminAccountId: "admin-account-1",
        role: "boss",
        accessTokenExpiresAt: expect.any(String),
        refreshTokenExpiresAt: expect.any(String),
        idleExpiresAt: expect.any(String),
      });

      await act(async () => {
        await renderer.root.findByType(AdminProtectedShell).props.onLogout();
        await flushRouterTransitions();
      });

      const loggedOutText = collectText(renderer.toJSON()).join(" ");
      expect(loggedOutText).toContain("Admin login");
      expect(loggedOutText).toContain("You signed out of the admin session.");
    } finally {
      await runtime.stop();
    }
  });
});
