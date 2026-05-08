import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AppRouter } from "../../app/router";
import type { LanguageController, LanguageState } from "../../shared/state/language";

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

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((message: unknown) => {
    if (typeof message === "string" && message.includes("react-test-renderer is deprecated")) {
      return;
    }

    process.stderr.write(String(message));
  });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

const createController = (state: LanguageState): LanguageController => ({
  getState: () => ({
    language: "ru",
    isHydrated: false,
    isOverlayVisible: true,
  }),
  hydrate: async () => state,
  selectLanguage: async () => ({
    language: "en",
    isHydrated: true,
    isOverlayVisible: false,
  }),
});

describe("localization boundary", () => {
  it("shows the mandatory language overlay when no explicit language is resolved", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AppRouter
          languageController={createController({
            language: "ru",
            isHydrated: true,
            isOverlayVisible: true,
          })}
        />,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Выберите язык");
    expect(text).toContain("Выберите язык, чтобы продолжить.");
    expect(text).toContain("Русский");
    expect(text).toContain("Тоҷикӣ");
    expect(text).not.toContain("Catalog");
  });

  it("renders the route content after language state is already satisfied", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AppRouter
          languageController={createController({
            language: "en",
            isHydrated: true,
            isOverlayVisible: false,
          })}
        />,
      );
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Сегодня популярны");
  });
});
