import { useEffect, useState } from "react";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import type { TelegramWebAppBridge } from "../../../shared/telegram/webapp";
import type { CatalogApi } from "../api/catalog-api";
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
  type CatalogStorefrontEditorTarget,
  type CatalogStorefrontState,
  type CatalogStorefrontViewModel,
  type LoadCatalogStorefrontData,
  type PersistCatalogStorefrontEdit,
} from "../model/storefront";
import type { CatalogViewModel } from "../model/catalog-view-model";

type UseCatalogStorefrontOptions = {
  shopId: string;
  api: CatalogApi;
  language: SupportedLanguage;
  telegramBridge?: TelegramWebAppBridge;
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

const appendDebugLog = (currentLogs: string[] | undefined, line: string): string[] =>
  [...(Array.isArray(currentLogs) ? currentLogs : []), `${new Date().toISOString()} ${line}`].slice(-40);

const summarizeStringValue = (value: string | null | undefined): string => {
  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  return `len=${value.length} prefix=${value.slice(0, 48)}`;
};

const ensureTelegramStorefrontSession = async (
  bridge?: TelegramWebAppBridge,
): Promise<{ telegramId: string | null; authDebugLabel: string | null }> => {
  if (bridge === undefined) {
    return {
      telegramId: null,
      authDebugLabel: "Telegram bridge unavailable on storefront route.",
    };
  }

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
  telegramBridge,
  loadStorefrontData = defaultLoadStorefrontData,
  persistStorefrontEdit = defaultPersistStorefrontEdit,
}: UseCatalogStorefrontOptions): UseCatalogStorefrontResult => {
  const [storefrontState, setStorefrontState] = useState<CatalogStorefrontState>(() => createInitialCatalogStorefrontState());

  useEffect(() => {
    let isActive = true;

    setStorefrontState(createLoadingCatalogStorefrontState());

    let authenticatedTelegramId: string | null = null;
    let authDebugLabel: string | null = null;

    void ensureTelegramStorefrontSession(telegramBridge)
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
        data.debugLogs = appendDebugLog(
          data.debugLogs,
          `load resolved shop=${data.shop.id} canEdit=${String(data.canEdit)} header=${summarizeStringValue(data.shop.headerImageUrl)} background=${summarizeStringValue(data.shop.backgroundImageUrl)}`,
        );

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
  }, [api, loadStorefrontData, shopId, telegramBridge]);

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
        data: {
          ...currentState.data,
          debugLogs: appendDebugLog(currentState.data.debugLogs, `editor opened target=${target.type}`),
        },
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
        data:
          currentState.data === null
            ? currentState.data
            : {
                ...currentState.data,
                debugLogs: appendDebugLog(currentState.data.debugLogs, `editor field changed ${name}=${summarizeStringValue(value)}`),
              },
      };
    });
  };

  const handleCancelEditor = () => {
    setStorefrontState((currentState) => ({
      ...currentState,
      editor: null,
      saveErrorMessage: null,
      data:
        currentState.data === null
          ? currentState.data
          : {
              ...currentState.data,
              debugLogs: appendDebugLog(currentState.data.debugLogs, "editor cancelled"),
            },
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
      setStorefrontState((currentState) => {
        if (currentState.data === null) {
          return currentState;
        }

        return {
          ...currentState,
          data: {
            ...currentState.data,
            debugLogs: appendDebugLog(
              currentState.data.debugLogs,
              `submit target=${currentEditor.target.type} header=${summarizeStringValue(currentEditor.fields.find((field) => field.name === "headerImageUrl")?.value)} background=${summarizeStringValue(currentEditor.fields.find((field) => field.name === "backgroundImageUrl")?.value)}`,
            ),
          },
        };
      });
      const result = await persistStorefrontEdit(edit, currentData, api);
      const reloadedData = await loadStorefrontData(shopId, api);
      reloadedData.currentTelegramId = currentData.currentTelegramId;
      reloadedData.authDebugLabel = currentData.authDebugLabel;
      reloadedData.debugLogs = appendDebugLog(
        [...currentData.debugLogs, ...reloadedData.debugLogs],
        `reload after save header=${summarizeStringValue(reloadedData.shop.headerImageUrl)} background=${summarizeStringValue(reloadedData.shop.backgroundImageUrl)}`,
      );

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
        data:
          currentState.data === null
            ? currentState.data
            : {
                ...currentState.data,
                debugLogs: appendDebugLog(currentState.data.debugLogs, `save failed ${error instanceof Error ? error.message : "Storefront save failed."}`),
              },
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
