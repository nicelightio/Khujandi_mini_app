import { useEffect, useState } from "react";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import { createTelegramWebAppBridge } from "../../../shared/telegram/webapp";
import type { CatalogApi } from "../api/catalog-api";
import type { CatalogStorefrontEditorTarget, CatalogStorefrontViewModel } from "../components/catalog-page";
import {
  buildStorefrontCatalogViewModel,
  buildStorefrontViewModel,
  createCatalogStorefrontErrorState,
  createInitialCatalogStorefrontState,
  createLoadedCatalogStorefrontState,
  createLoadingCatalogStorefrontState,
  createStorefrontEditor,
  defaultLoadStorefrontData,
  defaultPersistStorefrontEdit,
  storefrontUnavailableMessage,
  type CatalogStorefrontEdit,
  type CatalogStorefrontState,
  type LoadCatalogStorefrontData,
  type PersistCatalogStorefrontEdit,
} from "../model/storefront";
import type { CatalogViewModel } from "../model/catalog-view-model";

type UseCatalogStorefrontOptions = {
  shopId: string;
  api: CatalogApi;
  language: SupportedLanguage;
  loadStorefrontData?: LoadCatalogStorefrontData;
  persistStorefrontEdit?: PersistCatalogStorefrontEdit;
};

type UseCatalogStorefrontResult = {
  viewModel: CatalogViewModel;
  storefront?: CatalogStorefrontViewModel;
  handleActivateEditor: (target: CatalogStorefrontEditorTarget) => void;
  handleEditorFieldChange: (name: string, value: string) => void;
  handleCancelEditor: () => void;
  handleSubmitEditor: () => Promise<void>;
};

const ensureTelegramStorefrontSession = async (): Promise<{ telegramId: string | null; authDebugLabel: string | null }> => {
  const bridge = createTelegramWebAppBridge();
  const initData = bridge.getInitData()?.trim() ?? "";

  if (!bridge.isAvailable()) {
    return {
      telegramId: null,
      authDebugLabel: "Telegram bridge unavailable on storefront route.",
    };
  }

  if (initData.length === 0) {
    return {
      telegramId: null,
      authDebugLabel: "Telegram initData missing on storefront route.",
    };
  }

  const response = await fetch("/api/v1/auth/telegram", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    throw new Error(`Telegram storefront auth failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    user?: {
      telegramId?: string;
    };
  };

  return {
    telegramId: typeof payload.user?.telegramId === "string" ? payload.user.telegramId : null,
    authDebugLabel:
      typeof payload.user?.telegramId === "string"
        ? "Telegram storefront auth succeeded."
        : "Telegram storefront auth returned no telegramId.",
  };
};

export const useCatalogStorefront = ({
  shopId,
  api,
  language,
  loadStorefrontData = defaultLoadStorefrontData,
  persistStorefrontEdit = defaultPersistStorefrontEdit,
}: UseCatalogStorefrontOptions): UseCatalogStorefrontResult => {
  const [storefrontState, setStorefrontState] = useState<CatalogStorefrontState>(() => createInitialCatalogStorefrontState());

  useEffect(() => {
    let isActive = true;

    setStorefrontState(createLoadingCatalogStorefrontState());

    let authenticatedTelegramId: string | null = null;
    let authDebugLabel: string | null = null;

    void ensureTelegramStorefrontSession()
      .then((result) => {
        authenticatedTelegramId = result.telegramId;
        authDebugLabel = result.authDebugLabel;
      })
      .catch((error) => {
        authDebugLabel = error instanceof Error ? error.message : "Telegram storefront auth failed.";
      })
      .then(() => loadStorefrontData(shopId, api))
      .then((data) => {
        if (!isActive) {
          return;
        }

        data.currentTelegramId = authenticatedTelegramId;
        data.authDebugLabel = authDebugLabel;

        setStorefrontState(createLoadedCatalogStorefrontState(data));
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setStorefrontState(
          createCatalogStorefrontErrorState(
            error instanceof Error ? error.message : storefrontUnavailableMessage,
          ),
        );
      });

    return () => {
      isActive = false;
    };
  }, [api, loadStorefrontData, shopId]);

  const handleActivateEditor = (target: CatalogStorefrontEditorTarget) => {
    setStorefrontState((currentState) => {
      if (currentState.data === null || !currentState.data.canEdit) {
        return currentState;
      }

      return {
        ...currentState,
        editor: createStorefrontEditor(currentState.data, target),
        successMessage: null,
        saveErrorMessage: null,
      };
    });
  };

  const handleEditorFieldChange = (name: string, value: string) => {
    setStorefrontState((currentState) => {
      if (currentState.editor === null) {
        return currentState;
      }

      return {
        ...currentState,
        editor: {
          ...currentState.editor,
          fields: currentState.editor.fields.map((field) => (field.name === name ? { ...field, value } : field)),
        },
      };
    });
  };

  const handleCancelEditor = () => {
    setStorefrontState((currentState) => ({
      ...currentState,
      editor: null,
      saveErrorMessage: null,
    }));
  };

  const handleSubmitEditor = async () => {
    const currentEditor = storefrontState.editor;
    const currentData = storefrontState.data;

    if (currentEditor === null || currentData === null || storefrontState.isSaving) {
      return;
    }

    setStorefrontState((currentState) => ({
      ...currentState,
      isSaving: true,
      successMessage: null,
      saveErrorMessage: null,
    }));

    try {
      const edit: CatalogStorefrontEdit = {
        shopId,
        target: currentEditor.target,
        fields: currentEditor.fields,
      };
      const result = await persistStorefrontEdit(edit, currentData, api);
      const reloadedData = await loadStorefrontData(shopId, api);
      reloadedData.currentTelegramId = currentData.currentTelegramId;
      reloadedData.authDebugLabel = currentData.authDebugLabel;

      setStorefrontState((currentState) => {
        if (currentState.data === null) {
          return currentState;
        }

        return {
          ...currentState,
          data: reloadedData,
          editor: null,
          isSaving: false,
          successMessage: result.confirmationMessage,
          saveErrorMessage: null,
        };
      });
    } catch (error) {
      setStorefrontState((currentState) => ({
        ...currentState,
        isSaving: false,
        saveErrorMessage: error instanceof Error ? error.message : "Storefront save failed.",
      }));
    }
  };

  return {
    viewModel: buildStorefrontCatalogViewModel(storefrontState, language),
    storefront: buildStorefrontViewModel(storefrontState),
    handleActivateEditor,
    handleEditorFieldChange,
    handleCancelEditor,
    handleSubmitEditor,
  };
};
