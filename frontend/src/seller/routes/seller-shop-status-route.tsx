import { useEffect, useRef, useState } from "react";
import {
  SellerShopStatusApiError,
  createSellerShopStatusApi,
  type SellerShopStatusApi,
  type SellerShopStatusRecord,
} from "../api/seller-shop-status-api";
import { SellerShopStatusPage } from "../components/seller-shop-status-page";

type SellerShopStatusRouteProps = {
  api?: SellerShopStatusApi;
};

const getInitialStatus = (shops: SellerShopStatusRecord[]): "WORKING" | "NOT_WORKING" =>
  shops[0]?.status ?? "WORKING";

export const SellerShopStatusRoute = ({ api }: SellerShopStatusRouteProps) => {
  const sellerApi = useRef(api ?? createSellerShopStatusApi());
  const [shops, setShops] = useState<SellerShopStatusRecord[]>([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"WORKING" | "NOT_WORKING">("WORKING");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Loading owned seller shops...");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void sellerApi.current
      .listOwnedShops()
      .then((ownedShops) => {
        if (!isActive) {
          return;
        }

        setShops(ownedShops);
        setSelectedShopId(ownedShops[0]?.id ?? "");
        setSelectedStatus(getInitialStatus(ownedShops));
        setStatusMessage(
          ownedShops.length === 0
            ? "No owned shops are available for seller-web status control."
            : "Choose one owned shop and toggle WORKING or NOT_WORKING without opening a second storefront.",
        );
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        if (error instanceof SellerShopStatusApiError && error.code === "AUTH_REQUIRED") {
          setStatusMessage("Seller status control requires an authenticated Telegram-linked session.");
          setErrorMessage(error.message);
          return;
        }

        if (error instanceof SellerShopStatusApiError && error.code === "FORBIDDEN") {
          setStatusMessage("Seller-web stays closed until this Telegram account is provisioned for an owned shop.");
          setErrorMessage(error.message);
          return;
        }

        setStatusMessage("Seller shop status is temporarily unavailable.");
        setErrorMessage(error instanceof Error ? error.message : "Seller shop status is temporarily unavailable.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleShopChange = (shopId: string) => {
    const nextShop = shops.find((shop) => shop.id === shopId);

    setSelectedShopId(shopId);
    setSelectedStatus(nextShop?.status ?? "WORKING");
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    const selectedShop = shops.find((shop) => shop.id === selectedShopId);

    if (selectedShop === undefined || isLoading || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const updatedShop = await sellerApi.current.updateShopStatus({
        id: selectedShop.id,
        status: selectedStatus,
      });

      setShops((currentShops) =>
        currentShops.map((shop) => (shop.id === updatedShop.id ? updatedShop : shop)),
      );
      setSelectedStatus(updatedShop.status);
      setSuccessMessage(`Shop ${updatedShop.name} is now ${updatedShop.status}. Public visibility updates from the same owned shop record.`);
    } catch (error) {
      setErrorMessage(
        error instanceof SellerShopStatusApiError || error instanceof Error
          ? error.message
          : "Seller shop status is temporarily unavailable.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SellerShopStatusPage
      shops={shops}
      selectedShopId={selectedShopId}
      selectedStatus={selectedStatus}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      statusMessage={statusMessage}
      successMessage={successMessage}
      errorMessage={errorMessage}
      onShopChange={handleShopChange}
      onStatusChange={setSelectedStatus}
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
};
