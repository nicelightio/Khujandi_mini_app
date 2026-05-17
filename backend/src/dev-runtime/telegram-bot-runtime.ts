import { AppError } from "../shared/errors/app-error";
import {
  buildCourierAvailabilityCallbackData,
  parseCourierAvailabilityCallbackData,
} from "../integrations/telegram-bot/telegram-bot-courier-availability.harness";
import { parseCourierClaimCallbackData } from "../integrations/telegram-bot/telegram-bot-delivery-assignment-claim.harness";
import { parseDeliveryTrackingCallbackData } from "../integrations/telegram-bot/telegram-bot-delivery-tracking.harness";
import type { DeliveryAssignmentModule } from "../slices/delivery-assignment/presentation/delivery-assignment.module";
import type { DeliveryTrackingModule } from "../slices/delivery-tracking/presentation/delivery-tracking.module";
import type { DeliveryAssignmentCourierAvailabilityRecord } from "../slices/delivery-assignment/domain/delivery-assignment.types";
import type { TelegramBotMessageDispatcher } from "../integrations/telegram-bot/telegram-bot-delivery-assignment.notifier";
import type { TelegramBotApiClient, TelegramBotApiUpdate } from "./telegram-bot-api";
import type { TelegramBotReviewsFeedbackFlow } from "../integrations/telegram-bot/telegram-bot-reviews-feedback.flow";
import { parseReviewStepperCallbackData } from "../integrations/telegram-bot/telegram-bot-reviews-feedback.harness";
import type {
  ReviewsFeedbackActor,
  ReviewsFeedbackDirection,
} from "../slices/reviews-feedback/domain/reviews-feedback.types";

export type TelegramBotRuntimeResult = {
  ok: boolean;
  action: string;
  message?: string;
  code?: string;
};

export type TelegramBotRuntime = {
  handleUpdate(update: TelegramBotApiUpdate): Promise<TelegramBotRuntimeResult>;
};

const COURIER_MENU_TEXTS = new Set(["/start", "Курьер", "курьер"]);

const toTelegramId = (value: number | string | undefined): string | null => {
  if (value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length === 0 ? null : normalized;
};

const isCourierStaffActive = (
  courier: Awaited<ReturnType<DeliveryAssignmentModule["controller"]["getCourierStaffByTelegramUserId"]>>,
): courier is NonNullable<typeof courier> =>
  courier !== null && courier.role === "courier" && courier.lifecycle.staffDeactivatedAt === null;

const buildAvailabilityButtons = (availability: DeliveryAssignmentCourierAvailabilityRecord) => [
  {
    label: "Выйти на работу",
    callbackData: buildCourierAvailabilityCallbackData({
      type: "start_work",
      courierId: availability.courierId,
    }),
  },
  {
    label: "Завершить прием заказов через 5 минут",
    callbackData: buildCourierAvailabilityCallbackData({
      type: "stop_after_5_minutes",
      courierId: availability.courierId,
    }),
  },
  {
    label: `Автоматически принимать заказы: ${availability.autoOfferEnabled ? "ON" : "OFF"}`,
    callbackData: buildCourierAvailabilityCallbackData({
      type: "set_auto_offer",
      courierId: availability.courierId,
      enabled: !availability.autoOfferEnabled,
    }),
  },
];

const callbackErrorText = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  return "Действие временно недоступно";
};

export const createTelegramBotRuntime = (input: {
  deliveryAssignmentModule: DeliveryAssignmentModule;
  deliveryTrackingModule: DeliveryTrackingModule;
  dispatcher: TelegramBotMessageDispatcher;
  callbackResponder?: Pick<TelegramBotApiClient, "answerCallbackQuery">;
  reviewsFeedbackFlow?: TelegramBotReviewsFeedbackFlow;
  resolveReviewActorByTelegramId?: (telegramId: string) => ReviewsFeedbackActor | null;
  findActiveReviewCommentDraft?: (
    actor: ReviewsFeedbackActor,
  ) => { orderId: string; direction: ReviewsFeedbackDirection } | null;
}): TelegramBotRuntime => {
  const resolveCourierByTelegramId = async (telegramId: string) => {
    const courier = await input.deliveryAssignmentModule.controller.getCourierStaffByTelegramUserId(telegramId);

    if (!isCourierStaffActive(courier)) {
      throw new AppError("COURIER_NOT_FOUND", "Telegram user is not an active courier", 403);
    }

    return courier;
  };

  const sendCourierMenu = async (chatId: string, courierId: string) => {
    const availability = await input.deliveryAssignmentModule.service.getCourierAvailability(courierId);
    await input.dispatcher.sendMessage({
      chatId,
      text: "Курьер",
      dedupeKey: `courier.availability.menu:${courierId}:${Date.now()}`,
      buttons: buildAvailabilityButtons(availability),
    });
  };

  const answerCallback = async (callbackQueryId: string | undefined, text?: string) => {
    if (callbackQueryId === undefined || input.callbackResponder === undefined) {
      return;
    }

    try {
      await input.callbackResponder.answerCallbackQuery({
        callbackQueryId,
        text,
      });
    } catch {
      // Callback acknowledgement is transport-only and must not affect committed domain writes.
    }
  };

  return {
    async handleUpdate(update) {
      const messageText = update.message?.text?.trim();

      if (messageText !== undefined && !COURIER_MENU_TEXTS.has(messageText) && input.reviewsFeedbackFlow !== undefined) {
        const telegramId = toTelegramId(update.message?.from?.id);

        if (telegramId !== null) {
          const actor = input.resolveReviewActorByTelegramId?.(telegramId) ?? null;
          const draft = actor === null ? null : input.findActiveReviewCommentDraft?.(actor) ?? null;

          if (actor !== null && draft !== null) {
            const result = await input.reviewsFeedbackFlow.handleComment({
              actor,
              orderId: draft.orderId,
              direction: draft.direction,
              comment: messageText,
            });

            return {
              ok: true,
              action: result.type === "submitted" ? "review_submitted" : "review_ignored",
            };
          }
        }
      }

      if (messageText !== undefined && COURIER_MENU_TEXTS.has(messageText)) {
        const telegramId = toTelegramId(update.message?.from?.id);
        const chatId = toTelegramId(update.message?.chat?.id);

        if (telegramId === null || chatId === null) {
          throw new AppError("TELEGRAM_ACTOR_MISSING", "Telegram courier message lacks actor or chat id", 400);
        }

        const courier = await resolveCourierByTelegramId(telegramId);
        await sendCourierMenu(chatId, courier.id);
        return {
          ok: true,
          action: "courier_menu",
        };
      }

      const callbackData = update.callback_query?.data;

      if (callbackData === undefined) {
        return {
          ok: true,
          action: "ignored",
        };
      }

      const callbackQueryId = update.callback_query?.id;
      const telegramId = toTelegramId(update.callback_query?.from?.id);
      const chatId = toTelegramId(update.callback_query?.message?.chat?.id) ?? telegramId;

      if (telegramId === null || chatId === null) {
        throw new AppError("TELEGRAM_ACTOR_MISSING", "Telegram callback lacks actor or chat id", 400);
      }

      const reviewIntent = parseReviewStepperCallbackData(callbackData);

      if (reviewIntent !== null && input.reviewsFeedbackFlow !== undefined) {
        const actor = input.resolveReviewActorByTelegramId?.(telegramId) ?? null;

        if (actor === null) {
          throw new AppError("FORBIDDEN", "Telegram user is not an active review actor", 403);
        }

        const result = await input.reviewsFeedbackFlow.handleCallback({
          actor,
          callbackData,
        });
        await answerCallback(
          callbackQueryId,
          result.type === "submitted" ? "Отзыв сохранен" : result.type === "prompt" ? "Готово" : "Отзыв не изменен",
        );
        return {
          ok: true,
          action: result.type === "submitted" ? "review_submitted" : result.type === "prompt" ? "review_prompt" : "review_ignored",
        };
      }

      try {
        const courier = await resolveCourierByTelegramId(telegramId);
        const availabilityIntent = parseCourierAvailabilityCallbackData(callbackData);

        if (availabilityIntent !== null) {
          if (availabilityIntent.courierId !== courier.id) {
            throw new AppError("FORBIDDEN", "Courier callback actor mismatch", 403);
          }

          if (availabilityIntent.type === "start_work") {
            await input.deliveryAssignmentModule.service.startCourierWork(courier.id);
          } else if (availabilityIntent.type === "stop_after_5_minutes") {
            await input.deliveryAssignmentModule.service.stopCourierWorkAfter(courier.id);
          } else {
            await input.deliveryAssignmentModule.service.setCourierAutoOfferParticipation(
              courier.id,
              availabilityIntent.enabled,
            );
          }

          await answerCallback(callbackQueryId, "Готово");
          await sendCourierMenu(chatId, courier.id);
          return {
            ok: true,
            action: "courier_availability",
          };
        }

        const claimIntent = parseCourierClaimCallbackData(callbackData);

        if (claimIntent !== null) {
          if (claimIntent.courierId !== courier.id) {
            throw new AppError("FORBIDDEN", "Courier claim actor mismatch", 403);
          }

          await answerCallback(callbackQueryId, "пытаемся получить заказ...");
          await input.deliveryAssignmentModule.controller.claimOffer({
            offerId: claimIntent.offerId,
            courierId: courier.id,
          });
          return {
            ok: true,
            action: "courier_claim",
          };
        }

        const trackingIntent = parseDeliveryTrackingCallbackData(callbackData);

        if (trackingIntent !== null) {
          await input.deliveryTrackingModule.controller.recordStatusTransition({
            orderId: trackingIntent.orderId,
            nextStatus: trackingIntent.nextStatus,
            actor: {
              userId: courier.id,
              role: "courier",
              name: courier.nickname ?? courier.fallbackDisplayName,
            },
          });
          await answerCallback(callbackQueryId, "Статус обновлен");
          return {
            ok: true,
            action: "courier_status",
          };
        }

        await answerCallback(callbackQueryId, "Неизвестное действие");
        return {
          ok: true,
          action: "ignored",
        };
      } catch (error) {
        await answerCallback(callbackQueryId, callbackErrorText(error));

        if (error instanceof AppError) {
          return {
            ok: false,
            action: "error",
            code: error.code,
            message: error.message,
          };
        }

        throw error;
      }
    },
  };
};

export const startTelegramBotPolling = (input: {
  apiClient: TelegramBotApiClient;
  runtime: TelegramBotRuntime;
  intervalMs?: number;
}) => {
  let stopped = false;
  let running = false;
  let offset: number | undefined;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const intervalMs = input.intervalMs ?? 2000;

  const schedule = () => {
    if (stopped) {
      return;
    }

    timer = setTimeout(() => {
      void tick();
    }, intervalMs);
  };

  const tick = async () => {
    if (running || stopped) {
      schedule();
      return;
    }

    running = true;

    try {
      const updates = await input.apiClient.getUpdates({
        offset,
        timeoutSeconds: 0,
        limit: 20,
      });

      for (const update of updates) {
        offset = update.update_id + 1;

        try {
          await input.runtime.handleUpdate(update);
        } catch {
          // A single noisy update must not stop the staging polling loop.
        }
      }
    } catch {
      // Telegram transport errors are retried by the next poll.
    } finally {
      running = false;
      schedule();
    }
  };

  void tick();

  return {
    stop: () => {
      stopped = true;

      if (timer !== null) {
        clearTimeout(timer);
      }
    },
  };
};
