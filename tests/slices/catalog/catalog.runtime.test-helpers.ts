import { createHmac } from "crypto";
import type { RuntimeCookieSessionClient } from "../../../backend/src/dev-runtime/dev-api-server";

export const adminOrigin = "http://127.0.0.1:5173";

export const createTelegramInitData = (input: {
  authDate: number;
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}): string => {
  const params = new URLSearchParams();
  params.set("auth_date", String(input.authDate));
  params.set("query_id", "AAEAAAE");
  params.set(
    "user",
    JSON.stringify({
      id: Number(input.telegramId),
      first_name: input.firstName ?? "Khujand",
      last_name: input.lastName ?? "Seller",
      username: input.username ?? `seller_${input.telegramId}`,
      language_code: input.languageCode ?? "ru",
    }),
  );

  const dataCheckString = Array.from(params.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update("test-bot-token").digest();
  params.set("hash", createHmac("sha256", secretKey).update(dataCheckString).digest("hex"));

  return params.toString();
};

export const loginAdmin = async (client: RuntimeCookieSessionClient) => {
  const response = await client.request({
    path: "/api/v1/admin/auth/login",
    origin: adminOrigin,
    body: {
      login: "boss@example.com",
      password: "super-secret-01",
    },
  });

  expect(response.status).toBe(200);
  expect(client.readCookieValue("khujandi_admin_refresh_token")).not.toBeNull();
};

export const loginSeller = async (client: RuntimeCookieSessionClient, telegramId: string) => {
  const response = await client.request({
    path: "/api/v1/auth/telegram",
    origin: adminOrigin,
    body: {
      initData: createTelegramInitData({
        authDate: Math.floor(Date.now() / 1000),
        telegramId,
      }),
    },
  });

  expect(response.status).toBe(200);
  expect(client.readCookieValue("khujandi_mini_app_session")).not.toBeNull();
};
