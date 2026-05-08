import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";

import { StorefrontCrossfadeBackground, StorefrontCrossfadeImage } from "./storefront-media";
import type { CatalogStorefrontEditorTarget, CatalogStorefrontViewModel, StorefrontTab } from "./storefront-view";

type StorefrontCartProduct = {
  id: string;
  name: string;
  priceMinor: number;
};

type StorefrontProductCardProduct = StorefrontCartProduct & {
  description: string | null;
  imageUrl: string | null;
  priceLabel: string;
};

type StorefrontProductCardProps = {
  product: StorefrontProductCardProduct;
  menuPageId: string | null;
  canEdit: boolean;
  cartQuantity: number;
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
  onAddCartItem: (product: StorefrontCartProduct) => void;
  onUpdateCartItemQuantity: (productId: string, quantity: number) => void;
  canCurateShowcase?: boolean;
  addToShowcaseLabel?: string;
  isShowcaseCurationPending?: boolean;
  onAddProductToShowcase?: (productId: string) => void;
};

const customerProductLongPressDelayMs = 420;

const StorefrontProductCard = ({
  product,
  menuPageId,
  canEdit,
  cartQuantity,
  onActivateNestedEditor,
  onActivateNestedEditorFromContextMenu,
  onAddCartItem,
  onUpdateCartItemQuantity,
  canCurateShowcase = false,
  addToShowcaseLabel,
  isShowcaseCurationPending = false,
  onAddProductToShowcase,
}: StorefrontProductCardProps) => {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);
  const [descriptionAnchor, setDescriptionAnchor] = useState<{ x: number; y: number } | null>(null);
  const [adminCurationAnchor, setAdminCurationAnchor] = useState<{ x: number; y: number } | null>(null);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const stopPressTracking = () => {
    clearLongPressTimer();

    if (!canCurateShowcase) {
      setDescriptionAnchor(null);
    }
  };

  const openAdminCurationMenu = (anchor: { x: number; y: number }) => {
    setDescriptionAnchor(null);
    setAdminCurationAnchor(anchor);
  };

  const startCustomerLongPress = (event: PointerEvent<HTMLLIElement>) => {
    if (canEdit && !canCurateShowcase) {
      return;
    }

    clearLongPressTimer();
    didLongPressRef.current = false;

    const rect = event.currentTarget.getBoundingClientRect();
    const anchor = {
      x: Math.max(18, Math.min(rect.width - 18, event.clientX - rect.left)),
      y: Math.max(18, Math.min(rect.height - 18, event.clientY - rect.top)),
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
    longPressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;

      if (canCurateShowcase) {
        openAdminCurationMenu(anchor);

        return;
      }

      if (product.description !== null && product.description.trim().length > 0) {
        setDescriptionAnchor(anchor);
      }
    }, customerProductLongPressDelayMs);
  };

  const handleCardClick = (event: { stopPropagation: () => void }) => {
    if (canEdit) {
      onActivateNestedEditor(event, {
        type: "product",
        menuPageId,
        productId: product.id,
      });

      return;
    }

    event.stopPropagation();

    if (didLongPressRef.current) {
      didLongPressRef.current = false;

      return;
    }

    if (adminCurationAnchor !== null) {
      setAdminCurationAnchor(null);

      return;
    }

    onAddCartItem(product);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === "Escape" && adminCurationAnchor !== null) {
      event.preventDefault();
      setAdminCurationAnchor(null);

      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleCardClick(event);
  };

  const descriptionStyle =
    descriptionAnchor === null
      ? undefined
      : ({
          "--storefront-description-x": `${descriptionAnchor.x}px`,
          "--storefront-description-y": `${descriptionAnchor.y}px`,
        } as CSSProperties);
  const adminCurationStyle =
    adminCurationAnchor === null
      ? undefined
      : ({
          "--storefront-description-x": `${adminCurationAnchor.x}px`,
          "--storefront-description-y": `${adminCurationAnchor.y}px`,
        } as CSSProperties);

  const openAdminCurationFromContextMenu = (event: MouseEvent<HTMLLIElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    openAdminCurationMenu({
      x: Math.max(18, Math.min(rect.width - 18, event.clientX - rect.left)),
      y: Math.max(18, Math.min(rect.height - 18, event.clientY - rect.top)),
    });
  };

  return (
    <li
      key={product.id}
      data-product-id={product.id}
      data-storefront-product="card"
      data-storefront-product-selected={cartQuantity > 0 ? "true" : "false"}
      role={canEdit ? undefined : "button"}
      tabIndex={canEdit ? undefined : 0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      onPointerDown={startCustomerLongPress}
      onPointerUp={stopPressTracking}
      onPointerCancel={stopPressTracking}
      onPointerLeave={stopPressTracking}
      onContextMenu={(event) => {
        if (canEdit) {
          onActivateNestedEditorFromContextMenu(event, {
            type: "product",
            menuPageId,
            productId: product.id,
          });

          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (canCurateShowcase) {
          openAdminCurationFromContextMenu(event);
        }
      }}
    >
      {descriptionAnchor !== null && product.description !== null ? (
        <div role="tooltip" data-storefront-product="description-popover" style={descriptionStyle}>
          {product.description}
        </div>
      ) : null}
      {adminCurationAnchor !== null && canCurateShowcase ? (
        <button
          type="button"
          data-storefront-admin-curation="add-product"
          disabled={isShowcaseCurationPending}
          style={adminCurationStyle}
          onClick={(event) => {
            event.stopPropagation();
            setAdminCurationAnchor(null);
            onAddProductToShowcase?.(product.id);
          }}
        >
          {addToShowcaseLabel ?? "Add to showcase"}
        </button>
      ) : null}
      {cartQuantity > 0 && !canEdit ? <span data-storefront-cart="quantity-badge">{cartQuantity}</span> : null}
      {product.imageUrl !== null ? <StorefrontCrossfadeImage src={product.imageUrl} alt="" /> : <div aria-hidden="true" data-storefront-product="media-placeholder" />}
      <div data-storefront-product="body">
        <div data-storefront-product="meta">
          <strong>{product.name}</strong>
          <span>{product.priceLabel}</span>
        </div>
        {product.description !== null ? <p>{product.description}</p> : null}
        {!canEdit && cartQuantity > 0 ? (
          <div data-storefront-cart="inline-counter" aria-label={`${product.name} quantity`}>
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
    </li>
  );
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
  canCurateShowcase?: boolean;
  addToShowcaseLabel?: string;
  isShowcaseCurationPending?: boolean;
  onAddProductToShowcase?: (productId: string) => void;
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
  canCurateShowcase = false,
  addToShowcaseLabel,
  isShowcaseCurationPending = false,
  onAddProductToShowcase,
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
                <StorefrontProductCard
                  key={product.id}
                  product={product}
                  menuPageId={menuPage.id}
                  canEdit={storefront.access.canEdit}
                  cartQuantity={cartQuantity}
                  onActivateNestedEditor={onActivateNestedEditor}
                  onActivateNestedEditorFromContextMenu={onActivateNestedEditorFromContextMenu}
                  onAddCartItem={onAddCartItem}
                  onUpdateCartItemQuantity={onUpdateCartItemQuantity}
                  canCurateShowcase={canCurateShowcase}
                  addToShowcaseLabel={addToShowcaseLabel}
                  isShowcaseCurationPending={isShowcaseCurationPending}
                  onAddProductToShowcase={onAddProductToShowcase}
                />
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
              <StorefrontProductCard
                key={product.id}
                product={product}
                menuPageId={product.menuPageId}
                canEdit={storefront.access.canEdit}
                cartQuantity={cartQuantity}
                onActivateNestedEditor={onActivateNestedEditor}
                onActivateNestedEditorFromContextMenu={onActivateNestedEditorFromContextMenu}
                onAddCartItem={onAddCartItem}
                onUpdateCartItemQuantity={onUpdateCartItemQuantity}
                canCurateShowcase={canCurateShowcase}
                addToShowcaseLabel={addToShowcaseLabel}
                isShowcaseCurationPending={isShowcaseCurationPending}
                onAddProductToShowcase={onAddProductToShowcase}
              />
            );
          })}
        </ul>
      </section>
    ) : null}

    {children}
  </div>
);
