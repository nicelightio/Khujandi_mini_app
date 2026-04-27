import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguageContext } from "../../../app/language-context";
import { isDebugEnabled } from "../../../shared/config/debug";
import { getCopy } from "../../../shared/i18n/copy";
import { useMagneticElements } from "../../../shared/ui/use-magnetic-elements";
import { PageShell } from "../../../shared/ui/page-shell";
import { buildStorefrontPath, routes } from "../../../shared/lib/routes";
import type { CatalogViewModel } from "../model/catalog-view-model";
import {
  addCatalogCompositionItem,
  buildCustomerOrderCompositionPayload,
  createEmptyCatalogCompositionState,
  persistCustomerOrderCompositionHandoff,
  removeCatalogCompositionItem,
  updateCatalogCompositionItemQuantity,
  type CatalogCompositionProduct,
  type CatalogCompositionShop,
  type CustomerOrderCompositionPayload,
} from "../model/composition";
import { StorefrontEditorModal } from "./storefront-editor-modal";
import {
  createStorefrontVisualStyle,
  defaultStorefrontVisualTuning,
  StorefrontEffectsDock,
} from "./storefront-effects-dock";
import { StorefrontHero } from "./storefront-hero";
import { StorefrontMenuSections } from "./storefront-menu-sections";
import type {
  CatalogStorefrontEditorTarget,
  CatalogStorefrontViewModel,
  StorefrontTab,
  StorefrontVisualTuning,
} from "./storefront-view";

const defaultShopHeaderImage = "/media/shop-example.png?v=storefront-defaults-20260422";
const defaultStorefrontBackgroundImage = "/media/background_green.png?v=storefront-defaults-20260422";

type CatalogPageProps = {
  viewModel: CatalogViewModel;
  storefront?: CatalogStorefrontViewModel;
  onActivateEditor?: (target: CatalogStorefrontEditorTarget) => void;
  onEditorFieldChange?: (name: string, value: string) => void;
  onCancelEditor?: () => void;
  onSubmitEditor?: () => void;
  onCheckoutComposition?: (payload: CustomerOrderCompositionPayload) => void;
};

type PendingCartReplacement = {
  shop: CatalogCompositionShop;
  product: CatalogCompositionProduct;
};

export const CatalogPage = ({
  viewModel,
  storefront,
  onActivateEditor,
  onEditorFieldChange,
  onCancelEditor,
  onSubmitEditor,
  onCheckoutComposition,
}: CatalogPageProps) => {
  const { state } = useLanguageContext();
  const copy = getCopy(state.language).catalog;
  const actionLabel = storefront?.isSaving === true ? "Saving storefront changes..." : undefined;
  const [visualTuning, setVisualTuning] = useState<StorefrontVisualTuning>(defaultStorefrontVisualTuning);
  const [isVisualPanelOpen, setIsVisualPanelOpen] = useState(false);
  const [composition, setComposition] = useState(createEmptyCatalogCompositionState);
  const [pendingCartReplacement, setPendingCartReplacement] = useState<PendingCartReplacement | null>(null);
  const shopRef = useRef<HTMLElement | null>(null);
  const storefrontShopId = storefront?.shop.id;
  const heroImageUrl = storefront?.shop.headerImageUrl ?? defaultShopHeaderImage;
  const contentImageUrl = storefront?.shop.backgroundImageUrl ?? defaultStorefrontBackgroundImage;
  const visualStyle = useMemo(() => createStorefrontVisualStyle(visualTuning), [visualTuning]);
  const storefrontTabs = useMemo(() => {
    if (storefront === undefined) {
      return [] as StorefrontTab[];
    }

    const menuPageTabs = storefront.menuPages.map((menuPage) => ({
      id: menuPage.id,
      label: menuPage.name,
      type: "menu-page" as const,
    }));

    if (storefront.unpagedProducts.length === 0) {
      return menuPageTabs;
    }

    return [
      ...menuPageTabs,
      {
        id: "legacy-unpaged-products",
        label: "Legacy",
        type: "legacy" as const,
      },
    ];
  }, [storefront]);
  const [activeTabId, setActiveTabId] = useState<string | null>(storefrontTabs[0]?.id ?? null);
  const resolvedActiveTabId = activeTabId ?? storefrontTabs[0]?.id ?? null;
  const storefrontProductIds = useMemo(() => {
    if (storefront === undefined) {
      return new Set<string>();
    }

    return new Set([
      ...storefront.menuPages.flatMap((menuPage) => menuPage.products.map((product) => product.id)),
      ...storefront.unpagedProducts.map((product) => product.id),
    ]);
  }, [storefront]);
  const unavailableCompositionProductIds = useMemo(() => {
    if (storefront === undefined || composition.shop?.id !== storefront.shop.id) {
      return new Set<string>();
    }

    return new Set(
      composition.items
        .filter((item) => !storefrontProductIds.has(item.productId))
        .map((item) => item.productId),
    );
  }, [composition.items, composition.shop?.id, storefront, storefrontProductIds]);
  const hasUnavailableCompositionItems = unavailableCompositionProductIds.size > 0;
  const compositionPayload = hasUnavailableCompositionItems ? null : buildCustomerOrderCompositionPayload(composition);
  const compositionPreviewTotalMinor = composition.items.reduce(
    (total, item) => total + item.displaySnapshot.unitPriceMinor * item.quantity,
    0,
  );
  const previewTotalLabel = `${(compositionPreviewTotalMinor / 100).toFixed(2)} TJS`;
  const compositionItemsByProductId = useMemo(
    () => new Map(composition.items.map((item) => [item.productId, item])),
    [composition.items],
  );

  useEffect(() => {
    if (pendingCartReplacement === null || pendingCartReplacement.shop.id === storefrontShopId) {
      return;
    }

    setPendingCartReplacement(null);
  }, [pendingCartReplacement, storefrontShopId]);

  useEffect(() => {
    const hasActiveTab = resolvedActiveTabId !== null && storefrontTabs.some((tab) => tab.id === resolvedActiveTabId);

    if (hasActiveTab) {
      return;
    }

    setActiveTabId(storefrontTabs[0]?.id ?? null);
  }, [resolvedActiveTabId, storefrontTabs]);

  useMagneticElements(shopRef);

  useEffect(() => {
    if (storefrontShopId === undefined || typeof window === "undefined") {
      return;
    }

    const shopElement = shopRef.current;

    if (shopElement === null || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true) {
      return;
    }

    let frameHandle = 0;

    const updateParallax = () => {
      frameHandle = 0;

      const rect = shopElement.getBoundingClientRect();
      const heroOffset = Math.max(-56, Math.min(56, rect.top * -0.14));
      const beamOffset = Math.max(-24, Math.min(24, rect.top * -0.08));

      shopElement.style.setProperty("--storefront-hero-parallax", `${heroOffset}px`);
      shopElement.style.setProperty("--storefront-beam-shift", `${beamOffset}px`);
    };

    const scheduleParallax = () => {
      if (frameHandle !== 0) {
        return;
      }

      frameHandle = window.requestAnimationFrame(updateParallax);
    };

    scheduleParallax();
    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax);

    return () => {
      if (frameHandle !== 0) {
        window.cancelAnimationFrame(frameHandle);
      }

      window.removeEventListener("scroll", scheduleParallax);
      window.removeEventListener("resize", scheduleParallax);
    };
  }, [storefrontShopId]);

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

  const addCartItem = (product: { id: string; name: string; priceMinor: number }) => {
    if (storefront === undefined || storefront.access.canEdit) {
      return;
    }

    const shop: CatalogCompositionShop = {
      id: storefront.shop.id,
      publicPath: storefront.shop.publicPath,
      name: storefront.shop.name,
    };
    const compositionProduct: CatalogCompositionProduct = {
      id: product.id,
      shopId: storefront.shop.id,
      name: product.name,
      priceMinor: product.priceMinor,
    };

    setComposition((current) => {
      const result = addCatalogCompositionItem(current, {
        shop,
        product: compositionProduct,
      });

      if (result.status === "different-shop-blocked") {
        setPendingCartReplacement({ shop, product: compositionProduct });

        return current;
      }

      setPendingCartReplacement(null);

      return result.state;
    });
  };

  const replaceCartWithPendingItem = () => {
    if (pendingCartReplacement === null) {
      return;
    }

    const result = addCatalogCompositionItem(createEmptyCatalogCompositionState(), pendingCartReplacement);

    setComposition(result.state);
    setPendingCartReplacement(null);
  };

  const clearCart = () => {
    setComposition(createEmptyCatalogCompositionState());
    setPendingCartReplacement(null);
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    setComposition((current) => updateCatalogCompositionItemQuantity(current, productId, quantity));
  };

  const removeCartItem = (productId: string) => {
    setComposition((current) => removeCatalogCompositionItem(current, productId));
  };

  const startCheckoutHandoff = () => {
    if (compositionPayload === null) {
      return;
    }

    if (onCheckoutComposition !== undefined) {
      onCheckoutComposition(compositionPayload);

      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    persistCustomerOrderCompositionHandoff(compositionPayload, window.sessionStorage);
    window.location.assign(routes.checkoutPayment);
  };

  return (
    <PageShell
      title={viewModel.headline}
      actionLabel={actionLabel}
      isActionPending={storefront?.isSaving === true}
      hideHeader={storefront !== undefined}
    >
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
        <section data-catalog-storefront="viewport">
          <article
            ref={shopRef}
            key={storefront.shop.id}
            data-shop-id={storefront.shop.id}
            data-catalog-storefront="shop"
            data-can-edit={storefront.access.canEdit ? "true" : "false"}
            style={visualStyle}
            onClick={() => activateEditor({ type: "shop" })}
            onContextMenu={(event) => {
              event.preventDefault();
              activateEditor({ type: "shop" });
            }}
          >
            <StorefrontHero
              storefront={storefront}
              heroImageUrl={heroImageUrl}
              onActivateNestedEditor={activateNestedEditor}
            />

            <StorefrontMenuSections
              storefront={storefront}
              contentImageUrl={contentImageUrl}
              storefrontTabs={storefrontTabs}
              resolvedActiveTabId={resolvedActiveTabId}
              setActiveTabId={setActiveTabId}
              onActivateEditor={activateEditor}
              onActivateNestedEditor={activateNestedEditor}
              onActivateNestedEditorFromContextMenu={activateNestedEditorFromContextMenu}
              getCartQuantity={(productId) => compositionItemsByProductId.get(productId)?.quantity ?? 0}
              onAddCartItem={addCartItem}
              onUpdateCartItemQuantity={updateCartItemQuantity}
            >
              {!storefront.access.canEdit ? (
                <section data-storefront-cart="summary" aria-label="Cart summary">
                  <div data-storefront-cart="summary-heading">
                    <div>
                      <p data-storefront-section-label>Order draft</p>
                      <h2>{composition.shop?.name ?? storefront.shop.name}</h2>
                    </div>
                    <span data-storefront-cart-ready={compositionPayload === null ? "false" : "true"}>
                      {compositionPayload === null ? "Add items to unlock checkout" : "Checkout ready"}
                    </span>
                  </div>

                  {composition.items.length === 0 ? (
                    <p>Your cart is empty. Add products from this public storefront before checkout.</p>
                  ) : (
                    <ul data-storefront-cart="items">
                      {composition.items.map((item) => (
                        <li key={item.productId} data-storefront-cart="item" data-product-id={item.productId}>
                          <div>
                            <strong>{item.displaySnapshot.productName}</strong>
                            <span>{`${(item.displaySnapshot.unitPriceMinor / 100).toFixed(2)} ${item.displaySnapshot.currency}`}</span>
                            {unavailableCompositionProductIds.has(item.productId) ? (
                              <span data-storefront-cart="item-unavailable">Unavailable now</span>
                            ) : null}
                          </div>
                          <div data-storefront-cart="quantity-controls" aria-label={`${item.displaySnapshot.productName} cart quantity`}>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateCartItemQuantity(item.productId, item.quantity - 1);
                              }}
                            >
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateCartItemQuantity(item.productId, item.quantity + 1);
                              }}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            data-storefront-cart="remove"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeCartItem(item.productId);
                            }}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {hasUnavailableCompositionItems ? (
                    <p data-storefront-cart="repair" role="alert">
                      Some cart items are no longer available on this public storefront. Remove them before checkout.
                    </p>
                  ) : null}

                  <div data-storefront-cart="total">
                    <span>Preview total</span>
                    <strong>{previewTotalLabel}</strong>
                  </div>

                  <button
                    type="button"
                    data-storefront-cart="checkout"
                    disabled={compositionPayload === null}
                    onClick={(event) => {
                      event.stopPropagation();
                      startCheckoutHandoff();
                    }}
                  >
                    Continue to checkout
                  </button>

                  {pendingCartReplacement !== null ? (
                    <div data-storefront-cart="replace-prompt" role="status">
                      <p>{`Your cart has items from ${composition.shop?.name ?? "another shop"}. Replace it with ${pendingCartReplacement.shop.name} to keep checkout single-shop.`}</p>
                      <div data-storefront-cart="replace-actions">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            replaceCartWithPendingItem();
                          }}
                        >
                          Replace cart
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            clearCart();
                          }}
                        >
                          Clear cart
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <StorefrontEffectsDock
                tuning={visualTuning}
                isOpen={isVisualPanelOpen}
                logs={storefront.debugLogs}
                showDebug={isDebugEnabled}
                onToggle={() => {
                  setIsVisualPanelOpen((current) => !current);
                }}
                onChange={(name, value) => {
                  setVisualTuning((current) => ({
                    ...current,
                    [name]: value,
                  }));
                }}
              />
            </StorefrontMenuSections>
          </article>

          <StorefrontEditorModal
            storefront={storefront}
            onEditorFieldChange={onEditorFieldChange}
            onCancelEditor={onCancelEditor}
            onSubmitEditor={onSubmitEditor}
          />
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
