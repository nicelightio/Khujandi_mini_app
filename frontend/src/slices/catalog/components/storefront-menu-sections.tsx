import type { ReactNode } from "react";

import { StorefrontCrossfadeBackground, StorefrontCrossfadeImage } from "./storefront-media";
import type { CatalogStorefrontEditorTarget, CatalogStorefrontViewModel, StorefrontTab } from "./storefront-view";

type StorefrontCartProduct = {
  id: string;
  name: string;
  priceMinor: number;
};

type StorefrontMenuSectionsProps = {
  storefront: CatalogStorefrontViewModel;
  contentImageUrl: string;
  storefrontTabs: StorefrontTab[];
  resolvedActiveTabId: string | null;
  setActiveTabId: (tabId: string) => void;
  onActivateEditor: (target: CatalogStorefrontEditorTarget) => void;
  onActivateNestedEditor: (
    event: {
      stopPropagation: () => void;
    },
    target: CatalogStorefrontEditorTarget,
  ) => void;
  onActivateNestedEditorFromContextMenu: (
    event: {
      preventDefault: () => void;
      stopPropagation: () => void;
    },
    target: CatalogStorefrontEditorTarget,
  ) => void;
  getCartQuantity: (productId: string) => number;
  onAddCartItem: (product: StorefrontCartProduct) => void;
  onUpdateCartItemQuantity: (productId: string, quantity: number) => void;
  children?: ReactNode;
};

export const StorefrontMenuSections = ({
  storefront,
  contentImageUrl,
  storefrontTabs,
  resolvedActiveTabId,
  setActiveTabId,
  onActivateEditor,
  onActivateNestedEditor,
  onActivateNestedEditorFromContextMenu,
  getCartQuantity,
  onAddCartItem,
  onUpdateCartItemQuantity,
  children,
}: StorefrontMenuSectionsProps) => (
  <div data-storefront-content="surface">
    <StorefrontCrossfadeBackground imageUrl={contentImageUrl} media="content" />
    <div aria-hidden="true" data-storefront-fx="viewport-beam" />
    <div data-storefront-content="intro">
      <div data-storefront-status="row">
        <span data-storefront-status="chip" data-storefront-status-tone={storefront.access.canEdit ? "accent" : "neutral"}>
          {storefront.access.statusLabel}
        </span>
      </div>
      {storefront.access.activationHint !== null ? <p>{storefront.access.activationHint}</p> : null}
    </div>

    {storefrontTabs.length > 0 ? (
      <div data-storefront-tabs="wrap">
        <div data-storefront-tabs="list" role="tablist" aria-label="Storefront menu pages">
          {storefrontTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-magnetic="true"
              role="tab"
              aria-selected={tab.id === resolvedActiveTabId}
              data-storefront-tab-state={tab.id === resolvedActiveTabId ? "active" : "idle"}
              onClick={(event) => {
                event.stopPropagation();
                setActiveTabId(tab.id);
              }}
            >
              {tab.label}
            </button>
          ))}
          {storefront.access.canEdit ? (
            <button
              type="button"
              data-storefront-tab-action="add"
              data-magnetic="true"
              onClick={(event) => onActivateNestedEditor(event, { type: "new-menu-page" })}
            >
              {storefront.addMenuPageLabel}
            </button>
          ) : null}
        </div>
      </div>
    ) : null}

    {storefront.menuPages.length === 0 && storefront.unpagedProducts.length === 0 ? <p>{storefront.emptyMenuPagesLabel}</p> : null}

    {storefront.menuPages
      .filter((menuPage) => !storefront.access.canEdit || menuPage.id === resolvedActiveTabId)
      .map((menuPage) => (
        <section
          key={menuPage.id}
          data-menu-page-id={menuPage.id}
          data-storefront-menu="panel"
          onClick={() => onActivateEditor({ type: "menu-page", menuPageId: menuPage.id })}
          onContextMenu={(event) => {
            event.preventDefault();
            onActivateEditor({ type: "menu-page", menuPageId: menuPage.id });
          }}
        >
          <div data-storefront-menu="heading">
            <div>
              <p data-storefront-section-label>Menu page</p>
              <h2>{menuPage.name}</h2>
            </div>
            {storefront.access.canEdit ? (
              <button
                type="button"
                data-magnetic="true"
                onClick={(event) => onActivateNestedEditor(event, { type: "new-product", menuPageId: menuPage.id })}
              >
                {storefront.addProductLabel}
              </button>
            ) : null}
          </div>

          {menuPage.products.length === 0 ? <p>{storefront.emptyProductsLabel}</p> : null}

          <ul data-storefront-products="list">
            {menuPage.products.map((product) => {
              const cartQuantity = getCartQuantity(product.id);

              return (
                <li
                  key={product.id}
                  data-product-id={product.id}
                  data-storefront-product="card"
                  onClick={(event) =>
                    onActivateNestedEditor(event, {
                      type: "product",
                      menuPageId: menuPage.id,
                      productId: product.id,
                    })
                  }
                  onContextMenu={(event) =>
                    onActivateNestedEditorFromContextMenu(event, {
                      type: "product",
                      menuPageId: menuPage.id,
                      productId: product.id,
                    })
                  }
                >
                  {product.imageUrl !== null ? <StorefrontCrossfadeImage src={product.imageUrl} alt="" /> : <div aria-hidden="true" data-storefront-product="media-placeholder" />}
                  <div data-storefront-product="body">
                    <div data-storefront-product="meta">
                      <strong>{product.name}</strong>
                      <span>{product.priceLabel}</span>
                    </div>
                    {product.description !== null ? <p>{product.description}</p> : null}
                    {!storefront.access.canEdit ? (
                      <div data-storefront-cart="product-actions">
                        <button
                          type="button"
                          data-magnetic="true"
                          onClick={(event) => {
                            event.stopPropagation();
                            onAddCartItem(product);
                          }}
                        >
                          {cartQuantity > 0 ? `Add one more (${cartQuantity})` : "Add to cart"}
                        </button>
                        {cartQuantity > 0 ? (
                          <div data-storefront-cart="quantity-controls" aria-label={`${product.name} quantity`}>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onUpdateCartItemQuantity(product.id, cartQuantity - 1);
                              }}
                            >
                              -
                            </button>
                            <span>{cartQuantity}</span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onUpdateCartItemQuantity(product.id, cartQuantity + 1);
                              }}
                            >
                              +
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

    {(!storefront.access.canEdit || resolvedActiveTabId === "legacy-unpaged-products") && storefront.unpagedProducts.length > 0 ? (
      <section data-menu-page-id="legacy-unpaged-products" data-storefront-menu="panel">
        <div data-storefront-menu="heading">
          <div>
            <p data-storefront-section-label>Compatibility</p>
            <h2>Legacy products without a menu page</h2>
          </div>
        </div>
        <p>These existing products remain editable until they are reassigned to a real menu page.</p>
        <ul data-storefront-products="list">
          {storefront.unpagedProducts.map((product) => {
            const cartQuantity = getCartQuantity(product.id);

            return (
              <li
                key={product.id}
                data-product-id={product.id}
                data-storefront-product="card"
                onClick={(event) =>
                  onActivateNestedEditor(event, {
                    type: "product",
                    menuPageId: product.menuPageId,
                    productId: product.id,
                  })
                }
                onContextMenu={(event) =>
                  onActivateNestedEditorFromContextMenu(event, {
                    type: "product",
                    menuPageId: product.menuPageId,
                    productId: product.id,
                  })
                }
              >
                {product.imageUrl !== null ? <StorefrontCrossfadeImage src={product.imageUrl} alt="" /> : <div aria-hidden="true" data-storefront-product="media-placeholder" />}
                <div data-storefront-product="body">
                  <div data-storefront-product="meta">
                    <strong>{product.name}</strong>
                    <span>{product.priceLabel}</span>
                  </div>
                  {product.description !== null ? <p>{product.description}</p> : null}
                  {!storefront.access.canEdit ? (
                    <div data-storefront-cart="product-actions">
                      <button
                        type="button"
                        data-magnetic="true"
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddCartItem(product);
                        }}
                      >
                        {cartQuantity > 0 ? `Add one more (${cartQuantity})` : "Add to cart"}
                      </button>
                      {cartQuantity > 0 ? (
                        <div data-storefront-cart="quantity-controls" aria-label={`${product.name} quantity`}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onUpdateCartItemQuantity(product.id, cartQuantity - 1);
                            }}
                          >
                            -
                          </button>
                          <span>{cartQuantity}</span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onUpdateCartItemQuantity(product.id, cartQuantity + 1);
                            }}
                          >
                            +
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    ) : null}

    {children}
  </div>
);
