import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdminStaffApiError,
  createAdminStaffApi,
  type AdminStaffApi,
  type AdminCourierStaffCard,
  type AdminOperatorStaffCard,
  type AdminStaffRatingDelta,
  type AdminStaffTablesResult,
} from "../api/admin-staff-api";
import {
  AdminStaffPage,
  type AdminStaffCreateCourierFormValue,
  type AdminStaffCreateOperatorFormValue,
  type AdminStaffDetailSelection,
  type AdminStaffDetailView,
  type AdminStaffOneTimePasswordNotice,
  type AdminStaffTab,
} from "../components/admin-staff-page";

type AdminStaffRouteProps = {
  role: "admin" | "boss";
  api?: AdminStaffApi;
  loadStaffTables?: (input: { includeInactive: boolean }) => Promise<AdminStaffTablesResult>;
};

type AdminStaffLoadState =
  | {
      status: "loading";
      tables: AdminStaffTablesResult;
      errorMessage: null;
    }
  | {
      status: "ready";
      tables: AdminStaffTablesResult;
      errorMessage: null;
    }
  | {
      status: "error";
      tables: AdminStaffTablesResult;
      errorMessage: string;
    };

type AdminStaffDetailLoadState =
  | {
      status: "idle";
      selection: null;
      detail: null;
      errorMessage: null;
    }
  | {
      status: "loading";
      selection: AdminStaffDetailSelection;
      detail: null;
      errorMessage: null;
    }
  | {
      status: "ready";
      selection: AdminStaffDetailSelection;
      detail: AdminStaffDetailView;
      errorMessage: null;
    }
  | {
      status: "error";
      selection: AdminStaffDetailSelection;
      detail: null;
      errorMessage: string;
    };

const emptyStaffTables: AdminStaffTablesResult = {
  couriers: [],
  operators: [],
};

const initialCreateCourierForm: AdminStaffCreateCourierFormValue = {
  telegramUserId: "",
  nickname: "",
};

const initialCreateOperatorForm: AdminStaffCreateOperatorFormValue = {
  email: "",
  nickname: "",
  password: "",
};

const commandErrorMessage = (error: unknown): string =>
  error instanceof AdminStaffApiError || error instanceof Error
    ? error.message
    : "Команда Staff panel временно недоступна.";

const detailErrorMessage = (error: unknown): string =>
  error instanceof AdminStaffApiError || error instanceof Error
    ? error.message
    : "Карточка Staff panel временно недоступна.";

const toOperatorNicknameDrafts = (tables: AdminStaffTablesResult): Record<string, string> =>
  Object.fromEntries(
    tables.operators.map((operator) => [
      operator.operatorAdminAccountId,
      operator.nickname ?? "",
    ]),
  );

export const AdminStaffRoute = ({ role, api, loadStaffTables }: AdminStaffRouteProps) => {
  const staffApi = useRef(api ?? createAdminStaffApi());
  const commandInFlight = useRef(false);
  const detailRequestId = useRef(0);
  const [activeTab, setActiveTab] = useState<AdminStaffTab>("couriers");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loadState, setLoadState] = useState<AdminStaffLoadState>({
    status: "loading",
    tables: emptyStaffTables,
    errorMessage: null,
  });
  const [createCourierForm, setCreateCourierForm] = useState<AdminStaffCreateCourierFormValue>(
    initialCreateCourierForm,
  );
  const [createOperatorForm, setCreateOperatorForm] = useState<AdminStaffCreateOperatorFormValue>(
    initialCreateOperatorForm,
  );
  const [operatorNicknameDrafts, setOperatorNicknameDrafts] = useState<Record<string, string>>({});
  const [operatorPasswordDrafts, setOperatorPasswordDrafts] = useState<Record<string, string>>({});
  const [isCommandSubmitting, setIsCommandSubmitting] = useState(false);
  const [commandSuccessMessage, setCommandSuccessMessage] = useState<string | null>(null);
  const [commandErrorMessageState, setCommandErrorMessageState] = useState<string | null>(null);
  const [oneTimePasswordNotice, setOneTimePasswordNotice] = useState<AdminStaffOneTimePasswordNotice | null>(null);
  const [detailState, setDetailState] = useState<AdminStaffDetailLoadState>({
    status: "idle",
    selection: null,
    detail: null,
    errorMessage: null,
  });
  const loadTables = useCallback(
    (nextIncludeInactive: boolean) =>
      (loadStaffTables ?? ((input) => staffApi.current.listStaffTables(input)))({
        includeInactive: nextIncludeInactive,
      }),
    [loadStaffTables],
  );
  const applyTables = useCallback((tables: AdminStaffTablesResult) => {
    setLoadState({
      status: "ready",
      tables,
      errorMessage: null,
    });
    setOperatorNicknameDrafts(toOperatorNicknameDrafts(tables));
    setOperatorPasswordDrafts((currentDrafts) => {
      const operatorIds = new Set(tables.operators.map((operator) => operator.operatorAdminAccountId));

      return Object.fromEntries(
        Object.entries(currentDrafts).filter(([operatorAdminAccountId]) =>
          operatorIds.has(operatorAdminAccountId),
        ),
      );
    });
  }, []);
  const refreshCurrentTables = useCallback(async () => {
    const tables = await loadTables(role === "boss" && includeInactive);
    applyTables(tables);

    return tables;
  }, [applyTables, includeInactive, loadTables, role]);

  const loadCourierDetail = useCallback(
    async (courierUserId: string, requestId: number): Promise<AdminCourierStaffCard | null> => {
      const detail = await staffApi.current.getCourierCard({
        courierUserId,
        includeInactive: role === "boss" && includeInactive,
      });

      return detailRequestId.current === requestId ? detail : null;
    },
    [includeInactive, role],
  );

  const loadOperatorDetail = useCallback(
    async (operatorAdminAccountId: string, requestId: number): Promise<AdminOperatorStaffCard | null> => {
      const detail = await staffApi.current.getOperatorCard({
        operatorAdminAccountId,
        includeInactive: role === "boss" && includeInactive,
      });

      return detailRequestId.current === requestId ? detail : null;
    },
    [includeInactive, role],
  );

  const openDetail = useCallback(
    (selection: AdminStaffDetailSelection) => {
      const requestId = detailRequestId.current + 1;
      detailRequestId.current = requestId;
      setDetailState({
        status: "loading",
        selection,
        detail: null,
        errorMessage: null,
      });

      const detailPromise =
        selection.kind === "courier"
          ? loadCourierDetail(selection.staffId, requestId).then((detail): AdminStaffDetailView | null =>
              detail === null
                ? null
                : {
                    kind: "courier",
                    detail,
                  },
            )
          : loadOperatorDetail(selection.staffId, requestId).then((detail): AdminStaffDetailView | null =>
              detail === null
                ? null
                : {
                    kind: "operator",
                    detail,
                  },
            );

      void detailPromise.then(
        (detail) => {
          if (detail === null || detailRequestId.current !== requestId) {
            return;
          }

          setDetailState({
            status: "ready",
            selection,
            detail,
            errorMessage: null,
          });
        },
        (error) => {
          if (detailRequestId.current !== requestId) {
            return;
          }

          setDetailState({
            status: "error",
            selection,
            detail: null,
            errorMessage: detailErrorMessage(error),
          });
        },
      );
    },
    [loadCourierDetail, loadOperatorDetail],
  );

  useEffect(() => {
    if (role !== "boss" && includeInactive) {
      setIncludeInactive(false);
    }
  }, [includeInactive, role]);

  useEffect(() => {
    let isActive = true;
    const nextIncludeInactive = role === "boss" && includeInactive;

    setLoadState({
      status: "loading",
      tables: emptyStaffTables,
      errorMessage: null,
    });

    void loadTables(nextIncludeInactive)
      .then((tables) => {
        if (!isActive) {
          return;
        }

        applyTables(tables);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        const message =
          error instanceof AdminStaffApiError || error instanceof Error
            ? error.message
            : "Таблицы Staff panel временно недоступны.";
        setLoadState({
          status: "error",
          tables: emptyStaffTables,
          errorMessage: message,
        });
      });

    return () => {
      isActive = false;
    };
  }, [applyTables, includeInactive, loadTables, role]);

  const runCommand = async <TResult,>(
    command: () => Promise<TResult>,
    onSuccess: (result: TResult) => void,
  ) => {
    if (commandInFlight.current) {
      return;
    }

    commandInFlight.current = true;
    setIsCommandSubmitting(true);
    setCommandSuccessMessage(null);
    setCommandErrorMessageState(null);
    setOneTimePasswordNotice(null);

    try {
      const result = await command();
      await refreshCurrentTables();
      onSuccess(result);
    } catch (error) {
      setCommandErrorMessageState(commandErrorMessage(error));
    } finally {
      commandInFlight.current = false;
      setIsCommandSubmitting(false);
    }
  };

  const handleCreateCourierChange = <TKey extends keyof AdminStaffCreateCourierFormValue>(
    field: TKey,
    nextValue: AdminStaffCreateCourierFormValue[TKey],
  ) => {
    setCreateCourierForm((currentValue) => ({
      ...currentValue,
      [field]: nextValue,
    }));
  };

  const handleCreateOperatorChange = <TKey extends keyof AdminStaffCreateOperatorFormValue>(
    field: TKey,
    nextValue: AdminStaffCreateOperatorFormValue[TKey],
  ) => {
    setCreateOperatorForm((currentValue) => ({
      ...currentValue,
      [field]: nextValue,
    }));
  };

  const handleCreateCourier = () => {
    void runCommand(
      () =>
        staffApi.current.createCourier({
          telegramUserId: createCourierForm.telegramUserId.trim(),
          nickname: createCourierForm.nickname.trim(),
        }),
      () => {
        setCreateCourierForm(initialCreateCourierForm);
        setCommandSuccessMessage("Курьер добавлен в Staff panel.");
      },
    );
  };

  const handleCreateOperator = () => {
    const email = createOperatorForm.email.trim();
    const nickname = createOperatorForm.nickname.trim();

    void runCommand(
      () =>
        staffApi.current.createOperator({
          email,
          nickname,
          password: createOperatorForm.password,
        }),
      (result) => {
        setCreateOperatorForm(initialCreateOperatorForm);
        setCommandSuccessMessage("Оператор добавлен в Staff panel.");
        setOneTimePasswordNotice({
          label: email,
          value: result.oneTimePassword,
        });
      },
    );
  };

  const handleOpenCourierDetail = (courierUserId: string) => {
    openDetail({
      kind: "courier",
      staffId: courierUserId,
    });
  };

  const handleOpenOperatorDetail = (operatorAdminAccountId: string) => {
    openDetail({
      kind: "operator",
      staffId: operatorAdminAccountId,
    });
  };

  const handleCloseDetail = () => {
    detailRequestId.current += 1;
    setDetailState({
      status: "idle",
      selection: null,
      detail: null,
      errorMessage: null,
    });
  };

  const handleDeactivateCourier = (courierUserId: string) => {
    void runCommand(
      () =>
        staffApi.current.deactivateCourier({
          courierUserId,
          reason: null,
        }),
      () => {
        setCommandSuccessMessage("Курьер деактивирован.");
      },
    );
  };

  const handleDeactivateOperator = (operatorAdminAccountId: string) => {
    void runCommand(
      () =>
        staffApi.current.deactivateOperator({
          operatorAdminAccountId,
          reason: null,
        }),
      () => {
        setCommandSuccessMessage("Оператор деактивирован.");
      },
    );
  };

  const handleReactivateCourier = (courierUserId: string) => {
    void runCommand(
      () =>
        staffApi.current.reactivateCourier({
          courierUserId,
          reason: null,
        }),
      () => {
        setCommandSuccessMessage("Курьер возвращен из архива.");
      },
    );
  };

  const handleReactivateOperator = (operatorAdminAccountId: string) => {
    void runCommand(
      () =>
        staffApi.current.reactivateOperator({
          operatorAdminAccountId,
          reason: null,
        }),
      () => {
        setCommandSuccessMessage("Оператор возвращен из архива.");
      },
    );
  };

  const handleAdjustCourierRating = (courierUserId: string, delta: AdminStaffRatingDelta) => {
    void runCommand(
      () =>
        staffApi.current.adjustCourierRating({
          courierUserId,
          delta,
          reason: null,
        }),
      () => {
        setCommandSuccessMessage(`Order rating курьера изменен на ${delta > 0 ? "+1" : "-1"}.`);
      },
    );
  };

  const handleAdjustOperatorRating = (operatorAdminAccountId: string, delta: AdminStaffRatingDelta) => {
    void runCommand(
      () =>
        staffApi.current.adjustOperatorRating({
          operatorAdminAccountId,
          delta,
          reason: null,
        }),
      () => {
        setCommandSuccessMessage(`Processed-order rating оператора изменен на ${delta > 0 ? "+1" : "-1"}.`);
      },
    );
  };

  const handleOperatorNicknameDraftChange = (operatorAdminAccountId: string, nickname: string) => {
    setOperatorNicknameDrafts((currentDrafts) => ({
      ...currentDrafts,
      [operatorAdminAccountId]: nickname,
    }));
  };

  const handleOperatorPasswordDraftChange = (operatorAdminAccountId: string, password: string) => {
    setOperatorPasswordDrafts((currentDrafts) => ({
      ...currentDrafts,
      [operatorAdminAccountId]: password,
    }));
  };

  const handleUpdateOperatorNickname = (operatorAdminAccountId: string) => {
    void runCommand(
      () =>
        staffApi.current.updateOperatorNickname({
          operatorAdminAccountId,
          nickname: (operatorNicknameDrafts[operatorAdminAccountId] ?? "").trim(),
        }),
      () => {
        setCommandSuccessMessage("Nickname оператора обновлен.");
      },
    );
  };

  const handleResetOperatorPassword = (operatorAdminAccountId: string) => {
    const operator = loadState.tables.operators.find(
      (candidate) => candidate.operatorAdminAccountId === operatorAdminAccountId,
    );

    void runCommand(
      () =>
        staffApi.current.resetOperatorPassword({
          operatorAdminAccountId,
          password: operatorPasswordDrafts[operatorAdminAccountId] ?? "",
        }),
      (result) => {
        setOperatorPasswordDrafts((currentDrafts) => ({
          ...currentDrafts,
          [operatorAdminAccountId]: "",
        }));
        setCommandSuccessMessage("Пароль оператора сброшен.");
        setOneTimePasswordNotice({
          label: operator?.email ?? operatorAdminAccountId,
          value: result.oneTimePassword,
        });
      },
    );
  };

  const handleDismissOneTimePassword = () => {
    setOneTimePasswordNotice(null);
  };

  const handleCopyOneTimePassword = () => {
    const value = oneTimePasswordNotice?.value;

    if (value === undefined) {
      return;
    }

    if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") {
      setCommandErrorMessageState("Буфер обмена недоступен.");
      return;
    }

    void navigator.clipboard.writeText(value).then(
      () => {
        setCommandSuccessMessage("Одноразовый пароль скопирован.");
        setCommandErrorMessageState(null);
      },
      () => {
        setCommandErrorMessageState("Не удалось скопировать одноразовый пароль.");
      },
    );
  };

  return (
    <AdminStaffPage
      role={role}
      activeTab={activeTab}
      includeInactive={role === "boss" && includeInactive}
      isLoading={loadState.status === "loading"}
      isCommandSubmitting={isCommandSubmitting}
      errorMessage={loadState.errorMessage}
      commandSuccessMessage={commandSuccessMessage}
      commandErrorMessage={commandErrorMessageState}
      oneTimePasswordNotice={oneTimePasswordNotice}
      detailStatus={detailState.status}
      detailSelection={detailState.selection}
      detail={detailState.detail}
      detailErrorMessage={detailState.errorMessage}
      createCourierForm={createCourierForm}
      createOperatorForm={createOperatorForm}
      operatorNicknameDrafts={operatorNicknameDrafts}
      operatorPasswordDrafts={operatorPasswordDrafts}
      couriers={loadState.tables.couriers}
      operators={loadState.tables.operators}
      onTabChange={setActiveTab}
      onIncludeInactiveChange={setIncludeInactive}
      onCreateCourierChange={handleCreateCourierChange}
      onCreateOperatorChange={handleCreateOperatorChange}
      onCreateCourier={handleCreateCourier}
      onCreateOperator={handleCreateOperator}
      onOpenCourierDetail={handleOpenCourierDetail}
      onOpenOperatorDetail={handleOpenOperatorDetail}
      onCloseDetail={handleCloseDetail}
      onDeactivateCourier={handleDeactivateCourier}
      onDeactivateOperator={handleDeactivateOperator}
      onReactivateCourier={handleReactivateCourier}
      onReactivateOperator={handleReactivateOperator}
      onAdjustCourierRating={handleAdjustCourierRating}
      onAdjustOperatorRating={handleAdjustOperatorRating}
      onOperatorNicknameDraftChange={handleOperatorNicknameDraftChange}
      onOperatorPasswordDraftChange={handleOperatorPasswordDraftChange}
      onUpdateOperatorNickname={handleUpdateOperatorNickname}
      onResetOperatorPassword={handleResetOperatorPassword}
      onDismissOneTimePassword={handleDismissOneTimePassword}
      onCopyOneTimePassword={handleCopyOneTimePassword}
    />
  );
};
