import { TelegramBotDeliveryAssignmentNotifier } from "../../../backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment.notifier";
import {
  buildCourierAvailabilityCallbackData,
  executeCourierAvailabilityIntent,
  parseCourierAvailabilityCallbackData,
  TelegramBotCourierAvailabilityHarness,
} from "../../../backend/src/integrations/telegram-bot/telegram-bot-courier-availability.harness";
import { DeliveryAssignmentService } from "../../../backend/src/slices/delivery-assignment/application/delivery-assignment.service";
import type {
  DeliveryAssignmentCourierAvailabilityRecord,
  DeliveryAssignmentNotifier,
  DeliveryAssignmentRepository,
} from "../../../backend/src/slices/delivery-assignment/domain/delivery-assignment.types";
import { AppError } from "../../../backend/src/shared/errors/app-error";

const createRepository = (): DeliveryAssignmentRepository => ({
  findOrderById: async () => null,
  findCourierById: async () => null,
  startCourierWork: async () => null,
  stopCourierWorkAfter: async () => null,
  setCourierAutoOfferParticipation: async () => null,
  hasBusyCourierOrder: async () => false,
  findAutoOfferCandidateCouriers: async () => [],
  createManualOffer: async () => ({
    offer: {
      id: "offer-1",
      orderId: "order-1",
      targetCourierId: "courier-1",
      kind: "manual",
      status: "pending",
      createdAt: new Date("2026-05-09T12:00:00.000Z"),
      updatedAt: new Date("2026-05-09T12:00:00.000Z"),
    },
    event: {
      id: 4n,
      type: "order.offer_created",
      entity: "order",
      entityId: "order-1",
      payload: {
        orderId: "order-1",
        offerId: "offer-1",
        targetCourierId: "courier-1",
        createdByUserId: "admin-1",
        kind: "manual",
        status: "pending",
        orderStatus: "CREATED",
        updatedAt: "2026-05-09T12:00:00.000Z",
      },
      createdAt: new Date("2026-05-09T12:00:00.000Z"),
    },
    order: {
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-05-09T12:00:00.000Z"),
      isDeleted: false,
    },
    revision: "4",
  }),
  createBroadcastOffers: async () => ({
    offers: [],
    order: {
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-05-09T12:00:00.000Z"),
      isDeleted: false,
    },
    revision: "0",
  }),
  assignCourier: async () => ({
    order: {
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    },
    statusHistory: {
      id: 1n,
      orderId: "order-1",
      oldStatus: "CREATED",
      newStatus: "ASSIGNED",
      changedByUserId: "admin-1",
      changedAt: new Date("2026-04-03T10:00:00.000Z"),
    },
    audit: {
      id: 2n,
      orderId: "order-1",
      adminUserId: "admin-1",
      courierUserId: "courier-1",
      action: "assigned",
      createdAt: new Date("2026-04-03T10:00:00.000Z"),
    },
    event: {
      id: 3n,
      type: "order.assigned",
      entity: "order",
      entityId: "order-1",
      payload: {
        orderId: "order-1",
        courierId: "courier-1",
        assignedByUserId: "admin-1",
        status: "ASSIGNED",
        updatedAt: "2026-04-03T10:00:00.000Z",
      },
      createdAt: new Date("2026-04-03T10:00:00.000Z"),
    },
    revision: "3",
  }),
});

describe("delivery-assignment service", () => {
  it("emits the Telegram courier menu with availability action labels and callback payloads", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const harness = new TelegramBotCourierAvailabilityHarness({
      sendMessage,
    });

    await expect(
      harness.notifyCourierMenu({
        courierTelegramId: "10001",
        revision: "availability-rev-1",
        availability: {
          courierId: "courier-1",
          active: false,
          free: true,
          autoOfferEnabled: false,
          acceptingOrdersUntil: null,
          ratingScore: 5,
        },
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: "10001",
      text: "Курьер",
      dedupeKey: "courier.availability.menu:courier-1:availability-rev-1",
      buttons: [
        {
          label: "Выйти на работу",
          callbackData:
            "delivery-assignment-courier-availability:start_work:courier-1",
        },
        {
          label: "Завершить прием заказов через 5 минут",
          callbackData:
            "delivery-assignment-courier-availability:stop_after_5_minutes:courier-1",
        },
        {
          label: "Автоматически принимать заказы: OFF",
          callbackData:
            "delivery-assignment-courier-availability:set_auto_offer:courier-1:on",
        },
      ],
    });
  });

  it("uses the opposite auto-offer payload while showing the current ON/OFF state", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const harness = new TelegramBotCourierAvailabilityHarness({
      sendMessage,
    });

    await harness.notifyCourierMenu({
      courierTelegramId: "10001",
      revision: "availability-rev-2",
      availability: {
        courierId: "courier-1",
        active: true,
        free: true,
        autoOfferEnabled: true,
        acceptingOrdersUntil: null,
        ratingScore: 5,
      },
    });

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        buttons: expect.arrayContaining([
          {
            label: "Автоматически принимать заказы: ON",
            callbackData:
              "delivery-assignment-courier-availability:set_auto_offer:courier-1:off",
          },
        ]),
      }),
    );
  });

  it("parses courier availability callbacks into service intents only", () => {
    expect(
      parseCourierAvailabilityCallbackData(
        buildCourierAvailabilityCallbackData({
          type: "start_work",
          courierId: "courier-1",
        }),
      ),
    ).toEqual({
      type: "start_work",
      courierId: "courier-1",
    });

    expect(
      parseCourierAvailabilityCallbackData(
        "delivery-assignment-courier-availability:set_auto_offer:courier-1:on",
      ),
    ).toEqual({
      type: "set_auto_offer",
      courierId: "courier-1",
      enabled: true,
    });

    expect(parseCourierAvailabilityCallbackData("reviews-feedback:order-1")).toBeNull();
    expect(
      parseCourierAvailabilityCallbackData(
        "delivery-assignment-courier-availability:set_auto_offer:courier-1:maybe",
      ),
    ).toBeNull();
  });

  it("delegates parsed courier availability intents to the existing service boundary", async () => {
    const availability: DeliveryAssignmentCourierAvailabilityRecord = {
      courierId: "courier-1",
      active: true,
      free: true,
      autoOfferEnabled: true,
      acceptingOrdersUntil: null,
      ratingScore: 5,
    };
    const service = {
      startCourierWork: jest.fn().mockResolvedValue(availability),
      stopCourierWorkAfter: jest.fn().mockResolvedValue(availability),
      setCourierAutoOfferParticipation: jest.fn().mockResolvedValue(availability),
    };

    await expect(
      executeCourierAvailabilityIntent(service, {
        type: "start_work",
        courierId: "courier-1",
      }),
    ).resolves.toBe(availability);
    await expect(
      executeCourierAvailabilityIntent(service, {
        type: "stop_after_5_minutes",
        courierId: "courier-1",
      }),
    ).resolves.toBe(availability);
    await expect(
      executeCourierAvailabilityIntent(service, {
        type: "set_auto_offer",
        courierId: "courier-1",
        enabled: false,
      }),
    ).resolves.toBe(availability);

    expect(service.startCourierWork).toHaveBeenCalledWith("courier-1");
    expect(service.stopCourierWorkAfter).toHaveBeenCalledWith("courier-1");
    expect(service.setCourierAutoOfferParticipation).toHaveBeenCalledWith(
      "courier-1",
      false,
    );
  });

  it("parses courier menu callbacks through the harness without webhook runtime wiring", () => {
    const harness = new TelegramBotCourierAvailabilityHarness({
      sendMessage: jest.fn(),
    });

    expect(
      harness.parseCourierAvailabilityAction(
        "delivery-assignment-courier-availability:stop_after_5_minutes:courier-1",
      ),
    ).toEqual({
      type: "stop_after_5_minutes",
      courierId: "courier-1",
    });
  });

  it("dispatches assignment notification only to the assigned courier target", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const notifier = new TelegramBotDeliveryAssignmentNotifier({
      sendMessage,
    });

    await expect(
      notifier.notifyCourierAssigned({
        orderId: "order-1",
        courierId: "courier-1",
        courierTelegramId: "10001",
        courierName: "Courier One",
        assignedByUserId: "admin-1",
        status: "ASSIGNED",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        revision: "3",
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: "10001",
      text: "Order order-1 has been assigned to you. Status: ASSIGNED. Courier: Courier One.",
      dedupeKey: "order.assigned:order-1:3",
    });
  });

  it("dispatches pending offer notification without assignment wording", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const notifier = new TelegramBotDeliveryAssignmentNotifier({
      sendMessage,
    });

    await expect(
      notifier.notifyCourierOfferCreated({
        orderId: "order-1",
        offerId: "offer-1",
        targetCourierId: "courier-1",
        courierTelegramId: "10001",
        courierName: "Courier One",
        createdByUserId: "operator-1",
        kind: "manual",
        orderStatus: "CREATED",
        updatedAt: new Date("2026-05-09T12:00:00.000Z"),
        revision: "4",
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: "10001",
      text: "Order order-1 is offered to you. Current status: CREATED. Courier: Courier One.",
      dedupeKey: "order.offer_created:offer-1:4",
    });
  });

  it("dispatches repeat offer notification with repeat dedupe key", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const notifier = new TelegramBotDeliveryAssignmentNotifier({
      sendMessage,
    });

    await expect(
      notifier.notifyCourierOfferRepeated({
        orderId: "order-1",
        offerId: "offer-1",
        targetCourierId: "courier-1",
        courierTelegramId: "10001",
        courierName: "Courier One",
        createdByUserId: "system",
        kind: "manual",
        orderStatus: "CREATED",
        updatedAt: new Date("2026-05-09T12:03:00.000Z"),
        revision: "5",
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: "10001",
      text: "Reminder: order order-1 is still waiting for your claim. Current status: CREATED. Courier: Courier One.",
      dedupeKey: "order.offer_repeated:offer-1:5",
    });
  });

  it("fans out delayed assignment notification to unique operator targets", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const notifier = new TelegramBotDeliveryAssignmentNotifier({
      sendMessage,
    });

    await expect(
      notifier.notifyOperatorsAssignmentDelayed({
        orderId: "order-1",
        operatorTelegramIds: ["90001", "90002", "90001", ""],
        expiredOfferCount: 2,
        updatedAt: new Date("2026-05-09T12:06:00.000Z"),
        revision: "6",
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenNthCalledWith(1, {
      chatId: "90001",
      text: "Order order-1 needs courier attention. Expired offers: 2. Status: DELAYED.",
      dedupeKey: "order.delayed:order-1:6:90001",
    });
    expect(sendMessage).toHaveBeenNthCalledWith(2, {
      chatId: "90002",
      text: "Order order-1 needs courier attention. Expired offers: 2. Status: DELAYED.",
      dedupeKey: "order.delayed:order-1:6:90002",
    });
  });

  it("keeps order and courier lookup behind the owning slice repository", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 0,
      name: "Courier One",
    });
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      findCourierById,
    });

    await expect(service.findOrderById("order-1")).resolves.toEqual({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    await expect(service.findCourierById("courier-1")).resolves.toEqual({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 0,
      name: "Courier One",
    });
    expect(findOrderById).toHaveBeenCalledWith("order-1");
    expect(findCourierById).toHaveBeenCalledWith("courier-1");
  });

  it("starts courier work and clears an existing stop-after cutoff without changing rating", async () => {
    const now = new Date("2026-05-09T12:00:00.000Z");
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: new Date("2026-05-09T12:03:00.000Z"),
      autoOfferEnabled: false,
      ratingScore: 7,
      name: "Courier One",
    });
    const startCourierWork = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 7,
      name: "Courier One",
    });
    const hasBusyCourierOrder = jest.fn().mockResolvedValue(false);
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findCourierById,
      startCourierWork,
      hasBusyCourierOrder,
    });

    await expect(service.startCourierWork("courier-1", now)).resolves.toEqual({
      courierId: "courier-1",
      active: true,
      free: true,
      autoOfferEnabled: false,
      acceptingOrdersUntil: null,
      ratingScore: 7,
    });
    expect(startCourierWork).toHaveBeenCalledWith("courier-1");
    expect(hasBusyCourierOrder).toHaveBeenCalledWith("courier-1");
  });

  it("keeps repeated start work idempotent when the courier is already active indefinitely", async () => {
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: true,
      ratingScore: 4,
      name: "Courier One",
    });
    const startCourierWork = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findCourierById,
      startCourierWork,
      hasBusyCourierOrder: jest.fn().mockResolvedValue(false),
    });

    await expect(
      service.startCourierWork("courier-1", new Date("2026-05-09T12:00:00.000Z")),
    ).resolves.toEqual({
      courierId: "courier-1",
      active: true,
      free: true,
      autoOfferEnabled: true,
      acceptingOrdersUntil: null,
      ratingScore: 4,
    });
    expect(startCourierWork).not.toHaveBeenCalled();
  });

  it("sets stop-after to five minutes and does not extend a repeated stop request", async () => {
    const now = new Date("2026-05-09T12:00:00.000Z");
    const cutoff = new Date("2026-05-09T12:05:00.000Z");
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 3,
      name: "Courier One",
    });
    const stopCourierWorkAfter = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: cutoff,
      autoOfferEnabled: false,
      ratingScore: 3,
      name: "Courier One",
    });
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findCourierById,
      stopCourierWorkAfter,
      hasBusyCourierOrder: jest.fn().mockResolvedValue(false),
    });

    await expect(service.stopCourierWorkAfter("courier-1", now)).resolves.toEqual({
      courierId: "courier-1",
      active: true,
      free: true,
      autoOfferEnabled: false,
      acceptingOrdersUntil: cutoff,
      ratingScore: 3,
    });
    expect(stopCourierWorkAfter).toHaveBeenCalledWith("courier-1", cutoff);

    findCourierById.mockResolvedValueOnce({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: cutoff,
      autoOfferEnabled: false,
      ratingScore: 3,
      name: "Courier One",
    });
    stopCourierWorkAfter.mockClear();

    await expect(
      service.stopCourierWorkAfter("courier-1", new Date("2026-05-09T12:01:00.000Z")),
    ).resolves.toEqual({
      courierId: "courier-1",
      active: true,
      free: true,
      autoOfferEnabled: false,
      acceptingOrdersUntil: cutoff,
      ratingScore: 3,
    });
    expect(stopCourierWorkAfter).not.toHaveBeenCalled();
  });

  it("treats courier as inactive after the stop-after cutoff passes", async () => {
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: new Date("2026-05-09T12:05:00.000Z"),
      autoOfferEnabled: false,
      ratingScore: 3,
      name: "Courier One",
    });
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findCourierById,
      hasBusyCourierOrder: jest.fn().mockResolvedValue(false),
    });

    await expect(
      service.getCourierAvailability("courier-1", new Date("2026-05-09T12:05:00.000Z")),
    ).resolves.toEqual({
      courierId: "courier-1",
      active: false,
      free: true,
      autoOfferEnabled: false,
      acceptingOrdersUntil: new Date("2026-05-09T12:05:00.000Z"),
      ratingScore: 3,
    });
  });

  it("toggles auto-offer participation idempotently without changing rating", async () => {
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 9,
      name: "Courier One",
    });
    const setCourierAutoOfferParticipation = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: true,
      ratingScore: 9,
      name: "Courier One",
    });
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findCourierById,
      setCourierAutoOfferParticipation,
      hasBusyCourierOrder: jest.fn().mockResolvedValue(false),
    });

    await expect(
      service.setCourierAutoOfferParticipation(
        "courier-1",
        true,
        new Date("2026-05-09T12:00:00.000Z"),
      ),
    ).resolves.toEqual({
      courierId: "courier-1",
      active: true,
      free: true,
      autoOfferEnabled: true,
      acceptingOrdersUntil: null,
      ratingScore: 9,
    });
    expect(setCourierAutoOfferParticipation).toHaveBeenCalledWith("courier-1", true);

    findCourierById.mockResolvedValueOnce({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: true,
      ratingScore: 9,
      name: "Courier One",
    });
    setCourierAutoOfferParticipation.mockClear();

    await expect(
      service.setCourierAutoOfferParticipation(
        "courier-1",
        true,
        new Date("2026-05-09T12:01:00.000Z"),
      ),
    ).resolves.toEqual({
      courierId: "courier-1",
      active: true,
      free: true,
      autoOfferEnabled: true,
      acceptingOrdersUntil: null,
      ratingScore: 9,
    });
    expect(setCourierAutoOfferParticipation).not.toHaveBeenCalled();
  });

  it("reports busy/free state from the server-owned repository calculation", async () => {
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: true,
      ratingScore: 5,
      name: "Courier One",
    });
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findCourierById,
      hasBusyCourierOrder: jest.fn().mockResolvedValue(true),
    });

    await expect(
      service.getCourierAvailability("courier-1", new Date("2026-05-09T12:00:00.000Z")),
    ).resolves.toEqual({
      courierId: "courier-1",
      active: true,
      free: false,
      autoOfferEnabled: true,
      acceptingOrdersUntil: null,
      ratingScore: 5,
    });
  });

  it("creates a pending manual targeted offer without assigning the order", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "DELAYED",
      updatedAt: new Date("2026-05-09T11:55:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 5,
      name: "Courier One",
    });
    const hasBusyCourierOrder = jest.fn().mockResolvedValue(false);
    const createManualOffer = jest.fn().mockResolvedValue({
      offer: {
        id: "offer-1",
        orderId: "order-1",
        targetCourierId: "courier-1",
        kind: "manual",
        status: "pending",
        createdAt: new Date("2026-05-09T12:00:00.000Z"),
        updatedAt: new Date("2026-05-09T12:00:00.000Z"),
      },
      event: {
        id: 4n,
        type: "order.offer_created",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          offerId: "offer-1",
          targetCourierId: "courier-1",
          createdByUserId: "operator-1",
          kind: "manual",
          status: "pending",
          orderStatus: "DELAYED",
          updatedAt: "2026-05-09T11:55:00.000Z",
        },
        createdAt: new Date("2026-05-09T12:00:00.000Z"),
      },
      order: {
        id: "order-1",
        courierId: null,
        status: "DELAYED",
        updatedAt: new Date("2026-05-09T11:55:00.000Z"),
        isDeleted: false,
      },
      revision: "4",
    });
    const assignCourier = jest.fn();
    const notifyCourierOfferCreated = jest.fn().mockResolvedValue(undefined);
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      findCourierById,
      hasBusyCourierOrder,
      createManualOffer,
      assignCourier,
    }, {
      notifyCourierAssigned: jest.fn(),
      notifyCourierOfferCreated,
    });

    await expect(
      service.createManualOffer(
        {
          orderId: "order-1",
          courierId: "courier-1",
          actor: {
            userId: "operator-1",
            role: "operator",
          },
        },
        new Date("2026-05-09T12:00:00.000Z"),
      ),
    ).resolves.toEqual({
      orderId: "order-1",
      offerId: "offer-1",
      targetCourierId: "courier-1",
      kind: "manual",
      status: "pending",
      orderStatus: "DELAYED",
      updatedAt: new Date("2026-05-09T11:55:00.000Z"),
      revision: "4",
    });

    expect(createManualOffer).toHaveBeenCalledWith({
      orderId: "order-1",
      courierId: "courier-1",
      actorUserId: "operator-1",
      orderStatus: "DELAYED",
      createdAt: new Date("2026-05-09T12:00:00.000Z"),
    });
    expect(assignCourier).not.toHaveBeenCalled();
    expect(notifyCourierOfferCreated).toHaveBeenCalledWith({
      orderId: "order-1",
      offerId: "offer-1",
      targetCourierId: "courier-1",
      courierTelegramId: "10001",
      courierName: "Courier One",
      createdByUserId: "operator-1",
      kind: "manual",
      orderStatus: "DELAYED",
      updatedAt: new Date("2026-05-09T11:55:00.000Z"),
      revision: "4",
    });
  });

  it("creates broadcast offers only for active free auto-offer couriers without assignment side effects", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-05-09T11:55:00.000Z"),
      isDeleted: false,
    });
    const findAutoOfferCandidateCouriers = jest.fn().mockResolvedValue([
      {
        id: "courier-free",
        telegramId: "10001",
        role: "courier",
        isActive: true,
        acceptingOrdersUntil: null,
        autoOfferEnabled: true,
        ratingScore: 5,
        name: "Courier Free",
      },
      {
        id: "courier-busy",
        telegramId: "10002",
        role: "courier",
        isActive: true,
        acceptingOrdersUntil: null,
        autoOfferEnabled: true,
        ratingScore: 4,
        name: "Courier Busy",
      },
      {
        id: "courier-cutoff",
        telegramId: "10003",
        role: "courier",
        isActive: true,
        acceptingOrdersUntil: new Date("2026-05-09T11:59:00.000Z"),
        autoOfferEnabled: true,
        ratingScore: 4,
        name: "Courier Cutoff",
      },
    ]);
    const hasBusyCourierOrder = jest
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const createBroadcastOffers = jest.fn().mockResolvedValue({
      offers: [
        {
          offer: {
            id: "offer-broadcast-1",
            orderId: "order-1",
            targetCourierId: "courier-free",
            kind: "broadcast",
            status: "pending",
            createdAt: new Date("2026-05-09T12:00:00.000Z"),
            updatedAt: new Date("2026-05-09T12:00:00.000Z"),
          },
          event: {
            id: 10n,
            type: "order.offer_created",
            entity: "order",
            entityId: "order-1",
            payload: {
              orderId: "order-1",
              offerId: "offer-broadcast-1",
              targetCourierId: "courier-free",
              createdByUserId: "operator-1",
              kind: "broadcast",
              status: "pending",
              orderStatus: "CREATED",
              updatedAt: "2026-05-09T11:55:00.000Z",
            },
            createdAt: new Date("2026-05-09T12:00:00.000Z"),
          },
        },
      ],
      order: {
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: new Date("2026-05-09T11:55:00.000Z"),
        isDeleted: false,
      },
      revision: "10",
    });
    const assignCourier = jest.fn();
    const notifyCourierOfferCreated = jest.fn().mockResolvedValue(undefined);
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      findAutoOfferCandidateCouriers,
      hasBusyCourierOrder,
      createBroadcastOffers,
      assignCourier,
    }, {
      notifyCourierAssigned: jest.fn(),
      notifyCourierOfferCreated,
    });

    await expect(
      service.createBroadcastOffers(
        {
          orderId: "order-1",
          actor: {
            userId: "operator-1",
            role: "operator",
          },
        },
        new Date("2026-05-09T12:00:00.000Z"),
      ),
    ).resolves.toEqual({
      orderId: "order-1",
      kind: "broadcast",
      status: "pending",
      orderStatus: "CREATED",
      eligibleCourierCount: 1,
      offers: [
        {
          orderId: "order-1",
          offerId: "offer-broadcast-1",
          targetCourierId: "courier-free",
          kind: "broadcast",
          status: "pending",
          orderStatus: "CREATED",
          updatedAt: new Date("2026-05-09T11:55:00.000Z"),
          revision: "10",
        },
      ],
      updatedAt: new Date("2026-05-09T11:55:00.000Z"),
      revision: "10",
    });

    expect(findAutoOfferCandidateCouriers).toHaveBeenCalledWith(new Date("2026-05-09T12:00:00.000Z"));
    expect(createBroadcastOffers).toHaveBeenCalledWith({
      orderId: "order-1",
      courierIds: ["courier-free"],
      actorUserId: "operator-1",
      orderStatus: "CREATED",
      createdAt: new Date("2026-05-09T12:00:00.000Z"),
    });
    expect(assignCourier).not.toHaveBeenCalled();
    expect(notifyCourierOfferCreated).toHaveBeenCalledWith({
      orderId: "order-1",
      offerId: "offer-broadcast-1",
      targetCourierId: "courier-free",
      courierTelegramId: "10001",
      courierName: "Courier Free",
      createdByUserId: "operator-1",
      kind: "broadcast",
      orderStatus: "CREATED",
      updatedAt: new Date("2026-05-09T11:55:00.000Z"),
      revision: "10",
    });
  });

  it("keeps auto-offer default off until an explicit broadcast trigger is called", async () => {
    const createBroadcastOffers = jest.fn();
    const notifyCourierOfferCreated = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      createBroadcastOffers,
    }, {
      notifyCourierAssigned: jest.fn(),
      notifyCourierOfferCreated,
    });

    await expect(
      service.getCourierAvailability("courier-1", new Date("2026-05-09T12:00:00.000Z")),
    ).rejects.toEqual(
      new AppError("COURIER_NOT_FOUND", "Courier was not found", 404, {
        courierId: "courier-1",
      }),
    );
    expect(createBroadcastOffers).not.toHaveBeenCalled();
    expect(notifyCourierOfferCreated).not.toHaveBeenCalled();
  });

  it("rejects manual offers for busy couriers without offer persistence", async () => {
    const createManualOffer = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById: jest.fn().mockResolvedValue({
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: new Date("2026-05-09T11:55:00.000Z"),
        isDeleted: false,
      }),
      findCourierById: jest.fn().mockResolvedValue({
        id: "courier-1",
        telegramId: "10001",
        role: "courier",
        isActive: true,
        acceptingOrdersUntil: null,
        autoOfferEnabled: false,
        ratingScore: 5,
        name: "Courier One",
      }),
      hasBusyCourierOrder: jest.fn().mockResolvedValue(true),
      createManualOffer,
    });

    await expect(
      service.createManualOffer({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
      }),
    ).rejects.toEqual(
      new AppError("COURIER_UNAVAILABLE", "Courier is not active and free for a manual offer", 409, {
        courierId: "courier-1",
        active: true,
        free: false,
      }),
    );
    expect(createManualOffer).not.toHaveBeenCalled();
  });

  it("rejects direct assignment override for staff-deactivated courier", async () => {
    const assignCourier = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById: jest.fn().mockResolvedValue({
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: new Date("2026-04-03T09:55:00.000Z"),
        isDeleted: false,
      }),
      findCourierById: jest.fn().mockResolvedValue({
        id: "courier-1",
        telegramId: "10001",
        role: "courier",
        isActive: true,
        acceptingOrdersUntil: null,
        autoOfferEnabled: true,
        ratingScore: 0,
        name: "Courier One",
        staffDeactivatedAt: new Date("2026-05-14T10:00:00.000Z"),
      }),
      assignCourier,
    });

    await expect(
      service.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "boss-1",
          role: "boss",
        },
        override: { confirmed: true },
      }),
    ).rejects.toEqual(
      new AppError("COURIER_INVALID", "Courier is not eligible for assignment", 400, {
        courierId: "courier-1",
      }),
    );
    expect(assignCourier).not.toHaveBeenCalled();
  });

  it("directly assigns a courier only as a confirmed operator override", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 0,
      name: "Courier One",
    });
    const assignCourier = jest.fn().mockResolvedValue({
      order: {
        id: "order-1",
        courierId: "courier-1",
        status: "ASSIGNED",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        isDeleted: false,
      },
      statusHistory: {
        id: 1n,
        orderId: "order-1",
        oldStatus: "CREATED",
        newStatus: "ASSIGNED",
        changedByUserId: "boss-1",
        changedAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      audit: {
        id: 2n,
        orderId: "order-1",
        adminUserId: "boss-1",
        courierUserId: "courier-1",
        action: "override_assigned",
        createdAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      event: {
        id: 3n,
        type: "order.assigned",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          courierId: "courier-1",
          assignedByUserId: "boss-1",
          status: "ASSIGNED",
          updatedAt: "2026-04-03T10:00:00.000Z",
        },
        createdAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      revision: "3",
    });
    const notifyCourierAssigned = jest.fn().mockResolvedValue(undefined);
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      findCourierById,
      assignCourier,
    }, {
      notifyCourierAssigned,
    });

    await expect(
      service.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "boss-1",
          role: "boss",
        },
        override: { confirmed: true },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      revision: "3",
    });
    expect(assignCourier).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        courierId: "courier-1",
        adminUserId: "boss-1",
        auditAction: "override_assigned",
      }),
    );
    expect(notifyCourierAssigned).toHaveBeenCalledWith({
      orderId: "order-1",
      courierId: "courier-1",
      courierTelegramId: "10001",
      courierName: "Courier One",
      assignedByUserId: "boss-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      revision: "3",
    });
  });

  it("keeps committed assignment override success even when notification transport fails", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 0,
      name: "Courier One",
    });
    const assignCourier = jest.fn().mockResolvedValue({
      order: {
        id: "order-1",
        courierId: "courier-1",
        status: "ASSIGNED",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        isDeleted: false,
      },
      statusHistory: {
        id: 1n,
        orderId: "order-1",
        oldStatus: "CREATED",
        newStatus: "ASSIGNED",
        changedByUserId: "admin-1",
        changedAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      audit: {
        id: 2n,
        orderId: "order-1",
        adminUserId: "admin-1",
        courierUserId: "courier-1",
        action: "override_assigned",
        createdAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      event: {
        id: 3n,
        type: "order.assigned",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          courierId: "courier-1",
          assignedByUserId: "admin-1",
          status: "ASSIGNED",
          updatedAt: "2026-04-03T10:00:00.000Z",
        },
        createdAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      revision: "3",
    });
    const notifier: DeliveryAssignmentNotifier = {
      notifyCourierAssigned: jest.fn().mockRejectedValue(new Error("telegram unavailable")),
    };
    const service = new DeliveryAssignmentService(
      {
        ...createRepository(),
        findOrderById,
        findCourierById,
        assignCourier,
      },
      notifier,
    );

    await expect(
      service.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        override: { confirmed: true },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      revision: "3",
    });

    expect(assignCourier).toHaveBeenCalledTimes(1);
    expect(notifier.notifyCourierAssigned).toHaveBeenCalledTimes(1);
  });

  it("rejects unauthenticated assignment override without side effects", async () => {
    const assignCourier = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      assignCourier,
    });

    await expect(
      service.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: null,
      }),
    ).rejects.toEqual(
      new AppError("AUTH_REQUIRED", "Direct assignment override requires an authenticated operator", 401),
    );
    expect(assignCourier).not.toHaveBeenCalled();
  });

  it("requires explicit assignment override confirmation before lookup and persistence", async () => {
    const findOrderById = jest.fn();
    const assignCourier = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      assignCourier,
    });

    await expect(
      service.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        override: null,
      }),
    ).rejects.toEqual(
      new AppError(
        "CONFIRMATION_REQUIRED",
        "Direct assignment override requires explicit operator confirmation",
        400,
      ),
    );
    expect(findOrderById).not.toHaveBeenCalled();
    expect(assignCourier).not.toHaveBeenCalled();
  });

  it("rejects non-operator override roles before persistence", async () => {
    const findOrderById = jest.fn();
    const assignCourier = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      assignCourier,
    });

    await expect(
      service.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "seller-1",
          role: "seller",
        },
      }),
    ).rejects.toEqual(
      new AppError("FORBIDDEN", "User role cannot directly assign couriers", 403, {
        role: "seller",
      }),
    );
    expect(findOrderById).not.toHaveBeenCalled();
    expect(assignCourier).not.toHaveBeenCalled();
  });

  it("rejects invalid order state without persistence side effects", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn();
    const assignCourier = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      findCourierById,
      assignCourier,
    });

    await expect(
      service.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        override: { confirmed: true },
      }),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Order cannot be assigned from the current state", 409, {
        orderId: "order-1",
        currentStatus: "ASSIGNED",
        expectedStatus: "CREATED",
      }),
    );
    expect(findCourierById).not.toHaveBeenCalled();
    expect(assignCourier).not.toHaveBeenCalled();
  });

  it("rejects invalid courier targets without persistence side effects", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: false,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 0,
      name: "Courier One",
    });
    const assignCourier = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      findCourierById,
      assignCourier,
    });

    await expect(
      service.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        override: { confirmed: true },
      }),
    ).rejects.toEqual(
      new AppError("COURIER_INVALID", "Courier is not eligible for assignment", 400, {
        courierId: "courier-1",
      }),
    );
    expect(assignCourier).not.toHaveBeenCalled();
  });
});
