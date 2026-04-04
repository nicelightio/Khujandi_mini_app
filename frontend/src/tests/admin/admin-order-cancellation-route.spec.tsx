import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AdminOrderCancellationApiError } from "../../admin/api/admin-order-cancellation-api";
import { AdminOrderCancellationRoute } from "../../admin/routes/admin-order-cancellation-route";
import type { AdminOrderCancellationBootstrap } from "../../admin/model/admin-order-cancellation-view-model";

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

const bootstrap: AdminOrderCancellationBootstrap = {
  orderId: "order-in-progress-31",
  orderLabel: "Order #31",
  orderStatusLabel: "Current order state: IN_PROGRESS.",
  statusLabel: "Ready to stage cancellation and refund-state UI.",
  refundStatus: "PENDING_MANUAL",
  refundStatusLabel: "Paid cancellations must remain visible as PENDING_MANUAL.",
  refundVisibilityNote: "Refund-state rendering is part of the shell contract.",
  refundNote: "Awaiting operator refund handling.",
  cancellationReasons: [
    {
      code: "OPS_DELAY",
      label: "Operational delay",
      detail: "Admin placeholder",
    },
    {
      code: "COURIER_UNAVAILABLE",
      label: "Courier unavailable",
      detail: "Fixture preview",
    },
  ],
};

describe("admin order cancellation route", () => {
  const renderRoute = async (
    submitCancellation?: Parameters<typeof AdminOrderCancellationRoute>[0]["submitCancellation"],
    submitRefundUpdate?: Parameters<typeof AdminOrderCancellationRoute>[0]["submitRefundUpdate"],
  ): Promise<ReactTestRenderer> => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AdminOrderCancellationRoute
          loadBootstrap={async () => bootstrap}
          submitCancellation={submitCancellation}
          submitRefundUpdate={submitRefundUpdate}
        />,
      );
      await flushPromises();
    });

    return renderer;
  };

  it("renders the cancellation shell and refund-state details", async () => {
    const renderer = await renderRoute();
    const text = collectText(renderer.toJSON()).join(" ");

    expect(text).toContain("Admin Web");
    expect(text).toContain("Order cancellation and refund tracking");
    expect(text).toContain("Order #31");
    expect(text).toContain("Ready to stage cancellation and refund-state UI.");
    expect(text).toContain("Refund state:");
    expect(text).toContain("PENDING_MANUAL");
    expect(text).toContain("Awaiting operator refund handling.");
    expect(text).toContain("Admin login/session stays outside FT-006");
    expect(renderer.root.findAllByType("select")[0].props.value).toBe("OPS_DELAY");
    expect(renderer.root.findAllByType("button")[0].props.disabled).toBe(false);
    expect(renderer.root.findAllByType("button")[1].props.disabled).toBe(true);
  });

  it("updates the selected reason before submit", async () => {
    const renderer = await renderRoute();

    await act(async () => {
      renderer.root.findAllByType("select")[0].props.onChange({
        target: {
          value: "COURIER_UNAVAILABLE",
        },
      });
      await flushPromises();
    });

    expect(renderer.root.findAllByType("select")[0].props.value).toBe("COURIER_UNAVAILABLE");
  });

  it("renders success feedback after a fixture submit", async () => {
    const submitCancellation = jest.fn().mockResolvedValue({
      confirmationMessage: "Cancellation recorded without hidden side effects.",
    });
    const renderer = await renderRoute(submitCancellation);

    await act(async () => {
      renderer.root.findAllByType("select")[0].props.onChange({
        target: {
          value: "COURIER_UNAVAILABLE",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findAllByType("form")[0].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Cancellation recorded without hidden side effects.");
    expect(submitCancellation).toHaveBeenCalledWith({
      orderId: "order-in-progress-31",
      reasonCode: "COURIER_UNAVAILABLE",
    });
    expect(renderer.root.findAllByType("button")[0].props.disabled).toBe(false);
  });

  it("renders a controlled error when submit fails", async () => {
    const submitCancellation = jest
      .fn()
      .mockRejectedValue(new AdminOrderCancellationApiError("CONFLICT", "Cancellation is forbidden from DELIVERED", "trace-ft006-06"));
    const renderer = await renderRoute(submitCancellation);

    await act(async () => {
      renderer.root.findAllByType("form")[0].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Cancellation is forbidden from DELIVERED (trace: trace-ft006-06)");
    expect(renderer.root.findAllByType("button")[0].props.disabled).toBe(false);
  });

  it("uses the default backend API client for cancellation and exposes explicit refund-state feedback", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        orderId: "order-in-progress-31",
        status: "CANCELLED_BY_ADMIN",
        refundStatus: "PENDING_MANUAL",
        updated_at: "2026-04-03T12:00:00.000Z",
        revision: "211",
      }),
    });
    globalWithFetch.fetch = fetchMock as typeof fetch;
    const renderer = await renderRoute();

    await act(async () => {
      renderer.root.findAllByType("form")[0].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/orders/order-in-progress-31/cancellation", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        reasonCode: "OPS_DELAY",
      }),
    });
    expect(text).toContain("Order order-in-progress-31 moved to CANCELLED_BY_ADMIN. Refund state PENDING_MANUAL is explicit. Revision 211 is ready for downstream polling.");
    expect(text).toContain("Current order state: CANCELLED_BY_ADMIN.");
  });

  it("renders courier-unavailable cancellation results with explicit no-refund visibility", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        orderId: "order-in-progress-31",
        status: "CANCELLED_BY_COURIER_UNAVAILABLE",
        refundStatus: "NOT_REQUIRED",
        updated_at: "2026-04-03T12:02:00.000Z",
        revision: "311",
      }),
    });
    globalWithFetch.fetch = fetchMock as typeof fetch;
    const renderer = await renderRoute();

    await act(async () => {
      renderer.root.findAllByType("select")[0].props.onChange({
        target: {
          value: "COURIER_UNAVAILABLE",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findAllByType("form")[0].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Order order-in-progress-31 moved to CANCELLED_BY_COURIER_UNAVAILABLE. Refund state NOT_REQUIRED is explicit. Revision 311 is ready for downstream polling.");
    expect(text).toContain("Current order state: CANCELLED_BY_COURIER_UNAVAILABLE.");
    expect(text).toContain("Refund state:");
    expect(text).toContain("NOT_REQUIRED");
    expect(text).toContain("Refund is explicitly marked as not required for this cancelled order.");
  });

  it("records manual refund outcome updates and keeps the final state visible", async () => {
    const submitRefundUpdate = jest.fn().mockResolvedValue({
      confirmationMessage: "Refund outcome DONE recorded for the cancelled order.",
    });
    const renderer = await renderRoute(undefined, submitRefundUpdate);

    const forms = renderer.root.findAllByType("form");
    const refundSelect = renderer.root.findAllByType("select")[1];
    const refundTextarea = renderer.root.findByType("textarea");

    await act(async () => {
      refundSelect.props.onChange({
        target: {
          value: "DONE",
        },
      });
      refundTextarea.props.onChange({
        target: {
          value: "Cash returned offline",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      forms[1].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    expect(submitRefundUpdate).toHaveBeenCalledWith({
      orderId: "order-in-progress-31",
      refundStatus: "DONE",
      refundNote: "Cash returned offline",
    });
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Refund outcome DONE recorded for the cancelled order.");
  });

  it("uses the default backend API client for refund updates", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          orderId: "order-in-progress-31",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "PENDING_MANUAL",
          updated_at: "2026-04-03T12:00:00.000Z",
          revision: "211",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          orderId: "order-in-progress-31",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "DONE",
          refundNote: "Cash returned offline",
          updated_at: "2026-04-03T12:05:00.000Z",
          revision: "212",
        }),
      });
    globalWithFetch.fetch = fetchMock as typeof fetch;
    const renderer = await renderRoute();

    await act(async () => {
      renderer.root.findAllByType("form")[0].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findAllByType("select")[1].props.onChange({
        target: {
          value: "DONE",
        },
      });
      renderer.root.findByType("textarea").props.onChange({
        target: {
          value: "Cash returned offline",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findAllByType("form")[1].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/admin/orders/order-in-progress-31/refund", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        refundStatus: "DONE",
        refundNote: "Cash returned offline",
      }),
    });
    expect(text).toContain("Refund outcome DONE recorded for order-in-progress-31. Revision 212 is ready for downstream polling.");
    expect(text).toContain("Latest refund note:");
    expect(text).toContain("Cash returned offline");
    expect(text).toContain("DONE");
  });

  it("keeps refund tracking explicit from cancellation through the manual refund outcome", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          orderId: "order-in-progress-31",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "PENDING_MANUAL",
          updated_at: "2026-04-03T12:00:00.000Z",
          revision: "211",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          orderId: "order-in-progress-31",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "DONE",
          refundNote: "Cash returned offline",
          updated_at: "2026-04-03T12:05:00.000Z",
          revision: "212",
        }),
      });
    globalWithFetch.fetch = fetchMock as typeof fetch;
    const renderer = await renderRoute();

    await act(async () => {
      renderer.root.findAllByType("form")[0].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    let text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Refund state:");
    expect(text).toContain("PENDING_MANUAL");
    expect(text).toContain("Refund state stays explicit while the operator records the manual outcome in this workflow.");

    await act(async () => {
      renderer.root.findAllByType("select")[1].props.onChange({
        target: {
          value: "DONE",
        },
      });
      renderer.root.findByType("textarea").props.onChange({
        target: {
          value: "Cash returned offline",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findAllByType("form")[1].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Refund outcome DONE recorded for order-in-progress-31. Revision 212 is ready for downstream polling.");
    expect(text).toContain("Refund state:");
    expect(text).toContain("DONE");
    expect(text).toContain("Refund tracking remains visible after the manual update so later verification can confirm the explicit outcome.");
    expect(text).toContain("Latest refund note:");
    expect(text).toContain("Cash returned offline");
  });

  it("renders a controlled backend error for refund updates", async () => {
    const submitRefundUpdate = jest
      .fn()
      .mockRejectedValue(
        new AdminOrderCancellationApiError(
          "CONFLICT",
          "Refund tracking can only progress from PENDING_MANUAL",
          "trace-ft006-07",
        ),
      );
    const renderer = await renderRoute(undefined, submitRefundUpdate);

    await act(async () => {
      renderer.root.findByType("textarea").props.onChange({
        target: {
          value: "Operator note",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findAllByType("form")[1].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain(
      "Refund tracking can only progress from PENDING_MANUAL (trace: trace-ft006-07)",
    );
  });

  it("prevents duplicate refund submit side effects while the request is in flight", async () => {
    let resolveSubmit!: (value: { confirmationMessage: string }) => void;
    const submitRefundUpdate = jest.fn(
      () =>
        new Promise<{ confirmationMessage: string }>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const renderer = await renderRoute(undefined, submitRefundUpdate);

    await act(async () => {
      renderer.root.findByType("textarea").props.onChange({
        target: {
          value: "Operator note",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      const submit = renderer.root.findAllByType("form")[1].props.onSubmit;
      submit({ preventDefault: jest.fn() });
      submit({ preventDefault: jest.fn() });
      await Promise.resolve();
    });

    expect(submitRefundUpdate).toHaveBeenCalledTimes(1);
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Recording refund outcome...");

    await act(async () => {
      resolveSubmit({ confirmationMessage: "Refund updated once." });
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Refund updated once.");
  });
});
