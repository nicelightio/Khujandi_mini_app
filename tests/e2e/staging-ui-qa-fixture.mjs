#!/usr/bin/env node
/* global console, fetch, process, URL, window */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const command = process.argv[2] ?? "api-smoke";

const baseUrlInput = process.env.UI_QA_BASE_URL;
const testToken = process.env.E2E_TEST_TOKEN;
const scenario = process.env.UI_QA_SCENARIO ?? "checkout_happy";
const persona = process.env.UI_QA_PERSONA ?? "client_alina";
const evidenceDir = process.env.UI_QA_EVIDENCE_DIR ?? ".tasks/TASK-FT018-05";
const compositionStorageKey = "khujandi.customer_order_composition";

const trustBoundaryNotice =
  "Staging UI QA with fixed-persona sessions does not prove Telegram HMAC/replay/WebView correctness or real payment provider trust.";

const fail = (message, code = 1) => {
  console.error(message);
  process.exit(code);
};

if (baseUrlInput === undefined || baseUrlInput.trim().length === 0) {
  fail("UI_QA_BASE_URL is required.");
}

if (testToken === undefined || testToken.trim().length === 0) {
  fail("E2E_TEST_TOKEN is required and must come from env/secret storage.");
}

const baseUrl = new URL(baseUrlInput);
const requestUrl = (pathname) => new URL(pathname, baseUrl).toString();

const safeJson = async (response) => {
  const text = await response.text();

  if (text.trim().length === 0) {
    return {};
  }

  return JSON.parse(text);
};

const postJson = async (pathname, body) => {
  const response = await fetch(requestUrl(pathname), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-e2e-test-token": testToken,
    },
    body: JSON.stringify(body),
    redirect: "manual",
  });
  const payload = await safeJson(response);

  if (!response.ok) {
    throw new Error(`${pathname} failed with HTTP ${response.status}.`);
  }

  return { response, payload };
};

const getJson = async (pathname, withToken = false) => {
  const response = await fetch(requestUrl(pathname), {
    headers: withToken ? { "x-e2e-test-token": testToken } : {},
    redirect: "manual",
  });
  const payload = await safeJson(response);

  if (!response.ok) {
    throw new Error(`${pathname} failed with HTTP ${response.status}.`);
  }

  return { response, payload };
};

const splitSetCookie = (header) => {
  if (header === null || header.trim().length === 0) {
    return [];
  }

  return header.split(/,(?=\s*[^;,=\s]+=[^;,]*)/).map((value) => value.trim());
};

const readSetCookieHeaders = (response) => {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  return splitSetCookie(response.headers.get("set-cookie"));
};

const parseCookieForBrowser = (setCookieHeader) => {
  const parts = setCookieHeader.split(";").map((part) => part.trim());
  const [nameValue, ...attributes] = parts;
  const separatorIndex = nameValue.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  const cookie = {
    name: nameValue.slice(0, separatorIndex),
    value: nameValue.slice(separatorIndex + 1),
    domain: baseUrl.hostname,
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  };

  for (const attribute of attributes) {
    const [rawName, rawValue = ""] = attribute.split("=");
    const attrName = rawName.toLowerCase();

    if (attrName === "path" && rawValue.length > 0) {
      cookie.path = rawValue;
    } else if (attrName === "httponly") {
      cookie.httpOnly = true;
    } else if (attrName === "secure") {
      cookie.secure = true;
    } else if (attrName === "samesite") {
      const normalized = rawValue.toLowerCase();
      cookie.sameSite =
        normalized === "strict" ? "Strict" : normalized === "none" ? "None" : "Lax";
    }
  }

  return cookie;
};

const containsForbiddenSessionMaterial = (value) => {
  const serialized = JSON.stringify(value).toLowerCase();
  const cookieAssignmentMarkers = [
    "khujandi_mini_app_session",
    "khujandi_admin_access_token",
    "khujandi_admin_refresh_token",
  ].map((name) => `${name}=`);

  return [
    testToken.toLowerCase(),
    "set-cookie",
    ...cookieAssignmentMarkers,
    "sessiontoken",
    "session_token",
    "raw initdata",
    "database_url",
  ].some((needle) => serialized.includes(needle));
};

const assertSafeSessionPayload = (payload) => {
  if (containsForbiddenSessionMaterial(payload)) {
    throw new Error("Session payload contains forbidden secret/session material.");
  }
};

const summarizeCookies = (cookies) =>
  cookies.map((cookie) => ({
    name: cookie.name,
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
  }));

const buildCheckoutHappyComposition = () => ({
  composition_id: `ui-qa-${Date.now()}`,
  shop_public_path: "seller-runtime-11",
  shop_id: "shop-1",
  items: [
    {
      product_id: "product-1",
      quantity: 1,
      display_snapshot: {
        product_name: "Плов зарвода",
        unit_price_minor: 4500,
        currency: "TJS",
      },
    },
  ],
  preview_total: {
    amount_minor: 4500,
    currency: "TJS",
  },
  created_at: new Date().toISOString(),
});

const writeEvidence = async (evidence) => {
  await mkdir(evidenceDir, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const filename = path.join(evidenceDir, `ui-qa-fixture-${stamp}.json`);
  await writeFile(filename, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

  return filename;
};

const runApiWorkflow = async () => {
  const health = await getJson("/api/v1/health");

  if (health.payload.ok !== true) {
    throw new Error("Health endpoint did not return ok=true.");
  }

  if (health.payload.e2eTestMode !== true) {
    throw new Error("Health endpoint does not report e2eTestMode=true.");
  }

  if (health.payload.paymentProvider !== "mock") {
    throw new Error("Health endpoint does not report paymentProvider=mock.");
  }

  await postJson("/api/v1/test/reset", { scope: "all" });
  const seed = await postJson("/api/v1/test/seed", { scenario });
  const personas = await getJson("/api/v1/test/personas", true);
  const session = await postJson("/api/v1/test/session", { persona });

  assertSafeSessionPayload(session.payload);

  const cookies = readSetCookieHeaders(session.response)
    .map(parseCookieForBrowser)
    .filter((cookie) => cookie !== null);

  if (session.payload?.session?.transport === "httpOnlyCookie" && cookies.length === 0) {
    throw new Error("Fixed-persona session did not set an HttpOnly cookie.");
  }

  return {
    health: {
      ok: health.payload.ok,
      appEnv: health.payload.appEnv,
      nodeEnv: health.payload.nodeEnv,
      debug: health.payload.debug,
      paymentProvider: health.payload.paymentProvider,
      e2eTestMode: health.payload.e2eTestMode,
      version: health.payload.version,
    },
    reset: { ok: true },
    seed: {
      scenario,
      summaryKeys: Object.keys(seed.payload).sort(),
    },
    personas: {
      keys: Array.isArray(personas.payload.personas)
        ? personas.payload.personas.map((candidate) => candidate.key)
        : [],
    },
    session: {
      persona: session.payload.persona,
      contour: session.payload.contour,
      role: session.payload.role,
      transport: session.payload?.session?.transport,
      expiresAt: session.payload?.session?.expiresAt,
      cookieSummary: summarizeCookies(cookies),
    },
    browserCookies: cookies,
  };
};

const runBrowserSmoke = async (cookies) => {
  let playwright;

  try {
    playwright = await import("playwright");
  } catch {
    return {
      status: "BLOCKED",
      reason: "Playwright package is not installed in this repo/runtime.",
      missingPrerequisite: "Install/provide Playwright browser runtime before running browser smoke.",
    };
  }

  const browser = await playwright.chromium.launch();

  try {
    const context = await browser.newContext({ baseURL: baseUrl.toString() });
    if (cookies.length > 0) {
      await context.addCookies(cookies);
    }

    const page = await context.newPage();
    await page.addInitScript(
      ({ storageKey, composition }) => {
        window.localStorage.setItem("khujandi.language", "ru");
        window.sessionStorage.setItem(storageKey, JSON.stringify(composition));
      },
      {
        storageKey: compositionStorageKey,
        composition: buildCheckoutHappyComposition(),
      },
    );
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /оплат|payment|пардохт/i }).click();
    await page
      .getByText(/checkout completed|заказ создан|оформление заказа завершено|пардохт анҷом/i)
      .first()
      .waitFor({ timeout: 10_000 });
    const title = await page.title();
    const bodyText = await page.locator("body").innerText({ timeout: 5000 });

    return {
      status: "PASS",
      openedPath: "/checkout",
      title,
      bodyTextSample: bodyText.slice(0, 240),
    };
  } finally {
    await browser.close();
  }
};

const main = async () => {
  const apiWorkflow = await runApiWorkflow();
  const browserSmoke =
    command === "browser-smoke"
      ? await runBrowserSmoke(apiWorkflow.browserCookies)
      : { status: "NOT_RUN", reason: "Command was api-smoke; browser smoke not requested." };

  const evidence = {
    task: "TASK-FT018-05",
    command,
    baseUrl: baseUrl.toString(),
    scenario,
    persona,
    apiWorkflow: {
      ...apiWorkflow,
      browserCookies: undefined,
    },
    browserSmoke,
    trustBoundaryNotice,
  };
  const evidencePath = await writeEvidence(evidence);

  console.log(
    JSON.stringify(
      {
        result: browserSmoke.status === "BLOCKED" ? "BLOCKED" : "PASS",
        evidencePath,
        scenario,
        persona,
        browserSmoke: browserSmoke.status,
        trustBoundaryNotice,
      },
      null,
      2,
    ),
  );

  if (browserSmoke.status === "BLOCKED") {
    process.exit(2);
  }
};

if (!["api-smoke", "browser-smoke"].includes(command)) {
  fail("Usage: node tests/e2e/staging-ui-qa-fixture.mjs [api-smoke|browser-smoke]");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
