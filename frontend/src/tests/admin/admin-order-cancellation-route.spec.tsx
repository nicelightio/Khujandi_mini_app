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
  orderLabel: "Заказ #31",
  orderStatusLabel: "Текущее состояние заказа: В доставке.",
  statusLabel: "Рабочая область отмены и учета возврата готова.",
  refundStatus: "PENDING_MANUAL",
  refundStatusLabel: "Платные отмены должны оставаться видимыми как ожидание ручного возврата.",
  refundVisibilityNote: "Отображение состояния возврата является частью контракта страницы.",
  refundNote: "Ожидает ручной обработки возврата оператором.",
  cancellationReasons: [
    {
      code: "OPS_DELAY",
      label: "Операционная задержка",
      detail: "Операционная отмена от администратора",
    },
    {
      code: "COURIER_UNAVAILABLE",
      label: "Курьер недоступен",
      detail: "Проверочный сценарий недоступного курьера",
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

    expect(text).toContain("Веб-админка");
    expect(text).toContain("Отмена заказа и учет возврата");
    expect(text).toContain("Заказ #31");
    expect(text).toContain("Рабочая область отмены и учета возврата готова.");
    expect(text).toContain("Состояние возврата:");
    expect(text).toContain("Ожидает ручного возврата");
    expect(text).toContain("Ожидает ручной обработки возврата оператором.");
    expect(text).toContain("Логин и сессия админки управляются отдельно через границу admin-access.");
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
      confirmationMessage: "Отмена записана без скрытых побочных эффектов.",
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
    expect(text).toContain("Отмена записана без скрытых побочных эффектов.");
    expect(submitCancellation).toHaveBeenCalledWith({
      orderId: "order-in-progress-31",
      reasonCode: "COURIER_UNAVAILABLE",
    });
    expect(renderer.root.findAllByType("button")[0].props.disabled).toBe(false);
  });

  it("renders a controlled error when submit fails", async () => {
    const submitCancellation = jest
      .fn()
      .mockRejectedValue(new AdminOrderCancellationApiError("CONFLICT", "Отмена запрещена из DELIVERED", "trace-ft006-06"));
    const renderer = await renderRoute(submitCancellation);

    await act(async () => {
      renderer.root.findAllByType("form")[0].props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Отмена запрещена из DELIVERED (trace: trace-ft006-06)");
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
      credentials: "include",
      body: JSON.stringify({
        reasonCode: "OPS_DELAY",
      }),
    });
    expect(text).toContain("Заказ order-in-progress-31 переведен в состояние \"Отменен админом\". Состояние возврата: ожидает ручного возврата. Ревизия 211 готова для последующего опроса.");
    expect(text).toContain("Текущее состояние заказа: Отменен админом.");
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
    expect(text).toContain("Заказ order-in-progress-31 переведен в состояние \"Отменен: курьер недоступен\". Состояние возврата: не требуется. Ревизия 311 готова для последующего опроса.");
    expect(text).toContain("Текущее состояние заказа: Отменен: курьер недоступен.");
    expect(text).toContain("Состояние возврата:");
    expect(text).toContain("Не требуется");
    expect(text).toContain("Возврат явно отмечен как не требующийся для этого отмененного заказа.");
  });

  it("records manual refund outcome updates and keeps the final state visible", async () => {
    const submitRefundUpdate = jest.fn().mockResolvedValue({
      confirmationMessage: "Результат возврата записан как выполненный для отмененного заказа.",
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
        value: "Наличные возвращены офлайн",
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
      refundNote: "Наличные возвращены офлайн",
    });
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Результат возврата записан как выполненный для отмененного заказа.");
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
          refundNote: "Наличные возвращены офлайн",
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
          value: "Наличные возвращены офлайн",
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
      credentials: "include",
      body: JSON.stringify({
        refundStatus: "DONE",
        refundNote: "Наличные возвращены офлайн",
      }),
    });
    expect(text).toContain("Результат возврата \"выполнен\" записан для order-in-progress-31. Ревизия 212 готова для последующего опроса.");
    expect(text).toContain("Последняя заметка по возврату:");
    expect(text).toContain("Наличные возвращены офлайн");
    expect(text).toContain("Выполнен");
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
          refundNote: "Наличные возвращены офлайн",
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
    expect(text).toContain("Состояние возврата:");
    expect(text).toContain("Ожидает ручного возврата");
    expect(text).toContain("Состояние возврата остается явным, пока оператор записывает ручной результат в этом процессе.");

    await act(async () => {
      renderer.root.findAllByType("select")[1].props.onChange({
        target: {
          value: "DONE",
        },
      });
      renderer.root.findByType("textarea").props.onChange({
        target: {
          value: "Наличные возвращены офлайн",
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
    expect(text).toContain("Результат возврата \"выполнен\" записан для order-in-progress-31. Ревизия 212 готова для последующего опроса.");
    expect(text).toContain("Состояние возврата:");
    expect(text).toContain("Выполнен");
    expect(text).toContain("Учет возврата остается видимым после ручного обновления, чтобы последующая проверка видела явный результат.");
    expect(text).toContain("Последняя заметка по возврату:");
    expect(text).toContain("Наличные возвращены офлайн");
  });

  it("renders a controlled backend error for refund updates", async () => {
    const submitRefundUpdate = jest
      .fn()
      .mockRejectedValue(
        new AdminOrderCancellationApiError(
          "CONFLICT",
          "Учет возврата может продвигаться только из PENDING_MANUAL",
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
      "Учет возврата может продвигаться только из PENDING_MANUAL (trace: trace-ft006-07)",
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
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Записываем результат возврата...");

    await act(async () => {
      resolveSubmit({ confirmationMessage: "Возврат обновлен один раз." });
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Возврат обновлен один раз.");
  });
});
