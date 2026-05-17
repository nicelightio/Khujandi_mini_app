import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import type { TelegramBotSendMessageInput } from "../../../backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment.notifier";

const adminOrigin = "https://admin.example";

const createRuntime = async () => {
  const sentMessages: TelegramBotSendMessageInput[] = [];
  const runtime = await startDevApiServer({
    host: "127.0.0.1",
    port: 0,
    allowedOrigins: [adminOrigin],
    telegramMessageDispatcher: {
      sendMessage: async (message) => {
        sentMessages.push(message);
      },
    },
  });

  return {
    runtime,
    sentMessages,
    client: runtime.createClient(),
  };
};

const loginAdmin = async (runtime: Awaited<ReturnType<typeof startDevApiServer>>) => {
  runtime.prisma.state.account.login = "admin@example.com";
  runtime.prisma.state.account.role = "ADMIN";
  const client = runtime.createClient();
  const response = await client.request({
    path: "/api/v1/admin/auth/login",
    origin: adminOrigin,
    body: {
      login: "admin@example.com",
      password: "super-secret-01",
    },
  });

  expect(response.status).toBe(200);
  return client;
};

const postTelegramUpdate = (
  client: Awaited<ReturnType<typeof createRuntime>>["client"],
  body: Record<string, unknown>,
) =>
  client.request({
    path: "/api/v1/telegram/webhook",
    body,
  });

const lastMessage = (messages: TelegramBotSendMessageInput[]) => {
  const message = messages.at(-1);
  expect(message).toBeDefined();
  return message as TelegramBotSendMessageInput;
};

describe("staging Telegram bot runtime ingress", () => {
  it("rejects unsigned webhook ingress when a real Telegram token is configured", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      allowedOrigins: [adminOrigin],
      telegramBotToken: "1234567890:stagingTokenForWebhookSecretGate",
    });

    try {
      const response = await runtime.createClient().request({
        path: "/api/v1/telegram/webhook",
        body: {
          update_id: 1,
          message: {
            chat: { id: 70008 },
            from: { id: 70008 },
            text: "Курьер",
          },
        },
      });

      expect(response.status).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          error: expect.objectContaining({
            code: "FORBIDDEN",
          }),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("opens the courier menu and handles the auto-offer availability callback through the slice service", async () => {
    const { runtime, client, sentMessages } = await createRuntime();

    try {
      const menuResponse = await postTelegramUpdate(client, {
        update_id: 1,
        message: {
          chat: { id: 70008 },
          from: { id: 70008 },
          text: "Курьер",
        },
      });

      expect(menuResponse.status).toBe(200);
      expect(menuResponse.body).toEqual({
        ok: true,
        action: "courier_menu",
      });
      expect(lastMessage(sentMessages)).toEqual(
        expect.objectContaining({
          chatId: "70008",
          text: "Курьер",
          buttons: expect.arrayContaining([
            expect.objectContaining({ label: "Выйти на работу" }),
            expect.objectContaining({ label: "Завершить прием заказов через 5 минут" }),
            expect.objectContaining({ label: "Автоматически принимать заказы: OFF" }),
          ]),
        }),
      );

      const autoOfferButton = lastMessage(sentMessages).buttons?.find((button) =>
        button.label.startsWith("Автоматически принимать заказы"),
      );
      expect(autoOfferButton).toBeDefined();

      const toggleResponse = await postTelegramUpdate(client, {
        update_id: 2,
        callback_query: {
          id: "callback-auto-offer",
          from: { id: 70008 },
          message: { chat: { id: 70008 } },
          data: autoOfferButton?.callbackData,
        },
      });

      expect(toggleResponse.status).toBe(200);
      expect(toggleResponse.body).toEqual({
        ok: true,
        action: "courier_availability",
      });
      await expect(
        runtime.operationalModules.deliveryAssignmentModule.service.getCourierAvailability("courier-8"),
      ).resolves.toEqual(expect.objectContaining({ autoOfferEnabled: true }));
      expect(lastMessage(sentMessages).buttons).toContainEqual(
        expect.objectContaining({ label: "Автоматически принимать заказы: ON" }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("sends offer buttons, claims by Telegram actor lookup, and progresses courier statuses", async () => {
    const { runtime, sentMessages } = await createRuntime();

    try {
      const admin = await loginAdmin(runtime);
      const offerResponse = await admin.request({
        path: "/api/v1/admin/orders/order-created-1001/assignment-offers",
        origin: adminOrigin,
        body: {
          courierId: "courier-8",
        },
      });

      expect(offerResponse.status).toBe(201);
      const offerMessage = lastMessage(sentMessages);
      expect(offerMessage).toEqual(
        expect.objectContaining({
          chatId: "70008",
          dedupeKey: expect.stringMatching(/^order\.offer_created:/u),
          buttons: [
            expect.objectContaining({
              label: "Принять заказ",
              callbackData: expect.stringContaining("delivery-assignment-courier-claim:"),
            }),
          ],
        }),
      );

      const client = runtime.createClient();
      const claimResponse = await postTelegramUpdate(client, {
        update_id: 3,
        callback_query: {
          id: "callback-claim",
          from: { id: 70008 },
          message: { chat: { id: 70008 } },
          data: offerMessage.buttons?.[0]?.callbackData,
        },
      });

      expect(claimResponse.status).toBe(200);
      expect(claimResponse.body).toEqual({
        ok: true,
        action: "courier_claim",
      });
      await expect(
        runtime.operationalModules.deliveryAssignmentModule.controller.getOrderById("order-created-1001"),
      ).resolves.toEqual(expect.objectContaining({ courierId: "courier-8", status: "ASSIGNED" }));

      const assignedMessage = lastMessage(sentMessages);
      expect(assignedMessage.buttons).toContainEqual(
        expect.objectContaining({
          label: "Забрал заказ",
          callbackData: "delivery-tracking:order-created-1001:PICKED_UP",
        }),
      );

      const expectedTransitions = [
        ["PICKED_UP", "IN_PROGRESS"],
        ["IN_PROGRESS", "DELIVERED"],
        ["DELIVERED", null],
      ] as const;
      let callbackData = assignedMessage.buttons?.[0]?.callbackData;

      for (let index = 0; index < expectedTransitions.length; index += 1) {
        const [expectedStatus, nextStatus] = expectedTransitions[index];
        const response = await postTelegramUpdate(client, {
          update_id: 4 + index,
          callback_query: {
            id: `callback-status-${expectedStatus}`,
            from: { id: 70008 },
            message: { chat: { id: 70008 } },
            data: callbackData,
          },
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          ok: true,
          action: "courier_status",
        });
        await expect(
          runtime.operationalModules.deliveryTrackingModule.controller.getOrderById("order-created-1001"),
        ).resolves.toEqual(expect.objectContaining({ status: expectedStatus }));

        callbackData =
          nextStatus === null
            ? callbackData
            : lastMessage(sentMessages).buttons?.find((button) => button.callbackData.endsWith(`:${nextStatus}`))
                ?.callbackData;
      }

      const duplicateDeliveredResponse = await postTelegramUpdate(client, {
        update_id: 7,
        callback_query: {
          id: "callback-status-duplicate",
          from: { id: 70008 },
          message: { chat: { id: 70008 } },
          data: callbackData,
        },
      });

      expect(duplicateDeliveredResponse.status).toBe(200);
      expect(duplicateDeliveredResponse.body).toEqual(
        expect.objectContaining({
          ok: false,
          action: "error",
          code: "CONFLICT",
        }),
      );
    } finally {
      await runtime.stop();
    }
  });
});
