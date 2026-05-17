import type {
  TelegramBotMessageDispatcher,
  TelegramBotSendMessageInput,
} from "../integrations/telegram-bot/telegram-bot-delivery-assignment.notifier";

type TelegramBotApiRequestResult = {
  ok: boolean;
  description?: string;
  result?: unknown;
};

export type TelegramBotApiUpdate = {
  update_id: number;
  message?: {
    message_id?: number;
    chat?: {
      id?: number | string;
    };
    from?: {
      id?: number | string;
      first_name?: string;
      username?: string;
    };
    text?: string;
  };
  callback_query?: {
    id?: string;
    from?: {
      id?: number | string;
      first_name?: string;
      username?: string;
    };
    message?: {
      chat?: {
        id?: number | string;
      };
    };
    data?: string;
  };
};

export type TelegramBotApiClient = TelegramBotMessageDispatcher & {
  isEnabled: boolean;
  answerCallbackQuery(input: { callbackQueryId: string; text?: string }): Promise<void>;
  getUpdates(input: { offset?: number; timeoutSeconds?: number; limit?: number }): Promise<TelegramBotApiUpdate[]>;
};

const REAL_BOT_TOKEN_PATTERN = /^\d+:[A-Za-z0-9_-]+$/u;

export const isRealTelegramBotToken = (token: string | undefined): token is string =>
  token !== undefined && REAL_BOT_TOKEN_PATTERN.test(token.trim());

export const createNoopTelegramBotApiClient = (): TelegramBotApiClient => ({
  isEnabled: false,
  async sendMessage() {
    return undefined;
  },
  async answerCallbackQuery() {
    return undefined;
  },
  async getUpdates() {
    return [];
  },
});

export const createTelegramBotApiClient = (input: {
  token?: string;
  fetchImpl?: typeof fetch;
}): TelegramBotApiClient => {
  const token = input.token?.trim();
  const fetchImpl = input.fetchImpl ?? fetch;

  if (!isRealTelegramBotToken(token)) {
    return createNoopTelegramBotApiClient();
  }

  const endpoint = (method: string) => `https://api.telegram.org/bot${token}/${method}`;
  const sentDedupeKeys = new Set<string>();

  const post = async (method: string, body: Record<string, unknown>): Promise<TelegramBotApiRequestResult> => {
    const response = await fetchImpl(endpoint(method), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const parsed = (await response.json().catch(() => ({
      ok: false,
      description: `Telegram API returned HTTP ${response.status}`,
    }))) as TelegramBotApiRequestResult;

    if (!response.ok || parsed.ok !== true) {
      throw new Error(parsed.description ?? `Telegram API ${method} failed`);
    }

    return parsed;
  };

  return {
    isEnabled: true,
    async sendMessage(message: TelegramBotSendMessageInput) {
      if (sentDedupeKeys.has(message.dedupeKey)) {
        return;
      }

      const replyMarkup =
        message.buttons === undefined || message.buttons.length === 0
          ? undefined
          : {
              inline_keyboard: message.buttons.map((button) => [
                {
                  text: button.label,
                  callback_data: button.callbackData,
                },
              ]),
            };

      await post("sendMessage", {
        chat_id: message.chatId,
        text: message.text,
        ...(replyMarkup === undefined ? {} : { reply_markup: replyMarkup }),
      });
      sentDedupeKeys.add(message.dedupeKey);
    },
    async answerCallbackQuery(input) {
      await post("answerCallbackQuery", {
        callback_query_id: input.callbackQueryId,
        ...(input.text === undefined ? {} : { text: input.text }),
      });
    },
    async getUpdates(input) {
      const result = await post("getUpdates", {
        ...(input.offset === undefined ? {} : { offset: input.offset }),
        timeout: input.timeoutSeconds ?? 0,
        limit: input.limit ?? 20,
        allowed_updates: ["message", "callback_query"],
      });

      return Array.isArray(result.result) ? (result.result as TelegramBotApiUpdate[]) : [];
    },
  };
};
