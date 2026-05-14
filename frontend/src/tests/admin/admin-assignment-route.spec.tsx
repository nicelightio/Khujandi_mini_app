import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AdminAssignmentApiError, type AdminAssignmentApi } from "../../admin/api/admin-assignment-api";
import { AdminAssignmentRoute } from "../../admin/routes/admin-assignment-route";
import type { AdminOperatorDeliveryOrderStatus, AdminOperatorDeliveryOrdersResult } from "../../admin/api/admin-assignment-api";

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

const operatorOrders: AdminOperatorDeliveryOrdersResult = {
  window: {
    from: "2026-05-05T19:00:00.000Z",
    to: "2026-05-09T12:00:00.000Z",
  },
  generatedAt: "2026-05-09T12:00:00.000Z",
  revision: "44",
  orders: [
    {
      orderId: "order-delayed-3001",
      publicOrderNumber: "order-delayed-3001",
      summary: {
        shopName: "Khujandi Plov",
        totalAmountMinor: 12500,
        currency: "TJS",
      },
      createdAt: "2026-05-09T11:20:00.000Z",
      updatedAt: "2026-05-09T11:50:00.000Z",
      status: "DELAYED",
      severity: "delayed",
      courier: {
        marker: "absent",
        current: null,
      },
      assignedAt: null,
      claimedAt: null,
      latestMessage: null,
      latestMessagePreview: null,
      latestMessageSenderRole: null,
      statusRevision: "43",
      history: [
        {
          id: "history-delayed-1",
          status: "DELAYED",
          previousStatus: "CREATED",
          changedAt: "2026-05-09T11:50:00.000Z",
          actor: {
            userId: "admin-account-1",
            role: "admin",
            name: "Admin One",
          },
          timeInStatusSeconds: null,
          timeSinceOrderCreatedSeconds: 1800,
          comments: {
            courier: null,
            admin: null,
            customer: null,
            shopOwner: null,
          },
        },
      ],
    },
    {
      orderId: "order-delivered-3003",
      publicOrderNumber: "order-delivered-3003",
      summary: {
        shopName: "Delivered Shop",
        totalAmountMinor: 15000,
        currency: "TJS",
      },
      createdAt: "2026-05-09T11:10:00.000Z",
      updatedAt: "2026-05-09T12:00:00.000Z",
      status: "DELIVERED",
      severity: "attention",
      courier: {
        marker: "current",
        current: {
          id: "courier-8",
          name: "Courier 8",
          telegramId: "70008",
        },
      },
      assignedAt: "2026-05-09T11:30:00.000Z",
      claimedAt: "2026-05-09T11:30:00.000Z",
      latestMessage: null,
      latestMessagePreview: null,
      latestMessageSenderRole: null,
      statusRevision: "45",
      history: [
        {
          id: "history-delivered-1",
          status: "DELIVERED",
          previousStatus: "IN_PROGRESS",
          changedAt: "2026-05-09T12:00:00.000Z",
          actor: {
            userId: "courier-8",
            role: "courier",
            name: "Courier 8",
          },
          timeInStatusSeconds: null,
          timeSinceOrderCreatedSeconds: 3000,
          comments: {
            courier: null,
            admin: null,
            customer: null,
            shopOwner: null,
          },
        },
      ],
    },
    {
      orderId: "order-picked-up-3002",
      publicOrderNumber: "order-picked-up-3002",
      summary: {
        shopName: "Somoni Burger",
        totalAmountMinor: 9900,
        currency: "TJS",
      },
      createdAt: "2026-05-09T11:35:00.000Z",
      updatedAt: "2026-05-09T11:58:00.000Z",
      status: "PICKED_UP",
      severity: "active_under_30",
      courier: {
        marker: "current",
        current: {
          id: "courier-7",
          name: "Courier 7",
          telegramId: "70007",
        },
      },
      assignedAt: "2026-05-09T11:40:00.000Z",
      claimedAt: "2026-05-09T11:40:00.000Z",
      latestMessage: null,
      latestMessagePreview: null,
      latestMessageSenderRole: null,
      statusRevision: "44",
      history: [
        {
          id: "history-picked-up-1",
          status: "PICKED_UP",
          previousStatus: "ASSIGNED",
          changedAt: "2026-05-09T11:58:00.000Z",
          actor: {
            userId: "courier-7",
            role: "courier",
            name: "Courier 7",
          },
          timeInStatusSeconds: null,
          timeSinceOrderCreatedSeconds: 1380,
          comments: {
            courier: null,
            admin: null,
            customer: null,
            shopOwner: null,
          },
        },
      ],
    },
  ],
};

describe("admin assignment route", () => {
  const renderRoute = async (
    loadOperatorDeliveryOrders?: () => Promise<AdminOperatorDeliveryOrdersResult>,
    options: {
      api?: AdminAssignmentApi;
      requestTargetCourierId?: (orderId: string) => string | null;
      confirmStatusChange?: (orderId: string, nextStatus: AdminOperatorDeliveryOrderStatus) => boolean;
    } = {},
  ): Promise<ReactTestRenderer> => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AdminAssignmentRoute
          api={options.api}
          loadOperatorDeliveryOrders={loadOperatorDeliveryOrders}
          requestTargetCourierId={options.requestTargetCourierId}
          confirmStatusChange={options.confirmStatusChange}
        />,
      );
      await flushPromises();
    });

    return renderer;
  };

  it("renders the API-backed operator order read surface", async () => {
    const renderer = await renderRoute(async () => operatorOrders);
    const text = collectText(renderer.toJSON()).join(" ");

    expect(text).toContain("Веб-админка");
    expect(text).toContain("Операторские заказы доставки");
    expect(text).toContain("Загружено заказов из операторской модели чтения: 3.");
    expect(text).toContain("Внимание к курьерам");
    expect(text).toContain("Сегодня и предыдущие 3 дня");
    expect(text).toContain("Ревизия 44");
    expect(text).toContain("order-delayed-3001");
    expect(text).toContain("Khujandi Plov / 125 TJS");
    expect(text).toContain("Задержан");
    expect(text).toContain("Нет принявшего курьера");
    expect(text).toContain("Нет");
    expect(text).toContain("Сообщений пока нет");
    expect(text).toContain("Сообщения пока нет");
    expect(text).toContain("order-picked-up-3002");
    expect(text).toContain("order-delivered-3003");
    expect(text).toContain("Завершить заказ -> Завершен");
    expect(text).toContain("Courier 7 / tg 70007");
    expect(text).toContain("Текущий");
    expect(text).toContain("Срочность");
    expect(text).toContain("Время создания");
    expect(text).toContain("Статус");
    expect(text).toContain("Курьер");
    expect(text).toContain("Время назначения");
    expect(text).toContain("Сообщения");
    expect(text).not.toContain("Время последнего сообщения");
    expect(text).toContain("Персональное");
    expect(text).toContain("Массовое");
    expect(text).toContain("Чат");
    expect(text).toContain("Создать ожидающее предложение");
    expect(text).toContain("Среда еще не включена");

    const actionButtons = renderer.root.findAll(
      (node) => node.type === "button" && typeof node.props["data-admin-action-cell"] === "string",
    );

    expect(actionButtons.map((button) => button.props["aria-label"])).toEqual(
      expect.arrayContaining([
        "Персональное предложение: Создать ожидающее предложение",
        "Массовое предложение: Запустить явно",
        "Управление статусом: Завершить заказ -> Завершен",
        "Чат в боте: Среда еще не включена",
      ]),
    );
  });

  it("does not render the old direct assignment CTA as the default action", async () => {
    const renderer = await renderRoute(async () => operatorOrders);
    const text = collectText(renderer.toJSON()).join(" ");

    expect(text).not.toContain("Assign courier");
    expect(renderer.root.findAllByType("select")).toHaveLength(0);
    expect(renderer.root.findAllByType("form")).toHaveLength(0);
  });

  it("enables offer actions for unassigned rows and status control only for allowed next transitions", async () => {
    const renderer = await renderRoute(async () => operatorOrders);
    const actionButtons = renderer.root.findAll(
      (node) => typeof node.props["data-admin-action-cell"] === "string",
    );

    expect(actionButtons).toHaveLength(12);
    expect(actionButtons.map((button) => button.props["data-admin-action-cell"])).toEqual([
      "targeted_offer",
      "broadcast_offer",
      "status_control",
      "bot_chat",
      "targeted_offer",
      "broadcast_offer",
      "status_control",
      "bot_chat",
      "targeted_offer",
      "broadcast_offer",
      "status_control",
      "bot_chat",
    ]);
    expect(actionButtons.map((button) => button.props.disabled)).toEqual([
      false,
      false,
      true,
      true,
      true,
      true,
      false,
      true,
      true,
      true,
      false,
      true,
    ]);
    expect(actionButtons[0].props.title).toContain("Создает ожидающее предложение курьеру");
    expect(actionButtons[1].props.title).toContain("Иначе auto-offer выключен");
    expect(actionButtons[2].props.title).toContain("нет разрешенного перехода оператора/админа");
    expect(actionButtons[3].props.title).toContain("Редирект в бот не выполняется");
    expect(actionButtons[6].props.title).toContain("Требует подтверждения");
  });

  it("submits a targeted offer and renders controlled success state", async () => {
    const createManualTargetedOffer = jest.fn().mockResolvedValue({
      orderId: "order-delayed-3001",
      offerId: "offer-3001",
      targetCourierId: "courier-8",
      kind: "manual",
      status: "pending",
      orderStatus: "DELAYED",
      updatedAt: "2026-05-09T12:00:00.000Z",
      revision: "45",
    });
    const renderer = await renderRoute(async () => operatorOrders, {
      api: {
        listOperatorDeliveryOrders: jest.fn(),
        createManualTargetedOffer,
        createBroadcastOffer: jest.fn(),
        updateOperatorOrderStatus: jest.fn(),
      },
      requestTargetCourierId: () => "courier-8",
    });
    const targetedOfferButton = renderer.root.findAllByProps({
      "data-admin-action-cell": "targeted_offer",
    })[0];

    await act(async () => {
      targetedOfferButton.props.onClick();
      await flushPromises();
    });

    expect(createManualTargetedOffer).toHaveBeenCalledWith({
      orderId: "order-delayed-3001",
      courierId: "courier-8",
    });
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Предложение создано");
    expect(
      renderer.root.findAllByProps({
        "data-admin-action-cell": "targeted_offer",
      })[0].props.title,
    ).toBe("Ожидающее предложение offer-3001 создано для courier-8.");
  });

  it("disables same-order offer actions while an offer request is in flight", async () => {
    let resolveOffer!: (value: Awaited<ReturnType<AdminAssignmentApi["createManualTargetedOffer"]>>) => void;
    const createManualTargetedOffer = jest.fn(
      () =>
        new Promise<Awaited<ReturnType<AdminAssignmentApi["createManualTargetedOffer"]>>>((resolve) => {
          resolveOffer = resolve;
        }),
    );
    const renderer = await renderRoute(async () => operatorOrders, {
      api: {
        listOperatorDeliveryOrders: jest.fn(),
        createManualTargetedOffer,
        createBroadcastOffer: jest.fn(),
        updateOperatorOrderStatus: jest.fn(),
      },
      requestTargetCourierId: () => "courier-8",
    });
    const delayedRow = () =>
      renderer.root.findByProps({
        "data-admin-assignment-row": "order-delayed-3001",
      });

    await act(async () => {
      delayedRow().findAllByProps({ "data-admin-action-cell": "targeted_offer" })[0].props.onClick();
      delayedRow().findAllByProps({ "data-admin-action-cell": "targeted_offer" })[0].props.onClick();
      await flushPromises();
    });

    expect(createManualTargetedOffer).toHaveBeenCalledTimes(1);
    expect(delayedRow().findAllByProps({ "data-admin-action-cell": "targeted_offer" })[0].props.disabled).toBe(true);
    expect(delayedRow().findAllByProps({ "data-admin-action-cell": "broadcast_offer" })[0].props.disabled).toBe(true);

    await act(async () => {
      resolveOffer({
        orderId: "order-delayed-3001",
        offerId: "offer-3001",
        targetCourierId: "courier-8",
        kind: "manual",
        status: "pending",
        orderStatus: "DELAYED",
        updatedAt: "2026-05-09T12:00:00.000Z",
        revision: "45",
      });
      await flushPromises();
    });

    expect(delayedRow().findAllByProps({ "data-admin-action-cell": "targeted_offer" })[0].props.disabled).toBe(false);
    expect(delayedRow().findAllByProps({ "data-admin-action-cell": "broadcast_offer" })[0].props.disabled).toBe(false);
  });

  it("submits an explicit broadcast offer trigger and renders controlled success state", async () => {
    const createBroadcastOffer = jest.fn().mockResolvedValue({
      orderId: "order-delayed-3001",
      kind: "broadcast",
      status: "pending",
      orderStatus: "DELAYED",
      eligibleCourierCount: 2,
      offers: [
        {
          orderId: "order-delayed-3001",
          offerId: "offer-broadcast-1",
          targetCourierId: "courier-7",
          kind: "broadcast",
          status: "pending",
          orderStatus: "DELAYED",
          updatedAt: "2026-05-09T12:00:00.000Z",
          revision: "46",
        },
      ],
      updatedAt: "2026-05-09T12:00:00.000Z",
      revision: "46",
    });
    const renderer = await renderRoute(async () => operatorOrders, {
      api: {
        listOperatorDeliveryOrders: jest.fn(),
        createManualTargetedOffer: jest.fn(),
        createBroadcastOffer,
        updateOperatorOrderStatus: jest.fn(),
      },
    });
    const broadcastOfferButton = renderer.root.findAllByProps({
      "data-admin-action-cell": "broadcast_offer",
    })[0];

    await act(async () => {
      broadcastOfferButton.props.onClick();
      await flushPromises();
    });

    expect(createBroadcastOffer).toHaveBeenCalledWith({
      orderId: "order-delayed-3001",
    });
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Предложения созданы");
    expect(
      renderer.root.findAllByProps({
        "data-admin-action-cell": "broadcast_offer",
      })[0].props.title,
    ).toBe("Ожидающие массовые предложения созданы для курьеров: 2.");
  });

  it("confirms DELIVERED to COMPLETED operator closure and refetches the read model", async () => {
    const updateOperatorOrderStatus = jest.fn().mockResolvedValue({
      orderId: "order-delivered-3003",
      status: "COMPLETED",
      updatedAt: "2026-05-09T12:05:00.000Z",
      revision: "46",
    });
    const refreshedOperatorOrders: AdminOperatorDeliveryOrdersResult = {
      ...operatorOrders,
      revision: "46",
      orders: operatorOrders.orders.map((order) =>
        order.orderId === "order-delivered-3003"
          ? {
              ...order,
              status: "COMPLETED",
              severity: "completed",
              updatedAt: "2026-05-09T12:05:00.000Z",
              statusRevision: "46",
              history: [
                ...order.history,
                {
                  id: "history-completed-1",
                  status: "COMPLETED",
                  previousStatus: "DELIVERED",
                  changedAt: "2026-05-09T12:05:00.000Z",
                  actor: {
                    userId: "admin-account-1",
                    role: "admin",
                    name: "Admin One",
                  },
                  timeInStatusSeconds: null,
                  timeSinceOrderCreatedSeconds: 3300,
                  comments: {
                    courier: null,
                    admin: null,
                    customer: null,
                    shopOwner: null,
                  },
                },
              ],
            }
          : order,
      ),
    };
    const loadOperatorDeliveryOrders = jest
      .fn()
      .mockResolvedValueOnce(operatorOrders)
      .mockResolvedValueOnce(refreshedOperatorOrders);
    const confirmStatusChange = jest.fn().mockReturnValue(true);
    const renderer = await renderRoute(loadOperatorDeliveryOrders, {
      api: {
        listOperatorDeliveryOrders: jest.fn(),
        createManualTargetedOffer: jest.fn(),
        createBroadcastOffer: jest.fn(),
        updateOperatorOrderStatus,
      },
      confirmStatusChange,
    });
    const deliveredRow = renderer.root.findByProps({
      "data-admin-assignment-row": "order-delivered-3003",
    });
    const statusButton = deliveredRow.findAllByProps({
      "data-admin-action-cell": "status_control",
    })[0];

    await act(async () => {
      statusButton.props.onClick();
      await flushPromises();
    });

    expect(confirmStatusChange).toHaveBeenCalledWith("order-delivered-3003", "COMPLETED");
    expect(updateOperatorOrderStatus).toHaveBeenCalledWith({
      orderId: "order-delivered-3003",
      nextStatus: "COMPLETED",
    });
    expect(loadOperatorDeliveryOrders).toHaveBeenCalledTimes(2);
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Статус обновлен");
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Завершен");
    const completedRow = renderer.root.findByProps({
      "data-admin-assignment-row": "order-delivered-3003",
    });
    expect(
      completedRow.findAllByProps({
        "data-admin-action-cell": "status_control",
      })[0].props.disabled,
    ).toBe(true);
  });

  it("expands status history rows for an order", async () => {
    const renderer = await renderRoute(async () => operatorOrders);
    const historyButton = renderer.root
      .findAllByType("button")
      .find((button) => collectText(button).join(" ").includes("Показать историю"));

    expect(historyButton).toBeDefined();

    await act(async () => {
      historyButton!.props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Создан");
    expect(text).toContain("Admin One (admin)");
    expect(text).toContain("30 мин");
    expect(text).toContain("Комментариев нет");
  });

  it("sorts rows through deterministic read-side controls", async () => {
    const renderer = await renderRoute(async () => operatorOrders);
    const collectRowOrder = () =>
      renderer.root
        .findAll((node) => typeof node.props["data-admin-assignment-row"] === "string")
        .map((node) => node.props["data-admin-assignment-row"]);

    expect(collectRowOrder()).toEqual(["order-delayed-3001", "order-delivered-3003", "order-picked-up-3002"]);

    await act(async () => {
      renderer.root.findByProps({ "data-admin-sort-key": "created_at" }).props.onClick();
      await flushPromises();
    });

    expect(collectRowOrder()).toEqual(["order-picked-up-3002", "order-delayed-3001", "order-delivered-3003"]);
  });

  it("uses the default backend API client and only performs a read request", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => operatorOrders,
    });
    globalWithFetch.fetch = fetchMock as typeof fetch;

    const renderer = await renderRoute();
    const text = collectText(renderer.toJSON()).join(" ");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/operator/delivery/orders", {
      method: "GET",
      credentials: "include",
    });
    expect(text).toContain("Операторские заказы доставки");
    expect(text).toContain("order-picked-up-3002");
  });

  it("renders a controlled error when the read model fails", async () => {
    const renderer = await renderRoute(async () => {
      throw new AdminAssignmentApiError("AUTH_REQUIRED", "Admin session required", "trace-ft016-04");
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Операторские заказы доставки не удалось загрузить.");
    expect(text).toContain("Admin session required (trace: trace-ft016-04)");
  });
});
