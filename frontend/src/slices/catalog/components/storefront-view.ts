export type {
  CatalogStorefrontEditor,
  CatalogStorefrontEditorField,
  CatalogStorefrontEditorTarget,
  CatalogStorefrontViewModel,
} from "../model/storefront";

export type StorefrontTab = {
  id: string;
  label: string;
  type: "menu-page" | "legacy";
};

export type StorefrontVisualTuning = {
  heroDim: number;
  heroGlow: number;
  patternOpacity: number;
  glassBlur: number;
  cardLift: number;
};
