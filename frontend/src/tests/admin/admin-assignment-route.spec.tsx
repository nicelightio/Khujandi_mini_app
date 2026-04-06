import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AdminAssignmentApiError } from "../../admin/api/admin-assignment-api";
import { AdminAssignmentRoute } from "../../admin/routes/admin-assignment-route";
import type { AdminAssignmentBootstrap } from "../../admin/model/admin-assignment-view-model";

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
const globalWithFetch = globalThis as typeof globalThis & {
  fetch?: typeof fetch;
};
let originalFetch: typeof fetch | undefined;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((message: unknown) => {
    if (typeof message === "string" && message.includes("react-test-renderer is deprecated")) {
      return;
    }

    process.stderr.write(String(message));
  });
  originalFetch = globalWithFetch.fetch;
});

afterEach(() => {
  consoleErrorSpy.mockRestore();

  if (originalFetch === undefined) {
    delete (globalWithFetch as { fetch?: typeof fetch }).fetch;
    return;
  }

  globalWithFetch.fetch = originalFetch;
});

const bootstrap: AdminAssignmentBootstrap = {
  orderId: "order-created-77",
  orderLabel: "Order #77",
  statusLabel: "Ready to assign the paid order.",
  couriers: [
    {
      id: "courier-1",
      label: "Courier 1",
      detail: "North zone",
    },
    {
      id: "courier-2",
      label: "Courier 2",
      detail: "South zone",
    },
  ],
};

describe("admin assignment route", () => {
  const renderRoute = async (
    submitAssignment?: Parameters<typeof AdminAssignmentRoute>[0]["submitAssignment"],
  ): Promise<ReactTestRenderer> => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AdminAssignmentRoute
          loadBootstrap={async () => bootstrap}
          submitAssignment={submitAssignment}
        />,
      );
      await flushPromises();
    });

    return renderer;
  };

  it("renders the assignment shell and default form state", async () => {
    const renderer = await renderRoute();
    const text = collectText(renderer.toJSON()).join(" ");

    expect(text).toContain("Admin Web");
    expect(text).toContain("Courier assignment");
    expect(text).toContain("Order #77");
    expect(text).toContain("Ready to assign the paid order.");
    expect(text).toContain("Admin login/session stays outside FT-004");
    expect(renderer.root.findByType("select").props.value).toBe("courier-1");
    expect(renderer.root.findByType("button").props.disabled).toBe(false);
  });

  it("updates the selected courier before submit", async () => {
    const renderer = await renderRoute();

    await act(async () => {
      renderer.root.findByType("select").props.onChange({
        target: {
          value: "courier-2",
        },
      });
      await flushPromises();
    });

    expect(renderer.root.findByType("select").props.value).toBe("courier-2");
  });

  it("renders a success confirmation after a fixture submit", async () => {
    const submitAssignment = jest.fn().mockResolvedValue({
      confirmationMessage: "Courier 2 assigned. Backend wiring remains pending.",
    });
    const renderer = await renderRoute(submitAssignment);

    await act(async () => {
      renderer.root.findByType("select").props.onChange({
        target: {
          value: "courier-2",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByType("form").props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Courier assigned");
    expect(text).toContain("Courier 2 assigned. Backend wiring remains pending.");
    expect(submitAssignment).toHaveBeenCalledWith({
      orderId: "order-created-77",
      courierId: "courier-2",
    });
    expect(renderer.root.findByType("button").props.disabled).toBe(true);
  });

  it("uses the default backend API client and renders revision-based success feedback", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        orderId: "order-created-77",
        courierId: "courier-2",
        status: "ASSIGNED",
        updated_at: "2026-04-03T10:00:00.000Z",
        revision: "91",
      }),
    });
    globalWithFetch.fetch = fetchMock as typeof fetch;
    const renderer = await renderRoute();

    await act(async () => {
      renderer.root.findByType("select").props.onChange({
        target: {
          value: "courier-2",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByType("form").props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/orders/order-created-77/assignment", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        courierId: "courier-2",
      }),
    });
    expect(text).toContain("Courier assigned");
    expect(text).toContain("Courier courier-2 assigned to order-created-77. Revision 91 is ready for downstream polling.");
  });

  it("renders a controlled error when submit fails", async () => {
    const submitAssignment = jest
      .fn()
      .mockRejectedValue(
        new AdminAssignmentApiError("CONFLICT", "Order cannot be assigned from the current state", "trace-ft004-06"),
      );
    const renderer = await renderRoute(submitAssignment);

    await act(async () => {
      renderer.root.findByType("form").props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Order cannot be assigned from the current state (trace: trace-ft004-06)");
    expect(renderer.root.findByType("button").props.disabled).toBe(false);
  });

  it("renders a controlled backend error via the default API client", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: {
          code: "CONFLICT",
          message: "Order cannot be assigned from the current state",
          details: {
            currentStatus: "ASSIGNED",
          },
        },
        trace_id: "trace-ft004-07",
      }),
    });
    globalWithFetch.fetch = fetchMock as typeof fetch;
    const renderer = await renderRoute();

    await act(async () => {
      renderer.root.findByType("form").props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(text).toContain("Order cannot be assigned from the current state (trace: trace-ft004-07)");
    expect(text).toContain("Admin login/session stays outside FT-004");
  });

  it("prevents duplicate submit side effects while the request is in flight", async () => {
    let resolveSubmit!: (value: { confirmationMessage: string }) => void;
    const submitAssignment = jest.fn(
      () =>
        new Promise<{ confirmationMessage: string }>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const renderer = await renderRoute(submitAssignment);

    await act(async () => {
      const submit = renderer.root.findByType("form").props.onSubmit;
      submit({ preventDefault: jest.fn() });
      submit({ preventDefault: jest.fn() });
      await Promise.resolve();
    });

    expect(submitAssignment).toHaveBeenCalledTimes(1);
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Assigning courier...");

    await act(async () => {
      resolveSubmit({ confirmationMessage: "Courier assigned once." });
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Courier assigned once.");
  });
});
