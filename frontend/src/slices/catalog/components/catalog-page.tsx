import { useLanguageContext } from "../../../app/language-context";
import { isDebugEnabled } from "../../../shared/config/debug";
import { getCopy } from "../../../shared/i18n/copy";
import { PageShell } from "../../../shared/ui/page-shell";
import { buildStorefrontPath } from "../../../shared/lib/routes";
import type { CatalogViewModel } from "../model/catalog-view-model";

export type CatalogStorefrontEditorField = {
  name: string;
  label: string;
  value: string;
  inputMode: "text" | "textarea" | "number";
};

export type CatalogStorefrontEditorTarget =
  | {
      type: "shop";
    }
  | {
      type: "menu-page";
      menuPageId: string;
    }
  | {
      type: "product";
      menuPageId: string | null;
      productId: string;
    }
  | {
      type: "new-menu-page";
    }
  | {
      type: "new-product";
      menuPageId: string;
    };

export type CatalogStorefrontEditor = {
  title: string;
  submitLabel: string;
  target: CatalogStorefrontEditorTarget;
  fields: CatalogStorefrontEditorField[];
};

export type CatalogStorefrontViewModel = {
  shop: {
    id: string;
    publicPath: string;
    name: string;
    description: string | null;
    headerImageUrl: string | null;
    backgroundImageUrl: string | null;
    renameReviewNote: string | null;
  };
  access: {
    canEdit: boolean;
    currentTelegramId: string | null;
    authDebugLabel: string | null;
    statusLabel: string;
    activationHint: string | null;
  };
  menuPages: Array<{
    id: string;
    name: string;
    products: Array<{
      id: string;
      name: string;
      description: string | null;
      imageUrl: string | null;
      priceLabel: string;
    }>;
  }>;
  unpagedProducts: Array<{
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    priceLabel: string;
    menuPageId: string | null;
  }>;
  emptyMenuPagesLabel: string;
  emptyProductsLabel: string;
  addMenuPageLabel: string;
  addProductLabel: string;
  successMessage: string | null;
  errorMessage: string | null;
  isSaving: boolean;
  editor: CatalogStorefrontEditor | null;
};

type CatalogPageProps = {
  viewModel: CatalogViewModel;
  storefront?: CatalogStorefrontViewModel;
  onActivateEditor?: (target: CatalogStorefrontEditorTarget) => void;
  onEditorFieldChange?: (name: string, value: string) => void;
  onCancelEditor?: () => void;
  onSubmitEditor?: () => void;
};

export const CatalogPage = ({
  viewModel,
  storefront,
  onActivateEditor,
  onEditorFieldChange,
  onCancelEditor,
  onSubmitEditor,
}: CatalogPageProps) => {
  const { state } = useLanguageContext();
  const copy = getCopy(state.language).catalog;
  const actionLabel = storefront?.isSaving === true ? "Saving storefront changes..." : undefined;

  const activateEditor = (target: CatalogStorefrontEditorTarget) => {
    if (storefront?.access.canEdit !== true || onActivateEditor === undefined) {
      return;
    }

    onActivateEditor(target);
  };

  const activateNestedEditor = (
    event: {
      stopPropagation: () => void;
    },
    target: CatalogStorefrontEditorTarget,
  ) => {
    event.stopPropagation();
    activateEditor(target);
  };

  const activateNestedEditorFromContextMenu = (
    event: {
      preventDefault: () => void;
      stopPropagation: () => void;
    },
    target: CatalogStorefrontEditorTarget,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    activateEditor(target);
  };

  return (
    <PageShell title={viewModel.headline} actionLabel={actionLabel} isActionPending={storefront?.isSaving === true}>
      <section aria-live="polite">
        {viewModel.statusLabel.length > 0 ? <p>{viewModel.statusLabel}</p> : null}
        {viewModel.isLoading ? <p>{copy.loadingBody}</p> : null}
        {viewModel.errorMessage !== null ? <p role="alert">{viewModel.errorMessage}</p> : null}
        {isDebugEnabled && storefront !== undefined ? <p>{storefront.access.statusLabel}</p> : null}
        {isDebugEnabled && storefront !== undefined && storefront.access.currentTelegramId !== null ? (
          <p data-storefront-telegram-id>{`Current Telegram ID: ${storefront.access.currentTelegramId}`}</p>
        ) : null}
        {isDebugEnabled && storefront !== undefined && storefront.access.authDebugLabel !== null ? (
          <p data-storefront-auth-debug>{storefront.access.authDebugLabel}</p>
        ) : null}
        {storefront !== undefined && storefront.successMessage !== null ? <p role="status">{storefront.successMessage}</p> : null}
        {storefront !== undefined && storefront.errorMessage !== null ? <p role="alert">{storefront.errorMessage}</p> : null}
      </section>

      {storefront !== undefined && !viewModel.isLoading && viewModel.errorMessage === null ? (
        <section>
          <article
            key={storefront.shop.id}
            data-shop-id={storefront.shop.id}
            data-catalog-storefront="shop"
            onClick={() => activateEditor({ type: "shop" })}
            onContextMenu={(event) => {
              event.preventDefault();
              activateEditor({ type: "shop" });
            }}
          >
            <h2>{storefront.shop.name}</h2>
            {storefront.shop.description !== null ? <p>{storefront.shop.description}</p> : null}
            {storefront.shop.headerImageUrl !== null ? <p>{`Header image: ${storefront.shop.headerImageUrl}`}</p> : null}
            {storefront.shop.backgroundImageUrl !== null ? (
              <p>{`Background image: ${storefront.shop.backgroundImageUrl}`}</p>
            ) : null}
            {storefront.shop.renameReviewNote !== null ? <p>{storefront.shop.renameReviewNote}</p> : null}
            {storefront.access.activationHint !== null ? <p>{storefront.access.activationHint}</p> : null}
          </article>

          {storefront.menuPages.length === 0 ? <p>{storefront.emptyMenuPagesLabel}</p> : null}

          {storefront.menuPages.map((menuPage) => (
            <section
              key={menuPage.id}
              data-menu-page-id={menuPage.id}
              onClick={() => activateEditor({ type: "menu-page", menuPageId: menuPage.id })}
              onContextMenu={(event) => {
                event.preventDefault();
                activateEditor({ type: "menu-page", menuPageId: menuPage.id });
              }}
            >
              <h3>{menuPage.name}</h3>
              {storefront.access.canEdit ? (
                <button
                  type="button"
                  onClick={(event) => activateNestedEditor(event, { type: "new-product", menuPageId: menuPage.id })}
                >
                  {storefront.addProductLabel}
                </button>
              ) : null}

              {menuPage.products.length === 0 ? <p>{storefront.emptyProductsLabel}</p> : null}

              <ul>
                {menuPage.products.map((product) => (
                  <li
                    key={product.id}
                    data-product-id={product.id}
                    onClick={(event) =>
                      activateNestedEditor(event, {
                        type: "product",
                        menuPageId: menuPage.id,
                        productId: product.id,
                      })
                    }
                    onContextMenu={(event) =>
                      activateNestedEditorFromContextMenu(event, {
                        type: "product",
                        menuPageId: menuPage.id,
                        productId: product.id,
                      })
                    }
                  >
                    <strong>{product.name}</strong>
                    <span>{` ${product.priceLabel}`}</span>
                    {product.description !== null ? <p>{product.description}</p> : null}
                    {product.imageUrl !== null ? <p>{`Image: ${product.imageUrl}`}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {storefront.unpagedProducts.length > 0 ? (
            <section data-menu-page-id="legacy-unpaged-products">
              <h3>Legacy products without a menu page</h3>
              <p>These existing products remain editable until they are reassigned to a real menu page.</p>
              <ul>
                {storefront.unpagedProducts.map((product) => (
                  <li
                    key={product.id}
                    data-product-id={product.id}
                    onClick={(event) =>
                      activateNestedEditor(event, {
                        type: "product",
                        menuPageId: product.menuPageId,
                        productId: product.id,
                      })
                    }
                    onContextMenu={(event) =>
                      activateNestedEditorFromContextMenu(event, {
                        type: "product",
                        menuPageId: product.menuPageId,
                        productId: product.id,
                      })
                    }
                  >
                    <strong>{product.name}</strong>
                    <span>{` ${product.priceLabel}`}</span>
                    {product.description !== null ? <p>{product.description}</p> : null}
                    {product.imageUrl !== null ? <p>{`Image: ${product.imageUrl}`}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {storefront.access.canEdit ? (
            <button type="button" onClick={() => activateEditor({ type: "new-menu-page" })}>
              {storefront.addMenuPageLabel}
            </button>
          ) : null}

          {storefront.editor !== null ? (
            <form
              data-catalog-editor="active"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmitEditor?.();
              }}
            >
              <h3>{storefront.editor.title}</h3>
              {storefront.editor.fields.map((field) => (
                <label key={field.name}>
                  {field.label}
                  {field.inputMode === "textarea" ? (
                    <textarea
                      value={field.value}
                      onChange={(event) => onEditorFieldChange?.(field.name, event.target.value)}
                    />
                  ) : (
                    <input
                      type={field.inputMode === "number" ? "number" : "text"}
                      value={field.value}
                      onChange={(event) => onEditorFieldChange?.(field.name, event.target.value)}
                    />
                  )}
                </label>
              ))}
              <button type="submit" disabled={storefront.isSaving}>
                {storefront.isSaving ? "Saving..." : storefront.editor.submitLabel}
              </button>
              <button type="button" onClick={() => onCancelEditor?.()} disabled={storefront.isSaving}>
                Cancel
              </button>
            </form>
          ) : null}
        </section>
      ) : viewModel.isLoading || viewModel.errorMessage !== null || viewModel.isEmpty ? null : (
        <section>
          {viewModel.shops.map((shop) => (
            <article key={shop.id} data-shop-id={shop.id}>
              <h2>
                <a href={buildStorefrontPath(shop.publicPath)}>{shop.name}</a>
              </h2>

              {shop.emptyLabel !== null ? (
                <p>{shop.emptyLabel}</p>
              ) : (
                <ul>
                  {shop.products.map((product) => (
                    <li key={product.id}>
                      <strong>{product.name}</strong>
                      <span>{` ${product.priceLabel}`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}
    </PageShell>
  );
};
