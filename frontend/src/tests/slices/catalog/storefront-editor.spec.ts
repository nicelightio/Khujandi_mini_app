import { createStorefrontEditor, type CatalogStorefrontData } from "../../../slices/catalog/model/storefront";

describe("storefront editor", () => {
  it("exposes both shop hero and background image fields in owner edit mode", () => {
    const data: CatalogStorefrontData = {
      shop: {
        id: "shop-1",
        publicPath: "khujand-bakery",
        name: "Khujand Bakery",
        description: null,
        headerImageUrl: "https://example.com/header.png",
        backgroundImageUrl: "https://example.com/background.png",
        renameReviewNote: null,
      },
      canEdit: true,
      currentTelegramId: null,
      authDebugLabel: null,
      accessStatusLabel: "Seller edit mode is active on the shared storefront tree.",
      activationHint: "Click or long press the existing shop, menu, or product blocks to edit them.",
      menuPages: [],
      unpagedProducts: [],
      debugLogs: [],
    };

    expect(createStorefrontEditor(data, { type: "shop" })?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "headerImageUrl",
          label: "Shop header image",
          value: "https://example.com/header.png",
          inputMode: "image",
        }),
        expect.objectContaining({
          name: "backgroundImageUrl",
          label: "Shop background image",
          value: "https://example.com/background.png",
          inputMode: "image",
        }),
      ]),
    );
  });
});
