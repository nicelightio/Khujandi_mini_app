import { createCatalogViewModel } from "../../../slices/catalog/model/catalog-view-model";

describe("catalog page scaffold", () => {
  it("creates a presentational view model without backend wiring", () => {
    expect(createCatalogViewModel().headline).toContain("catalog");
  });
});
