import { StorefrontCrossfadeBackground } from "./storefront-media";
import type { CatalogStorefrontEditorTarget, CatalogStorefrontViewModel } from "./storefront-view";

type StorefrontHeroProps = {
  storefront: CatalogStorefrontViewModel;
  heroImageUrl: string;
  onActivateNestedEditor: (
    event: {
      stopPropagation: () => void;
    },
    target: CatalogStorefrontEditorTarget,
  ) => void;
};

export const StorefrontHero = ({
  storefront,
  heroImageUrl,
  onActivateNestedEditor,
}: StorefrontHeroProps) => (
  <div data-storefront-hero="image">
    <StorefrontCrossfadeBackground imageUrl={heroImageUrl} media="hero" />
    <div data-storefront-hero="overlay">
      <p data-storefront-hero="eyebrow">{storefront.access.canEdit ? "Seller storefront" : "Storefront"}</p>
      <h1>{storefront.shop.name}</h1>
      <p data-storefront-hero="description">
        {storefront.shop.description ?? "Fresh menu, quick pickup, and the latest dishes in one mobile storefront."}
      </p>
      {storefront.shop.renameReviewNote !== null ? <p>{storefront.shop.renameReviewNote}</p> : null}
      {storefront.access.canEdit ? (
        <button
          type="button"
          data-storefront-hero="edit"
          data-magnetic="true"
          onClick={(event) => onActivateNestedEditor(event, { type: "shop" })}
        >
          Edit storefront
        </button>
      ) : null}
    </div>
  </div>
);
