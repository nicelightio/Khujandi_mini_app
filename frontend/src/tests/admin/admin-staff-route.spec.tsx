import { act, create, type ReactTestRenderer } from "react-test-renderer";
import {
  AdminStaffApiError,
  type AdminStaffApi,
  type AdminCourierStaffCard,
  type AdminOperatorStaffCard,
  type AdminStaffTablesResult,
} from "../../admin/api/admin-staff-api";
import { AdminStaffRoute } from "../../admin/routes/admin-staff-route";

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = async () => {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
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

const activeStaffTables: AdminStaffTablesResult = {
  couriers: [
    {
      courierUserId: "courier-user-1",
      nickname: "Courier One",
      telegramUserId: "99001",
      activeStatus: "active",
      deliveredOrdersCount: 120,
      manualRatingAdjustment: 1,
      automaticPenalties: -1,
      courierOrderRating: 1,
      courierAverageReviewRating: 4.5,
      courierClientReviewCount: 2,
      unsuccessfulOrdersCount: 3,
      unsuccessfulPercent: 2.5,
    },
  ],
  operators: [
    {
      operatorAdminAccountId: "operator-account-1",
      nickname: "Operator One",
      email: "operator@example.com",
      activeStatus: "active",
      authActive: true,
      processedOrdersCount: 210,
      manualRatingAdjustment: -1,
      operatorRating: 1,
    },
  ],
};

const archivedStaffTables: AdminStaffTablesResult = {
  couriers: [
    ...activeStaffTables.couriers,
    {
      courierUserId: "courier-user-archive",
      nickname: "Courier Archive",
      telegramUserId: "99002",
      activeStatus: "soft_deleted",
      deliveredOrdersCount: 10,
      manualRatingAdjustment: 0,
      automaticPenalties: 0,
      courierOrderRating: 0,
      courierAverageReviewRating: null,
      courierClientReviewCount: 0,
      unsuccessfulOrdersCount: 1,
      unsuccessfulPercent: 10,
    },
  ],
  operators: [
    ...activeStaffTables.operators,
    {
      operatorAdminAccountId: "operator-account-archive",
      nickname: "Operator Archive",
      email: "operator-archive@example.com",
      activeStatus: "soft_deleted",
      authActive: false,
      processedOrdersCount: 4,
      manualRatingAdjustment: 0,
      operatorRating: 0,
    },
  ],
};

const courierCard: AdminCourierStaffCard = {
  ...activeStaffTables.couriers[0],
  addedByAdminAccountId: "admin-1",
  addedAt: "2026-05-14T08:00:00.000Z",
  deactivatedByAdminAccountId: null,
  deactivatedAt: null,
  reactivatedByAdminAccountId: "boss-1",
  reactivatedAt: "2026-05-14T09:00:00.000Z",
  lifecycleHistory: [
    {
      actorAdminAccountId: "boss-1",
      action: "reactivated",
      previousNickname: null,
      newNickname: null,
      reason: "returned",
      createdAt: "2026-05-14T09:00:00.000Z",
    },
  ],
  deactivationHistory: [],
  reactivationHistory: [
    {
      actorAdminAccountId: "boss-1",
      action: "reactivated",
      previousNickname: null,
      newNickname: null,
      reason: "returned",
      createdAt: "2026-05-14T09:00:00.000Z",
    },
  ],
  manualRatingAdjustmentHistory: [
    {
      actorAdminAccountId: "admin-1",
      delta: 1,
      reason: "good shift",
      createdAt: "2026-05-14T10:00:00.000Z",
    },
  ],
  lastOrders: [
    {
      orderId: "order-11-unfinished",
      status: "IN_PROGRESS",
      createdAt: "2026-05-14T08:11:00.000Z",
      updatedAt: "2026-05-14T09:50:00.000Z",
      clientReviewRating: null,
      problemReasons: ["unfinished"],
    },
    {
      orderId: "order-10-delivered",
      status: "DELIVERED",
      createdAt: "2026-05-14T08:10:00.000Z",
      updatedAt: "2026-05-14T09:40:00.000Z",
      clientReviewRating: 5,
      problemReasons: [],
    },
  ],
  problemOrders: [
    {
      orderId: "order-08-rating-one",
      status: "COMPLETED",
      createdAt: "2026-05-14T08:08:00.000Z",
      updatedAt: "2026-05-14T09:20:00.000Z",
      clientReviewRating: 1,
      problemReasons: ["client_rating_1"],
    },
  ],
};

const operatorCard: AdminOperatorStaffCard = {
  ...activeStaffTables.operators[0],
  addedByAdminAccountId: "admin-1",
  addedAt: "2026-05-14T08:00:00.000Z",
  deactivatedByAdminAccountId: null,
  deactivatedAt: null,
  reactivatedByAdminAccountId: "boss-1",
  reactivatedAt: "2026-05-14T09:00:00.000Z",
  lifecycleHistory: [
    {
      actorAdminAccountId: "boss-1",
      action: "reactivated",
      previousNickname: null,
      newNickname: null,
      reason: "returned",
      createdAt: "2026-05-14T09:00:00.000Z",
    },
  ],
  deactivationHistory: [],
  reactivationHistory: [
    {
      actorAdminAccountId: "boss-1",
      action: "reactivated",
      previousNickname: null,
      newNickname: null,
      reason: "returned",
      createdAt: "2026-05-14T09:00:00.000Z",
    },
  ],
  manualRatingAdjustmentHistory: [
    {
      actorAdminAccountId: "boss-1",
      delta: -1,
      reason: "missed close",
      createdAt: "2026-05-14T10:05:00.000Z",
    },
  ],
  lastProcessedOrders: [
    {
      orderId: "order-1",
      status: "COMPLETED",
      createdAt: "2026-05-14T07:00:00.000Z",
      updatedAt: "2026-05-14T08:00:00.000Z",
      lastWriteAt: "2026-05-14T08:00:00.000Z",
      actionTypes: ["status:COMPLETED"],
      personallyCompleted: true,
      problemReasons: [],
    },
  ],
  problemOrders: [
    {
      orderId: "order-2",
      status: "COMPLETED",
      createdAt: "2026-05-14T07:10:00.000Z",
      updatedAt: "2026-05-14T08:10:00.000Z",
      lastWriteAt: "2026-05-14T08:10:00.000Z",
      actionTypes: ["order.offer_created"],
      personallyCompleted: false,
      problemReasons: ["not_personally_completed"],
    },
  ],
};

const archivedCourierCard: AdminCourierStaffCard = {
  ...courierCard,
  courierUserId: "courier-user-archive",
  nickname: "Courier Archive",
  telegramUserId: "99002",
  activeStatus: "soft_deleted",
  addedByAdminAccountId: "admin-1",
  addedAt: "2026-05-14T08:00:00.000Z",
  deactivatedByAdminAccountId: "admin-1",
  deactivatedAt: "2026-05-14T08:30:00.000Z",
  reactivatedByAdminAccountId: null,
  reactivatedAt: null,
};

describe("admin staff route", () => {
  const createStaffApiMock = (overrides: Partial<AdminStaffApi> = {}): AdminStaffApi => ({
    listCouriers: jest.fn(),
    listOperators: jest.fn(),
    listStaffTables: jest.fn(),
    getCourierCard: jest.fn().mockResolvedValue(courierCard),
    getOperatorCard: jest.fn().mockResolvedValue(operatorCard),
    createCourier: jest.fn().mockResolvedValue({
      ok: true,
    }),
    createOperator: jest.fn().mockResolvedValue({
      oneTimePassword: "strong-password-01",
    }),
    deactivateCourier: jest.fn().mockResolvedValue({
      ok: true,
    }),
    deactivateOperator: jest.fn().mockResolvedValue({
      ok: true,
    }),
    reactivateCourier: jest.fn().mockResolvedValue({
      ok: true,
    }),
    reactivateOperator: jest.fn().mockResolvedValue({
      ok: true,
    }),
    adjustCourierRating: jest.fn().mockResolvedValue({
      ok: true,
    }),
    adjustOperatorRating: jest.fn().mockResolvedValue({
      ok: true,
    }),
    resetOperatorPassword: jest.fn().mockResolvedValue({
      oneTimePassword: "new-password-01",
    }),
    updateOperatorNickname: jest.fn().mockResolvedValue({
      ok: true,
    }),
    ...overrides,
  });

  const renderRoute = async (
    role: "admin" | "boss" = "admin",
    loadStaffTables: (input: { includeInactive: boolean }) => Promise<AdminStaffTablesResult> = jest
      .fn()
      .mockResolvedValue(activeStaffTables),
    api?: AdminStaffApi,
  ): Promise<ReactTestRenderer> => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminStaffRoute role={role} loadStaffTables={loadStaffTables} api={api} />);
      await flushPromises();
    });

    return renderer;
  };

  it("renders courier commands without email/password fields in the courier workflow", async () => {
    const loadStaffTables = jest.fn().mockResolvedValue(activeStaffTables);
    const renderer = await renderRoute("admin", loadStaffTables);
    const text = collectText(renderer.toJSON()).join(" ");

    expect(loadStaffTables).toHaveBeenCalledWith({
      includeInactive: false,
    });
    expect(text).toContain("Staff panel");
    expect(text).toContain("Курьеры и операторы управляются отдельными командами Staff panel.");
    expect(text).toContain("Couriers");
    expect(text).toContain("Operators");
    expect(text).toContain("Добавить курьера");
    expect(text).toContain("99001");
    expect(text).toContain("Courier One");
    expect(text).toContain("Активен");
    expect(text).toContain("120");
    expect(text).toContain("4.5 / 5 (2)");
    expect(text).toContain("2.5%");
    expect(text).toContain("+1");
    expect(text).toContain("Деактивировать");
    expect(text).not.toContain("Показать архивных сотрудников");
    expect(renderer.root.findAllByProps({ name: "courierTelegramUserId" })).toHaveLength(1);
    expect(renderer.root.findAllByProps({ name: "courierNickname" })).toHaveLength(1);
    expect(renderer.root.findAllByProps({ name: "operatorEmail" })).toHaveLength(1);
    expect(renderer.root.findAllByProps({ name: "operatorPassword" })).toHaveLength(1);
    expect(renderer.root.findAllByProps({ name: "courierEmail" })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ name: "courierPassword" })).toHaveLength(0);
    expect(text).not.toContain("passwordHash");
    expect(text).not.toContain("Удалить");
    expect(text).not.toContain("ADMIN");
    expect(text).not.toContain("BOSS");
  });

  it("keeps boss-only operator reset/nickname/reactivation controls hidden from admin", async () => {
    const renderer = await renderRoute("admin");

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-tab": "operators" }).props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("operator@example.com");
    expect(text).toContain("Operator One");
    expect(text).toContain("Логин активен");
    expect(text).toContain("210");
    expect(text).toContain("-1");
    expect(text).toContain("Деактивировать");
    expect(text).not.toContain("Сбросить пароль");
    expect(text).not.toContain("Обновить nickname");
    expect(text).not.toContain("Вернуть оператора");
    expect(text).not.toContain("ADMIN");
    expect(text).not.toContain("BOSS");
  });

  it("lets boss include archived staff through the verified includeInactive query state", async () => {
    const loadStaffTables = jest
      .fn()
      .mockResolvedValueOnce(activeStaffTables)
      .mockResolvedValueOnce(archivedStaffTables);
    const renderer = await renderRoute("boss", loadStaffTables);

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-archive-toggle": "true" }).props.onChange({
        target: {
          checked: true,
        },
      });
      await flushPromises();
    });

    expect(loadStaffTables).toHaveBeenNthCalledWith(1, {
      includeInactive: false,
    });
    expect(loadStaffTables).toHaveBeenNthCalledWith(2, {
      includeInactive: true,
    });
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Courier Archive");
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Архив");

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-tab": "operators" }).props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Operator Archive");
    expect(text).toContain("operator-archive@example.com");
    expect(text).toContain("Логин выключен");
  });

  it("opens courier detail with history, metrics, latest orders and problem orders", async () => {
    const getCourierCard = jest.fn().mockResolvedValue({
      ...courierCard,
      passwordHash: "must-not-render",
      oneTimePassword: "must-not-render",
    });
    const api = createStaffApiMock({
      getCourierCard,
    });
    const renderer = await renderRoute("admin", jest.fn().mockResolvedValue(activeStaffTables), api);

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Карточка не выбрана.");

    await act(async () => {
      renderer.root.findByProps({
        "data-admin-staff-action": "open-courier-detail-courier-user-1",
      }).props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(getCourierCard).toHaveBeenCalledWith({
      courierUserId: "courier-user-1",
      includeInactive: false,
    });
    expect(text).toContain("Telegram user id");
    expect(text).toContain("99001");
    expect(text).toContain("Добавил");
    expect(text).toContain("admin-1");
    expect(text).toContain("Order rating");
    expect(text).toContain("4.5 / 5 (2)");
    expect(text).toContain("order-11-unfinished");
    expect(text).toContain("Не завершен");
    expect(text).toContain("order-08-rating-one");
    expect(text).toContain("Client rating 1");
    expect(text).toContain("good shift");
    expect(text).not.toContain("passwordHash");
    expect(text).not.toContain("oneTimePassword");
    expect(text).not.toContain("Сбросить пароль");

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-action": "close-detail" }).props.onClick();
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Карточка не выбрана.");
  });

  it("opens operator detail with processed history and problem order evidence", async () => {
    const getOperatorCard = jest.fn().mockResolvedValue({
      ...operatorCard,
      passwordHash: "must-not-render",
      oneTimePassword: "must-not-render",
    });
    const api = createStaffApiMock({
      getOperatorCard,
    });
    const renderer = await renderRoute("admin", jest.fn().mockResolvedValue(activeStaffTables), api);

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-tab": "operators" }).props.onClick();
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({
        "data-admin-staff-action": "open-operator-detail-operator-account-1",
      }).props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(getOperatorCard).toHaveBeenCalledWith({
      operatorAdminAccountId: "operator-account-1",
      includeInactive: false,
    });
    expect(text).toContain("Email / login");
    expect(text).toContain("operator@example.com");
    expect(text).toContain("Processed-order rating");
    expect(text).toContain("order-1");
    expect(text).toContain("status:COMPLETED");
    expect(text).toContain("Personally completed:");
    expect(text).toContain("yes");
    expect(text).toContain("order-2");
    expect(text).toContain("Не завершил лично");
    expect(text).toContain("missed close");
    expect(text).not.toContain("passwordHash");
    expect(text).not.toContain("oneTimePassword");
  });

  it("lets boss open inactive courier details only through archive-visible rows", async () => {
    const loadStaffTables = jest
      .fn()
      .mockResolvedValueOnce(activeStaffTables)
      .mockResolvedValueOnce(archivedStaffTables);
    const getCourierCard = jest.fn().mockResolvedValue(archivedCourierCard);
    const api = createStaffApiMock({
      getCourierCard,
    });
    const renderer = await renderRoute("boss", loadStaffTables, api);

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-archive-toggle": "true" }).props.onChange({
        target: {
          checked: true,
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({
        "data-admin-staff-action": "open-courier-detail-courier-user-archive",
      }).props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(getCourierCard).toHaveBeenCalledWith({
      courierUserId: "courier-user-archive",
      includeInactive: true,
    });
    expect(text).toContain("Courier Archive");
    expect(text).toContain("Архив");
    expect(text).toContain("Деактивировал");
  });

  it("renders a controlled detail error without hiding Staff tables", async () => {
    const getCourierCard = jest.fn().mockRejectedValue(
      new AdminStaffApiError("COURIER_STAFF_NOT_FOUND", "Courier staff was not found", "trace-card"),
    );
    const api = createStaffApiMock({
      getCourierCard,
    });
    const renderer = await renderRoute("admin", jest.fn().mockResolvedValue(activeStaffTables), api);

    await act(async () => {
      renderer.root.findByProps({
        "data-admin-staff-action": "open-courier-detail-courier-user-1",
      }).props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Courier staff was not found (trace: trace-card)");
    expect(text).toContain("Courier One");
  });

  it("creates courier and operator staff through scoped payloads and refreshes the tables", async () => {
    const loadStaffTables = jest.fn().mockResolvedValue(activeStaffTables);
    const createCourier = jest.fn().mockResolvedValue({
      ok: true,
    });
    const createOperator = jest.fn().mockResolvedValue({
      oneTimePassword: "strong-password-01",
    });
    const api = createStaffApiMock({
      createCourier,
      createOperator,
    });
    const renderer = await renderRoute("admin", loadStaffTables, api);

    await act(async () => {
      renderer.root.findByProps({ name: "courierTelegramUserId" }).props.onChange({
        target: {
          value: " 99004 ",
        },
      });
      renderer.root.findByProps({ name: "courierNickname" }).props.onChange({
        target: {
          value: " Courier New ",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-command": "create-courier" }).props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    expect(createCourier).toHaveBeenCalledWith({
      telegramUserId: "99004",
      nickname: "Courier New",
    });
    expect(loadStaffTables).toHaveBeenCalledTimes(2);

    await act(async () => {
      renderer.root.findByProps({ name: "operatorEmail" }).props.onChange({
        target: {
          value: " operator-new@example.com ",
        },
      });
      renderer.root.findByProps({ name: "operatorNickname" }).props.onChange({
        target: {
          value: " Operator New ",
        },
      });
      renderer.root.findByProps({ name: "operatorPassword" }).props.onChange({
        target: {
          value: "strong-password-01",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-command": "create-operator" }).props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    expect(createOperator).toHaveBeenCalledWith({
      email: "operator-new@example.com",
      nickname: "Operator New",
      password: "strong-password-01",
    });
    expect(JSON.stringify(createOperator.mock.calls[0]?.[0])).not.toContain("role");
    expect(renderer.root.findAllByProps({ name: "role" })).toHaveLength(0);
    expect(loadStaffTables).toHaveBeenCalledTimes(3);
    expect(collectText(renderer.toJSON()).join(" ")).toContain("strong-password-01");

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-action": "dismiss-one-time-password" }).props.onClick();
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).not.toContain("strong-password-01");
  });

  it("prevents duplicate command submit and refreshes after deactivate", async () => {
    let resolveDeactivate!: (value: { ok: true }) => void;
    const deactivateCourier = jest.fn(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          resolveDeactivate = resolve;
        }),
    );
    const loadStaffTables = jest.fn().mockResolvedValue(activeStaffTables);
    const api = createStaffApiMock({
      deactivateCourier,
    });
    const renderer = await renderRoute("admin", loadStaffTables, api);

    await act(async () => {
      const button = renderer.root.findByProps({
        "data-admin-staff-action": "deactivate-courier-courier-user-1",
      });
      button.props.onClick();
      button.props.onClick();
      await flushPromises();
    });

    expect(deactivateCourier).toHaveBeenCalledTimes(1);
    expect(deactivateCourier).toHaveBeenCalledWith({
      courierUserId: "courier-user-1",
      reason: null,
    });

    await act(async () => {
      resolveDeactivate({
        ok: true,
      });
      await flushPromises();
    });

    expect(loadStaffTables).toHaveBeenCalledTimes(2);
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Курьер деактивирован.");
  });

  it("exposes only +1/-1 staff rating adjustments and keeps client review rating read-only", async () => {
    const adjustCourierRating = jest.fn().mockResolvedValue({
      ok: true,
    });
    const adjustOperatorRating = jest.fn().mockResolvedValue({
      ok: true,
    });
    const api = createStaffApiMock({
      adjustCourierRating,
      adjustOperatorRating,
    });
    const renderer = await renderRoute("admin", jest.fn().mockResolvedValue(activeStaffTables), api);

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-action": "courier-rating-plus-courier-user-1" }).props.onClick();
      await flushPromises();
    });

    expect(adjustCourierRating).toHaveBeenCalledWith({
      courierUserId: "courier-user-1",
      delta: 1,
      reason: null,
    });
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Client rating");
    expect(renderer.root.findAllByProps({ name: "courierAverageReviewRating" })).toHaveLength(0);

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-tab": "operators" }).props.onClick();
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-action": "operator-rating-minus-operator-account-1" }).props.onClick();
      await flushPromises();
    });

    expect(adjustOperatorRating).toHaveBeenCalledWith({
      operatorAdminAccountId: "operator-account-1",
      delta: -1,
      reason: null,
    });
  });

  it("shows boss-only reactivate, nickname and reset workflows without persisting one-time password after dismissal", async () => {
    const loadStaffTables = jest
      .fn()
      .mockResolvedValueOnce(activeStaffTables)
      .mockResolvedValueOnce(archivedStaffTables)
      .mockResolvedValue(activeStaffTables);
    const reactivateOperator = jest.fn().mockResolvedValue({
      ok: true,
    });
    const updateOperatorNickname = jest.fn().mockResolvedValue({
      ok: true,
    });
    const resetOperatorPassword = jest.fn().mockResolvedValue({
      oneTimePassword: "new-password-01",
    });
    const api = createStaffApiMock({
      reactivateOperator,
      updateOperatorNickname,
      resetOperatorPassword,
    });
    const renderer = await renderRoute("boss", loadStaffTables, api);

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-archive-toggle": "true" }).props.onChange({
        target: {
          checked: true,
        },
      });
      await flushPromises();
      renderer.root.findByProps({ "data-admin-staff-tab": "operators" }).props.onClick();
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Вернуть оператора");

    await act(async () => {
      renderer.root.findByProps({
        "data-admin-staff-action": "reactivate-operator-operator-account-archive",
      }).props.onClick();
      await flushPromises();
    });

    expect(reactivateOperator).toHaveBeenCalledWith({
      operatorAdminAccountId: "operator-account-archive",
      reason: null,
    });

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-tab": "operators" }).props.onClick();
      await flushPromises();
      renderer.root.findByProps({ "data-admin-staff-nickname-input": "operator-account-1" }).props.onChange({
        target: {
          value: " Senior Operator ",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({
        "data-admin-staff-inline": "operator-nickname",
      }).props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    expect(updateOperatorNickname).toHaveBeenCalledWith({
      operatorAdminAccountId: "operator-account-1",
      nickname: "Senior Operator",
    });

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-password-reset": "operator-account-1" }).props.onChange({
        target: {
          value: "new-password-01",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({
        "data-admin-staff-inline": "operator-password-reset",
      }).props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    expect(resetOperatorPassword).toHaveBeenCalledWith({
      operatorAdminAccountId: "operator-account-1",
      password: "new-password-01",
    });
    expect(collectText(renderer.toJSON()).join(" ")).toContain("new-password-01");

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-action": "dismiss-one-time-password" }).props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).not.toContain("new-password-01");
    expect(text).not.toContain("passwordHash");
    expect(text).not.toContain("Удалить");
  });

  it("renders controlled command errors without refreshing stale command state", async () => {
    const loadStaffTables = jest.fn().mockResolvedValue(activeStaffTables);
    const api = createStaffApiMock({
      createCourier: jest.fn().mockRejectedValue(
        new AdminStaffApiError("DUPLICATE_COURIER_STAFF", "Courier staff already exists", "trace-staff"),
      ),
    });
    const renderer = await renderRoute("admin", loadStaffTables, api);

    await act(async () => {
      renderer.root.findByProps({ name: "courierTelegramUserId" }).props.onChange({
        target: {
          value: "99001",
        },
      });
      renderer.root.findByProps({ name: "courierNickname" }).props.onChange({
        target: {
          value: "Courier One",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({ "data-admin-staff-command": "create-courier" }).props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain(
      "Courier staff already exists (trace: trace-staff)",
    );
    expect(loadStaffTables).toHaveBeenCalledTimes(1);
  });

  it("uses the default API client with read-only GET requests", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          couriers: activeStaffTables.couriers,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          operators: activeStaffTables.operators,
        }),
    });
    globalWithFetch.fetch = fetchMock as typeof fetch;

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(<AdminStaffRoute role="admin" />);
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/admin/staff/couriers", {
      method: "GET",
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/admin/staff/operators", {
      method: "GET",
      credentials: "include",
    });
    expect(text).toContain("Courier One");
  });

  it("renders a controlled error when Staff panel reads fail", async () => {
    const renderer = await renderRoute("admin", async () => {
      throw new AdminStaffApiError("FORBIDDEN", "Staff panel requires admin or boss access", "trace-admin-staff-runtime");
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Staff panel requires admin or boss access (trace: trace-admin-staff-runtime)");
    expect(text).toContain("Активные курьеры для Staff panel не найдены.");
  });
});
