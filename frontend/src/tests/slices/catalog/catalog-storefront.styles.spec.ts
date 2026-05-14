import { readFileSync } from "node:fs";
import { join } from "node:path";

const stylesheet = readFileSync(
  join(process.cwd(), "frontend/src/slices/catalog/styles/catalog-storefront.css"),
  "utf8",
);

describe("catalog storefront stylesheet", () => {
  it("keeps the customer cart summary visible in browse mode", () => {
    expect(stylesheet).toContain('[data-storefront-cart="summary"] {\n  display: flex;');
    expect(stylesheet).not.toContain(
      '[data-catalog-storefront="shop"][data-can-edit="false"] [data-storefront-cart="summary"]',
    );
  });
});
