import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLanguageContext } from "../../../app/language-context";
import { isDebugEnabled } from "../../../shared/config/debug";
import { getCopy } from "../../../shared/i18n/copy";
import { PageShell } from "../../../shared/ui/page-shell";
import { buildStorefrontPath } from "../../../shared/lib/routes";
import type { CatalogViewModel } from "../model/catalog-view-model";
import { StorefrontImageCropField } from "./storefront-image-crop-field";

const defaultShopHeaderImage = "/media/shop-example.png";
const defaultStorefrontBackgroundImage = "/media/background_green.png";

export type CatalogStorefrontEditorField = {
  name: string;
  label: string;
  value: string;
  inputMode: "text" | "textarea" | "number" | "image";
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
  debugLogs: string[];
};

const StorefrontDebugPanel = ({ logs }: { logs: string[] }) => {
  const joinedLogs = logs.join("\n");

  return (
    <section data-storefront-debug="panel">
      <div data-storefront-debug="header">
        <div>
          <p data-storefront-section-label>Debug logs</p>
          <h3>Storefront diagnostics</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.clipboard !== undefined) {
              void navigator.clipboard.writeText(joinedLogs);
            }
          }}
        >
          Copy logs
        </button>
      </div>
      <textarea readOnly value={joinedLogs} data-storefront-debug="output" />
    </section>
  );
};

type CatalogPageProps = {
  viewModel: CatalogViewModel;
  storefront?: CatalogStorefrontViewModel;
  onActivateEditor?: (target: CatalogStorefrontEditorTarget) => void;
  onEditorFieldChange?: (name: string, value: string) => void;
  onCancelEditor?: () => void;
  onSubmitEditor?: () => void;
};

type StorefrontVisualTuning = {
  heroDim: number;
  heroGlow: number;
  patternOpacity: number;
  glassBlur: number;
  cardLift: number;
};

const defaultStorefrontVisualTuning: StorefrontVisualTuning = {
  heroDim: 60,
  heroGlow: 42,
  patternOpacity: 32,
  glassBlur: 16,
  cardLift: 26,
};

const createStorefrontVisualStyle = (tuning: StorefrontVisualTuning): CSSProperties => ({
  "--storefront-hero-dim": `${tuning.heroDim / 100}`,
  "--storefront-hero-glow": `${tuning.heroGlow / 100}`,
  "--storefront-pattern-opacity": `${tuning.patternOpacity / 100}`,
  "--storefront-glass-blur": `${tuning.glassBlur}px`,
  "--storefront-card-lift": `${tuning.cardLift}px`,
} as CSSProperties);

const StorefrontVisualControls = ({
  tuning,
  isOpen,
  onToggle,
  onChange,
}: {
  tuning: StorefrontVisualTuning;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (name: keyof StorefrontVisualTuning, value: number) => void;
}) => (
  <div
    data-storefront-fx="dock"
    onClick={(event) => {
      event.stopPropagation();
    }}
  >
    <button type="button" data-storefront-fx="toggle" onClick={onToggle}>
      {isOpen ? "Hide effects" : "Show effects"}
    </button>
    {isOpen ? (
      <section data-storefront-fx="panel">
        <h3>Visual controls</h3>
        <label data-storefront-fx="control">
          <span>Hero dim</span>
          <strong>{tuning.heroDim}</strong>
          <input
            type="range"
            min="20"
            max="90"
            value={tuning.heroDim}
            onChange={(event) => {
              onChange("heroDim", Number(event.target.value));
            }}
          />
        </label>
        <label data-storefront-fx="control">
          <span>Glow</span>
          <strong>{tuning.heroGlow}</strong>
          <input
            type="range"
            min="0"
            max="100"
            value={tuning.heroGlow}
            onChange={(event) => {
              onChange("heroGlow", Number(event.target.value));
            }}
          />
        </label>
        <label data-storefront-fx="control">
          <span>Pattern</span>
          <strong>{tuning.patternOpacity}</strong>
          <input
            type="range"
            min="0"
            max="70"
            value={tuning.patternOpacity}
            onChange={(event) => {
              onChange("patternOpacity", Number(event.target.value));
            }}
          />
        </label>
        <label data-storefront-fx="control">
          <span>Glass blur</span>
          <strong>{tuning.glassBlur}</strong>
          <input
            type="range"
            min="0"
            max="26"
            value={tuning.glassBlur}
            onChange={(event) => {
              onChange("glassBlur", Number(event.target.value));
            }}
          />
        </label>
        <label data-storefront-fx="control">
          <span>Card lift</span>
          <strong>{tuning.cardLift}</strong>
          <input
            type="range"
            min="0"
            max="44"
            value={tuning.cardLift}
            onChange={(event) => {
              onChange("cardLift", Number(event.target.value));
            }}
          />
        </label>
      </section>
    ) : null}
  </div>
);

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
  const [visualTuning, setVisualTuning] = useState<StorefrontVisualTuning>(defaultStorefrontVisualTuning);
  const [isVisualPanelOpen, setIsVisualPanelOpen] = useState(false);
  const heroBackgroundStyle = useMemo<CSSProperties | undefined>(() => {
    if (storefront === undefined) {
      return undefined;
    }

    const imageUrl = storefront.shop.headerImageUrl ?? defaultShopHeaderImage;

    return {
      "--storefront-hero-image": `url(${imageUrl})`,
    };
  }, [storefront]);
  const contentBackgroundStyle = useMemo<CSSProperties | undefined>(() => {
    if (storefront === undefined) {
      return undefined;
    }

    const imageUrl = storefront.shop.backgroundImageUrl ?? defaultStorefrontBackgroundImage;

    return {
      "--storefront-content-image": `url(${imageUrl})`,
    };
  }, [storefront]);
  const visualStyle = useMemo(() => createStorefrontVisualStyle(visualTuning), [visualTuning]);
  const storefrontTabs = useMemo(() => {
    if (storefront === undefined) {
      return [] as Array<{ id: string; label: string; type: "menu-page" | "legacy" }>;
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

  useEffect(() => {
    const hasActiveTab = resolvedActiveTabId !== null && storefrontTabs.some((tab) => tab.id === resolvedActiveTabId);

    if (hasActiveTab) {
      return;
    }

    setActiveTabId(storefrontTabs[0]?.id ?? null);
  }, [resolvedActiveTabId, storefrontTabs]);

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
            <div
              data-storefront-hero="image"
              style={heroBackgroundStyle}
            >
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
                    onClick={(event) => activateNestedEditor(event, { type: "shop" })}
                  >
                    Edit storefront
                  </button>
                ) : null}
              </div>
            </div>

            <div
              data-storefront-content="surface"
              style={contentBackgroundStyle}
            >
              <div data-storefront-content="intro">
                <p>{storefront.access.statusLabel}</p>
                {storefront.access.activationHint !== null ? <p>{storefront.access.activationHint}</p> : null}
              </div>

              {storefrontTabs.length > 0 ? (
                <div data-storefront-tabs="wrap">
                  <div data-storefront-tabs="list" role="tablist" aria-label="Storefront menu pages">
                    {storefrontTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
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
                        onClick={(event) => activateNestedEditor(event, { type: "new-menu-page" })}
                      >
                        {storefront.addMenuPageLabel}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {storefront.menuPages.length === 0 && storefront.unpagedProducts.length === 0 ? (
                <p>{storefront.emptyMenuPagesLabel}</p>
              ) : null}

              {storefront.menuPages
                .filter((menuPage) => menuPage.id === resolvedActiveTabId)
                .map((menuPage) => (
                  <section
                    key={menuPage.id}
                    data-menu-page-id={menuPage.id}
                    data-storefront-menu="panel"
                    onClick={() => activateEditor({ type: "menu-page", menuPageId: menuPage.id })}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      activateEditor({ type: "menu-page", menuPageId: menuPage.id });
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
                          onClick={(event) => activateNestedEditor(event, { type: "new-product", menuPageId: menuPage.id })}
                        >
                          {storefront.addProductLabel}
                        </button>
                      ) : null}
                    </div>

                    {menuPage.products.length === 0 ? <p>{storefront.emptyProductsLabel}</p> : null}

                    <ul data-storefront-products="list">
                      {menuPage.products.map((product) => (
                        <li
                          key={product.id}
                          data-product-id={product.id}
                          data-storefront-product="card"
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
                          {product.imageUrl !== null ? <img src={product.imageUrl} alt="" data-storefront-product="image" /> : null}
                          <div data-storefront-product="body">
                            <div data-storefront-product="meta">
                              <strong>{product.name}</strong>
                              <span>{product.priceLabel}</span>
                            </div>
                            {product.description !== null ? <p>{product.description}</p> : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}

              {resolvedActiveTabId === "legacy-unpaged-products" && storefront.unpagedProducts.length > 0 ? (
                <section data-menu-page-id="legacy-unpaged-products" data-storefront-menu="panel">
                  <div data-storefront-menu="heading">
                    <div>
                      <p data-storefront-section-label>Compatibility</p>
                      <h2>Legacy products without a menu page</h2>
                    </div>
                  </div>
                  <p>These existing products remain editable until they are reassigned to a real menu page.</p>
                  <ul data-storefront-products="list">
                    {storefront.unpagedProducts.map((product) => (
                      <li
                        key={product.id}
                        data-product-id={product.id}
                        data-storefront-product="card"
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
                        {product.imageUrl !== null ? <img src={product.imageUrl} alt="" data-storefront-product="image" /> : null}
                        <div data-storefront-product="body">
                          <div data-storefront-product="meta">
                            <strong>{product.name}</strong>
                            <span>{product.priceLabel}</span>
                          </div>
                          {product.description !== null ? <p>{product.description}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <StorefrontVisualControls
                tuning={visualTuning}
                isOpen={isVisualPanelOpen}
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

              {isDebugEnabled ? <StorefrontDebugPanel logs={storefront.debugLogs} /> : null}
            </div>
          </article>

          {storefront.editor !== null ? (
            <div data-storefront-editor="backdrop">
              <form
                data-catalog-editor="active"
                data-storefront-editor="panel"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmitEditor?.();
                }}
              >
                <div data-storefront-editor="header">
                  <div>
                    <p data-storefront-section-label>Seller edit mode</p>
                    <h3>{storefront.editor.title}</h3>
                  </div>
                  <button type="button" onClick={() => onCancelEditor?.()} disabled={storefront.isSaving}>
                    Close
                  </button>
                </div>
                <div data-storefront-editor="fields">
                  {storefront.editor.fields.map((field) => {
                    if (field.inputMode === "image") {
                      return (
                        <StorefrontImageCropField
                          key={field.name}
                          name={field.name}
                          label={field.label}
                          value={field.value}
                          aspect={field.name === "headerImageUrl" ? 16 / 9 : 1}
                          onChange={(value) => onEditorFieldChange?.(field.name, value)}
                        />
                      );
                    }

                    return (
                      <label key={field.name} data-storefront-editor-field={field.inputMode}>
                        <span>{field.label}</span>
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
                    );
                  })}
                </div>
                <div data-storefront-editor="actions">
                  <button type="submit" disabled={storefront.isSaving}>
                    {storefront.isSaving ? "Saving..." : storefront.editor.submitLabel}
                  </button>
                  <button type="button" onClick={() => onCancelEditor?.()} disabled={storefront.isSaving}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
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
