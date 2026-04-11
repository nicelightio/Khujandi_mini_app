import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";

type RuntimeServerOptions = {
  allowedOrigins?: string[];
  passwordHasher?: {
    verify: (secret: string, secretHash: string) => Promise<boolean>;
  };
  now?: () => Date;
};

export const startAdminAuthRuntimeServer = async (options: RuntimeServerOptions = {}) =>
  startDevApiServer({
    host: "127.0.0.1",
    port: 0,
    allowedOrigins: options.allowedOrigins ?? ["https://admin.example"],
    passwordHasher: options.passwordHasher,
    now: options.now,
  });
