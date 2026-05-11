import type { AdminOperatorDeliveryOrder, AdminOperatorDeliveryOrdersResult } from "../../admin/api/admin-assignment-api";
import {
  createReadyAdminAssignmentViewModel,
  sortAdminOperatorDeliveryOrders,
} from "../../admin/model/admin-assignment-view-model";

const baseOrder = (overrides: Partial<AdminOperatorDeliveryOrder>): AdminOperatorDeliveryOrder => ({
  orderId: "order-base",
  publicOrderNumber: "order-base",
  summary: {
    shopName: "Base Shop",
    totalAmountMinor: 1000,
    currency: "TJS",
  },
  createdAt: "2026-05-09T10:00:00.000Z",
  updatedAt: "2026-05-09T10:00:00.000Z",
  status: "CREATED",
  severity: "unassigned",
  courier: {
    marker: "absent",
    current: null,
  },
  assignedAt: null,
  claimedAt: null,
  latestMessage: null,
  latestMessagePreview: null,
  latestMessageSenderRole: null,
  statusRevision: "1",
  history: [],
  ...overrides,
});

const resultWith = (orders: AdminOperatorDeliveryOrder[]): AdminOperatorDeliveryOrdersResult => ({
  window: {
    from: "2026-05-05T19:00:00.000Z",
    to: "2026-05-09T12:00:00.000Z",
  },
  generatedAt: "2026-05-09T12:00:00.000Z",
  revision: "99",
  orders,
});

describe("admin assignment view model", () => {
  it("maps deterministic severity tones and delayed blink markers", () => {
    const viewModel = createReadyAdminAssignmentViewModel(
      resultWith([
        baseOrder({ orderId: "delayed", publicOrderNumber: "delayed", status: "DELAYED", severity: "delayed" }),
        baseOrder({ orderId: "cancelled", publicOrderNumber: "cancelled", status: "CANCELLED_BY_ADMIN", severity: "cancelled" }),
        baseOrder({ orderId: "completed", publicOrderNumber: "completed", status: "COMPLETED", severity: "completed" }),
        baseOrder({ orderId: "unassigned", publicOrderNumber: "unassigned", severity: "unassigned" }),
        baseOrder({ orderId: "under-30", publicOrderNumber: "under-30", status: "ASSIGNED", severity: "active_under_30" }),
        baseOrder({ orderId: "thirty-sixty", publicOrderNumber: "thirty-sixty", status: "IN_PROGRESS", severity: "active_30_60" }),
        baseOrder({ orderId: "sixty-plus", publicOrderNumber: "sixty-plus", status: "IN_PROGRESS", severity: "active_60_plus" }),
        baseOrder({ orderId: "delivered", publicOrderNumber: "delivered", status: "DELIVERED", severity: "attention" }),
      ]),
    );

    const toneByOrder = new Map(viewModel.orders.map((order) => [order.orderId, order.severityTone]));

    expect(toneByOrder.get("delayed")).toBe("danger");
    expect(viewModel.orders.find((order) => order.orderId === "delayed")?.isDelayedAlert).toBe(true);
    expect(toneByOrder.get("cancelled")).toBe("purple");
    expect(toneByOrder.get("completed")).toBe("neutral");
    expect(toneByOrder.get("unassigned")).toBe("info");
    expect(toneByOrder.get("under-30")).toBe("warning");
    expect(toneByOrder.get("thirty-sixty")).toBe("orange");
    expect(toneByOrder.get("sixty-plus")).toBe("danger");
    expect(toneByOrder.get("delivered")).toBe("danger");
  });

  it("builds the top alert from delayed and no-courier orders only", () => {
    const viewModel = createReadyAdminAssignmentViewModel(
      resultWith([
        baseOrder({ orderId: "delayed", publicOrderNumber: "KHU-1", status: "DELAYED", severity: "delayed" }),
        baseOrder({ orderId: "unassigned", publicOrderNumber: "KHU-2", severity: "unassigned" }),
        baseOrder({
          orderId: "assigned",
          publicOrderNumber: "KHU-3",
          status: "ASSIGNED",
          severity: "active_under_30",
          courier: {
            marker: "current",
            current: { id: "courier-1", name: "Courier One", telegramId: null },
          },
        }),
      ]),
    );

    expect(viewModel.alertOrders.map((order) => order.publicOrderNumber)).toEqual(["KHU-1", "KHU-2"]);
    expect(viewModel.alertOrders.map((order) => order.reasonLabel)).toEqual(["Задержан", "Нет принявшего курьера"]);
  });

  it("treats DELAYED status as danger alert copy even when the read severity is stale", () => {
    const viewModel = createReadyAdminAssignmentViewModel(
      resultWith([
        baseOrder({
          orderId: "delayed-status",
          publicOrderNumber: "KHU-DELAYED",
          status: "DELAYED",
          severity: "unassigned",
        }),
      ]),
    );

    expect(viewModel.orders[0]).toMatchObject({
      orderId: "delayed-status",
      statusLabel: "Задержан",
      severityLabel: "Задержан",
      severityTone: "danger",
      isDelayedAlert: true,
    });
    expect(viewModel.alertOrders).toEqual([
      {
        orderId: "delayed-status",
        publicOrderNumber: "KHU-DELAYED",
        reasonLabel: "Задержан",
        severityLabel: "Задержан",
        severityTone: "danger",
      },
    ]);
  });

  it("enables only manual targeted offer while keeping status and bot actions guarded", () => {
    const viewModel = createReadyAdminAssignmentViewModel(
      resultWith([
        baseOrder({
          orderId: "unassigned",
          publicOrderNumber: "KHU-1",
          status: "CREATED",
          severity: "unassigned",
        }),
      ]),
    );

    expect(viewModel.orders[0].actionCells).toEqual([
      {
        key: "targeted_offer",
        label: "Персональное предложение",
        stateLabel: "Создать ожидающее предложение",
        detailLabel: "Создает ожидающее предложение курьеру. Подтверждение курьером будет отдельным шагом, заказ пока остается неназначенным.",
        isEnabled: true,
      },
      {
        key: "broadcast_offer",
        label: "Массовое предложение",
        stateLabel: "Запустить явно",
        detailLabel: "Явно создает ожидающие массовые предложения для активных свободных auto-offer курьеров. Иначе auto-offer выключен.",
        isEnabled: true,
      },
      {
        key: "status_control",
        label: "Управление статусом",
        stateLabel: "Серверная команда еще не включена",
        detailLabel: "Для текущего статуса заказа нет разрешенного перехода оператора/админа.",
        isEnabled: false,
      },
      {
        key: "bot_chat",
        label: "Чат в боте",
        stateLabel: "Среда еще не включена",
        detailLabel: "Редирект в бот не выполняется, пока не подключены привязанная к заказу среда Telegram и сохранение сообщений.",
        isEnabled: false,
      },
    ]);
  });

  it("enables confirmed operator closure for DELIVERED orders only as the next transition", () => {
    const viewModel = createReadyAdminAssignmentViewModel(
      resultWith([
        baseOrder({
          orderId: "delivered",
          publicOrderNumber: "KHU-DONE",
          status: "DELIVERED",
          severity: "attention",
          courier: {
            marker: "current",
            current: { id: "courier-1", name: "Courier One", telegramId: null },
          },
        }),
      ]),
    );

    expect(viewModel.orders[0].actionCells.find((action) => action.key === "status_control")).toEqual({
      key: "status_control",
      label: "Управление статусом",
      stateLabel: "Завершить заказ -> Завершен",
      detailLabel: "Требует подтверждения и записывает оператора/админа в историю статусов.",
      isEnabled: true,
      nextStatus: "COMPLETED",
    });
  });

  it("keeps terminal operator rows closed without follow-up status controls", () => {
    const viewModel = createReadyAdminAssignmentViewModel(
      resultWith([
        baseOrder({
          orderId: "completed",
          publicOrderNumber: "KHU-CLOSED",
          status: "COMPLETED",
          severity: "completed",
        }),
        baseOrder({
          orderId: "cancelled",
          publicOrderNumber: "KHU-CANCELLED",
          status: "CANCELLED_BY_ADMIN",
          severity: "cancelled",
        }),
      ]),
    );

    const statusActions = viewModel.orders.map((order) =>
      order.actionCells.find((action) => action.key === "status_control"),
    );

    expect(statusActions).toEqual([
      {
        key: "status_control",
        label: "Управление статусом",
        stateLabel: "Серверная команда еще не включена",
        detailLabel: "Для текущего статуса заказа нет разрешенного перехода оператора/админа.",
        isEnabled: false,
      },
      {
        key: "status_control",
        label: "Управление статусом",
        stateLabel: "Серверная команда еще не включена",
        detailLabel: "Для текущего статуса заказа нет разрешенного перехода оператора/админа.",
        isEnabled: false,
      },
    ]);
  });

  it("sorts deterministically by every supported operator control", () => {
    const orders = [
      baseOrder({
        orderId: "completed",
        publicOrderNumber: "KHU-3",
        status: "COMPLETED",
        severity: "completed",
        createdAt: "2026-05-09T10:30:00.000Z",
        latestMessage: "closed",
        courier: {
          marker: "current",
          current: { id: "courier-3", name: "Zafar", telegramId: null },
        },
        assignedAt: "2026-05-09T10:40:00.000Z",
      }),
      baseOrder({
        orderId: "delayed",
        publicOrderNumber: "KHU-1",
        status: "DELAYED",
        severity: "delayed",
        createdAt: "2026-05-09T10:00:00.000Z",
      }),
      baseOrder({
        orderId: "assigned",
        publicOrderNumber: "KHU-2",
        status: "ASSIGNED",
        severity: "active_under_30",
        createdAt: "2026-05-09T11:00:00.000Z",
        courier: {
          marker: "current",
          current: { id: "courier-2", name: "Aziz", telegramId: null },
        },
        assignedAt: "2026-05-09T11:05:00.000Z",
      }),
    ];

    expect(sortAdminOperatorDeliveryOrders(orders, "urgency").map((order) => order.orderId)).toEqual([
      "delayed",
      "assigned",
      "completed",
    ]);
    expect(sortAdminOperatorDeliveryOrders(orders, "created_at").map((order) => order.orderId)).toEqual([
      "assigned",
      "completed",
      "delayed",
    ]);
    expect(sortAdminOperatorDeliveryOrders(orders, "status").map((order) => order.orderId)).toEqual([
      "delayed",
      "assigned",
      "completed",
    ]);
    expect(sortAdminOperatorDeliveryOrders(orders, "courier").map((order) => order.orderId)).toEqual([
      "delayed",
      "assigned",
      "completed",
    ]);
    expect(sortAdminOperatorDeliveryOrders(orders, "assigned_at").map((order) => order.orderId)).toEqual([
      "delayed",
      "completed",
      "assigned",
    ]);
    expect(sortAdminOperatorDeliveryOrders(orders, "message_presence").map((order) => order.orderId)).toEqual([
      "completed",
      "delayed",
      "assigned",
    ]);
  });
});
