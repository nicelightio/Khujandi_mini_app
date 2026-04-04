import {
  buildDeliveryTrackingCallbackData,
  parseDeliveryTrackingCallbackData,
  TelegramBotDeliveryTrackingHarness,
} from "../../../backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.harness";
import { TelegramBotDeliveryTrackingNotifier } from "../../../backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.notifier";
import { DeliveryTrackingService } from "../../../backend/src/slices/delivery-tracking/application/delivery-tracking.service";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import type {
  DeliveryTrackingNotifier,
  DeliveryTrackingRepository,
  DeliveryTrackingStatusCommandInput,
} from "../../../backend/src/slices/delivery-tracking/domain/delivery-tracking.types";

const createRepository = (): DeliveryTrackingRepository => ({
  findOrderById: async () => ({
    id: "order-1",
    courierId: "courier-1",
    status: "ASSIGNED",
    updatedAt: new Date("2026-04-03T09:55:00.000Z"),
    isDeleted: false,
  }),
  listEventsSince: async () => ({
    events: [],
    nextCursor: "0",
  }),
  findUserTelegramIdById: async () => "10001",
  recordStatusTransition: async () => ({
    order: {
      id: "order-1",
      courierId: "courier-1",
      status: "IN_PROGRESS",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    },
    statusHistory: {
      id: 1n,
      orderId: "order-1",
      oldStatus: "ASSIGNED",
      newStatus: "IN_PROGRESS",
      changedByUserId: "courier-1",
      changedAt: new Date("2026-04-03T10:00:00.000Z"),
    },
    event: {
      type: "order.status_changed",
      entity: "order",
      entityId: "order-1",
      payload: {
        orderId: "order-1",
        previousStatus: "ASSIGNED",
        status: "IN_PROGRESS",
        changedByUserId: "courier-1",
        updatedAt: "2026-04-03T10:00:00.000Z",
      },
      revision: "2",
      createdAt: "2026-04-03T10:00:00.000Z",
    },
    revision: "2",
  }),
});

describe("delivery-tracking service", () => {
  it("maps status-change notifications into the transport-only Telegram harness", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const notifier = new TelegramBotDeliveryTrackingNotifier(
      new TelegramBotDeliveryTrackingHarness({ sendMessage }),
    );

    await expect(
      notifier.notifyStatusChanged({
        orderId: "order-1",
        courierTelegramId: "10001",
        status: "IN_PROGRESS",
        revision: "22",
        availableActions: ["DELIVERED"],
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: "10001",
      text:
        "Order order-1 is currently IN_PROGRESS. Choose the next courier action in the owning delivery-tracking flow.",
      dedupeKey: "order.status_changed:order-1:22",
      buttons: [
        {
          label: "Mark delivered",
          callbackData: "delivery-tracking:order-1:DELIVERED",
        },
      ],
    });
  });

  it("builds courier bot prompts without moving state-machine ownership into the transport layer", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const harness = new TelegramBotDeliveryTrackingHarness({ sendMessage });

    await expect(
      harness.notifyCourierStatusActions({
        courierTelegramId: "10001",
        orderId: "order-1",
        currentStatus: "ASSIGNED",
        revision: "22",
        availableActions: ["IN_PROGRESS"],
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: "10001",
      text:
        "Order order-1 is currently ASSIGNED. Choose the next courier action in the owning delivery-tracking flow.",
      dedupeKey: "order.status_changed:order-1:22",
      buttons: [
        {
          label: "Start delivery",
          callbackData: "delivery-tracking:order-1:IN_PROGRESS",
        },
      ],
    });
  });

  it("parses courier callback payloads as transport-only action intents", () => {
    const callbackData = buildDeliveryTrackingCallbackData({
      orderId: "order-1",
      nextStatus: "DELIVERED",
    });

    expect(callbackData).toBe("delivery-tracking:order-1:DELIVERED");
    expect(parseDeliveryTrackingCallbackData(callbackData)).toEqual({
      orderId: "order-1",
      nextStatus: "DELIVERED",
    });
    expect(parseDeliveryTrackingCallbackData("delivery-tracking:order-1:CANCELLED_BY_ADMIN")).toBeNull();
  });

  it("keeps order lookup behind the owning slice repository", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    const service = new DeliveryTrackingService({
      ...createRepository(),
      findOrderById,
    });

    await expect(service.findOrderById("order-1")).resolves.toEqual({
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    expect(findOrderById).toHaveBeenCalledWith("order-1");
  });

  it("returns ordered polling events with string cursor semantics from the owning repository", async () => {
    const listEventsSince = jest.fn().mockResolvedValue({
      events: [
        {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T10:00:00.000Z",
          },
          revision: "11",
          createdAt: "2026-04-03T10:00:00.000Z",
        },
      ],
      nextCursor: "11",
    });
    const service = new DeliveryTrackingService({
      ...createRepository(),
      listEventsSince,
    });

    await expect(service.getEventsSince("10")).resolves.toEqual({
      events: [
        {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T10:00:00.000Z",
          },
          revision: "11",
          createdAt: "2026-04-03T10:00:00.000Z",
        },
      ],
      nextCursor: "11",
    });
    expect(listEventsSince).toHaveBeenCalledWith("10");
  });

  it("returns polling-friendly metadata after recording a status transition baseline", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    const recordStatusTransition = jest.fn().mockResolvedValue({
      order: {
        id: "order-1",
        courierId: "courier-1",
        status: "IN_PROGRESS",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        isDeleted: false,
      },
      statusHistory: {
        id: 1n,
        orderId: "order-1",
        oldStatus: "ASSIGNED",
        newStatus: "IN_PROGRESS",
        changedByUserId: "courier-1",
        changedAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      event: {
        type: "order.status_changed",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          previousStatus: "ASSIGNED",
          status: "IN_PROGRESS",
          changedByUserId: "courier-1",
          updatedAt: "2026-04-03T10:00:00.000Z",
        },
        revision: "2",
        createdAt: "2026-04-03T10:00:00.000Z",
      },
      revision: "2",
    });
    const service = new DeliveryTrackingService({
      ...createRepository(),
      findOrderById,
      recordStatusTransition,
    });
    const input: DeliveryTrackingStatusCommandInput = {
      orderId: "order-1",
      nextStatus: "IN_PROGRESS",
      actor: {
        userId: "courier-1",
        role: "courier",
      },
    };

    await expect(service.recordStatusTransition(input)).resolves.toEqual({
      orderId: "order-1",
      status: "IN_PROGRESS",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      revision: "2",
    });
    expect(recordStatusTransition).toHaveBeenCalledWith({
      orderId: "order-1",
      changedByUserId: "courier-1",
      oldStatus: "ASSIGNED",
      newStatus: "IN_PROGRESS",
      changedAt: expect.any(Date),
    });
  });

  it("dispatches status-change notifications after committed transitions without changing write ownership", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    const findUserTelegramIdById = jest.fn().mockResolvedValue("10001");
    const recordStatusTransition = jest.fn().mockResolvedValue({
      order: {
        id: "order-1",
        courierId: "courier-1",
        status: "IN_PROGRESS",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        isDeleted: false,
      },
      statusHistory: {
        id: 1n,
        orderId: "order-1",
        oldStatus: "ASSIGNED",
        newStatus: "IN_PROGRESS",
        changedByUserId: "courier-1",
        changedAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      event: {
        type: "order.status_changed",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          previousStatus: "ASSIGNED",
          status: "IN_PROGRESS",
          changedByUserId: "courier-1",
          updatedAt: "2026-04-03T10:00:00.000Z",
        },
        revision: "2",
        createdAt: "2026-04-03T10:00:00.000Z",
      },
      revision: "2",
    });
    const notifier: DeliveryTrackingNotifier = {
      notifyStatusChanged: jest.fn().mockResolvedValue(undefined),
    };
    const service = new DeliveryTrackingService(
      {
        ...createRepository(),
        findOrderById,
        findUserTelegramIdById,
        recordStatusTransition,
      },
      notifier,
    );

    await expect(
      service.recordStatusTransition({
        orderId: "order-1",
        nextStatus: "IN_PROGRESS",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
      }),
    ).resolves.toMatchObject({
      orderId: "order-1",
      status: "IN_PROGRESS",
      revision: "2",
    });

    expect(findUserTelegramIdById).toHaveBeenCalledWith("courier-1");
    expect(notifier.notifyStatusChanged).toHaveBeenCalledWith({
      orderId: "order-1",
      courierTelegramId: "10001",
      status: "IN_PROGRESS",
      revision: "2",
      availableActions: ["DELIVERED"],
    });
  });

  it("swallows notifier outages so retries do not duplicate committed write-side effects", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    const findUserTelegramIdById = jest.fn().mockResolvedValue("10001");
    const recordStatusTransition = jest.fn().mockResolvedValue({
      order: {
        id: "order-1",
        courierId: "courier-1",
        status: "IN_PROGRESS",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        isDeleted: false,
      },
      statusHistory: {
        id: 1n,
        orderId: "order-1",
        oldStatus: "ASSIGNED",
        newStatus: "IN_PROGRESS",
        changedByUserId: "courier-1",
        changedAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      event: {
        type: "order.status_changed",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          previousStatus: "ASSIGNED",
          status: "IN_PROGRESS",
          changedByUserId: "courier-1",
          updatedAt: "2026-04-03T10:00:00.000Z",
        },
        revision: "2",
        createdAt: "2026-04-03T10:00:00.000Z",
      },
      revision: "2",
    });
    const notifier: DeliveryTrackingNotifier = {
      notifyStatusChanged: jest.fn().mockRejectedValue(new Error("transport outage")),
    };
    const service = new DeliveryTrackingService(
      {
        ...createRepository(),
        findOrderById,
        findUserTelegramIdById,
        recordStatusTransition,
      },
      notifier,
    );

    await expect(
      service.recordStatusTransition({
        orderId: "order-1",
        nextStatus: "IN_PROGRESS",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      status: "IN_PROGRESS",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      revision: "2",
    });

    expect(recordStatusTransition).toHaveBeenCalledTimes(1);
    expect(notifier.notifyStatusChanged).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid adjacent transitions with 409 and no persistence call", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    const recordStatusTransition = jest.fn();
    const service = new DeliveryTrackingService({
      ...createRepository(),
      findOrderById,
      recordStatusTransition,
    });

    await expect(
      service.recordStatusTransition({
        orderId: "order-1",
        nextStatus: "DELIVERED",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
      }),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Order cannot transition to the requested status", 409, {
        orderId: "order-1",
        currentStatus: "ASSIGNED",
        nextStatus: "DELIVERED",
        expectedStatus: "IN_PROGRESS",
      }),
    );
    expect(recordStatusTransition).not.toHaveBeenCalled();
  });

  it("rejects courier actors that do not own the assigned order", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-2",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    const recordStatusTransition = jest.fn();
    const service = new DeliveryTrackingService({
      ...createRepository(),
      findOrderById,
      recordStatusTransition,
    });

    await expect(
      service.recordStatusTransition({
        orderId: "order-1",
        nextStatus: "IN_PROGRESS",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
      }),
    ).rejects.toEqual(
      new AppError(
        "FORBIDDEN",
        "Courier cannot update an order assigned to another courier",
        403,
        {
          orderId: "order-1",
          courierId: "courier-1",
          assignedCourierId: "courier-2",
        },
      ),
    );
    expect(recordStatusTransition).not.toHaveBeenCalled();
  });

  it("rejects non-courier roles before persistence", async () => {
    const findOrderById = jest.fn();
    const recordStatusTransition = jest.fn();
    const service = new DeliveryTrackingService({
      ...createRepository(),
      findOrderById,
      recordStatusTransition,
    });

    await expect(
      service.recordStatusTransition({
        orderId: "order-1",
        nextStatus: "IN_PROGRESS",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
      }),
    ).rejects.toEqual(
      new AppError("FORBIDDEN", "User role cannot update delivery status", 403, {
        role: "admin",
      }),
    );
    expect(findOrderById).not.toHaveBeenCalled();
    expect(recordStatusTransition).not.toHaveBeenCalled();
  });
});
