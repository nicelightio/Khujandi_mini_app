import { CatalogRoute } from "../../../slices/catalog/routes/catalog-route";

describe("catalog route scaffold", () => {
  it("exports a route shell component", () => {
    expect(typeof CatalogRoute).toBe("function");
  });
});
