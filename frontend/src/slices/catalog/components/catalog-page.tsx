import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguageContext } from "../../../app/language-context";
import { isDebugEnabled } from "../../../shared/config/debug";
import { getCopy } from "../../../shared/i18n/copy";
import { useMagneticElements } from "../../../shared/ui/use-magnetic-elements";
import { PageShell } from "../../../shared/ui/page-shell";
import { buildStorefrontPath } from "../../../shared/lib/routes";
import type { CatalogViewModel } from "../model/catalog-view-model";
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
  const [visualTuning, setVisualTuning] = useState<StorefrontVisualTuning>(defaultStorefrontVisualTuning);
  const [isVisualPanelOpen, setIsVisualPanelOpen] = useState(false);
  const shopRef = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    const hasActiveTab = resolvedActiveTabId !== null && storefrontTabs.some((tab) => tab.id === resolvedActiveTabId);

    if (hasActiveTab) {
      return;
    }

    setActiveTabId(storefrontTabs[0]?.id ?? null);
  }, [resolvedActiveTabId, storefrontTabs]);

  useMagneticElements(shopRef);

  useEffect(() => {
    if (storefront === undefined || typeof window === "undefined") {
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
  }, [storefront?.shop.id]);

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
            >
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
