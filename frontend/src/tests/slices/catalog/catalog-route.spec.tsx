import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { CatalogApi } from "../../../slices/catalog/api/catalog-api";
import { CatalogRoute } from "../../../slices/catalog/routes/catalog-route";

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

describe("catalog route", () => {
  it("shows loading first and then renders public shops/products from the route", async () => {
    let resolveCatalog: ((value: Awaited<ReturnType<CatalogApi["listCatalog"]>>) => void) | undefined;
    const api: CatalogApi = {
      listCatalog: () =>
        new Promise((resolve) => {
          resolveCatalog = resolve;
        }),
    };

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(createElement(CatalogRoute, { api }));
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Loading catalog...");

    await act(async () => {
      resolveCatalog?.([
        {
          id: "shop-1",
          name: "Khujand Bakery",
          products: [
            {
              id: "product-1",
              shopId: "shop-1",
              name: "Somsa",
              priceMinor: 1500,
            },
          ],
        },
      ]);
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Khujand Bakery");
    expect(text).toContain("Somsa");
    expect(text).toContain("15.00 TJS");
  });

  it("renders a controlled error state when the public browse request fails", async () => {
    const api: CatalogApi = {
      listCatalog: async () => {
        throw new Error("Catalog request failed with status 503.");
      },
    };

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(createElement(CatalogRoute, { api }));
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("We could not load the catalog right now.");
    expect(text).toContain("Catalog request failed with status 503.");
  });
});
