import { useRef, useState } from "react";
import {
  AdminCatalogProvisioningApiError,
  createAdminCatalogProvisioningApi,
  type AdminCatalogProvisioningApi,
} from "../api/admin-catalog-provisioning-api";
import {
  AdminCatalogProvisioningPage,
  type AdminCatalogProvisioningFormValue,
} from "../components/admin-catalog-provisioning-page";

const initialFormValue: AdminCatalogProvisioningFormValue = {
  sellerId: "",
  telegramId: "",
  name: "",
  description: "",
  headerImageUrl: "",
  backgroundImageUrl: "",
  status: "WORKING",
};

type AdminCatalogProvisioningRouteProps = {
  api?: AdminCatalogProvisioningApi;
};

const normalizeOptionalString = (value: string): string | null => {
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
};

export const AdminCatalogProvisioningRoute = ({ api }: AdminCatalogProvisioningRouteProps) => {
  const provisioningApi = useRef(api ?? createAdminCatalogProvisioningApi());
  const [value, setValue] = useState<AdminCatalogProvisioningFormValue>(initialFormValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = <TKey extends keyof AdminCatalogProvisioningFormValue>(
    field: TKey,
    nextValue: AdminCatalogProvisioningFormValue[TKey],
  ) => {
    setValue((currentValue) => ({
      ...currentValue,
      [field]: nextValue,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const result = await provisioningApi.current.submitProvisioning({
        sellerId: value.sellerId.trim(),
        telegramId: value.telegramId.trim(),
        name: value.name.trim(),
        description: normalizeOptionalString(value.description),
        headerImageUrl: normalizeOptionalString(value.headerImageUrl),
        backgroundImageUrl: normalizeOptionalString(value.backgroundImageUrl),
        status: value.status,
      });

      setSuccessMessage(
        `Provisioned ${result.shopName} (${result.shopStatus}) for seller ${result.sellerId}. Starter pages: ${result.menuPagesCount}. Starter products: ${result.productsCount}.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof AdminCatalogProvisioningApiError || error instanceof Error
          ? error.message
          : "Shop provisioning is temporarily unavailable.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminCatalogProvisioningPage
      value={value}
      isSubmitting={isSubmitting}
      successMessage={successMessage}
      errorMessage={errorMessage}
      onChange={handleChange}
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
};
