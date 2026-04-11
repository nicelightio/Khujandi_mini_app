import { SellerPageShell } from "./seller-page-shell";
import type { SellerShopStatusRecord } from "../api/seller-shop-status-api";

type SellerShopStatusPageProps = {
  shops: SellerShopStatusRecord[];
  selectedShopId: string;
  selectedStatus: "WORKING" | "NOT_WORKING";
  isLoading: boolean;
  isSubmitting: boolean;
  statusMessage: string;
  successMessage: string | null;
  errorMessage: string | null;
  onShopChange: (shopId: string) => void;
  onStatusChange: (status: "WORKING" | "NOT_WORKING") => void;
  onSubmit: () => void;
};

export const SellerShopStatusPage = ({
  shops,
  selectedShopId,
  selectedStatus,
  isLoading,
  isSubmitting,
  statusMessage,
  successMessage,
  errorMessage,
  onShopChange,
  onStatusChange,
  onSubmit,
}: SellerShopStatusPageProps) => (
  <SellerPageShell title="Shop status control">
    <section aria-live="polite" data-seller-status="summary">
      <p>{statusMessage}</p>
      <p>This contour stays narrow and separate from the shared storefront tree.</p>
      <p>Seller access reuses the Telegram-linked session family. No separate seller password exists.</p>
      {successMessage !== null ? <p role="status">{successMessage}</p> : null}
      {errorMessage !== null ? <p role="alert">{errorMessage}</p> : null}
    </section>

    {shops.length === 0 ? null : (
      <form
        data-seller-status="form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <fieldset disabled={isLoading || isSubmitting}>
          <label>
            Owned shop
            <select value={selectedShopId} onChange={(event) => onShopChange(event.target.value)}>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name} ({shop.status})
                </option>
              ))}
            </select>
          </label>
          <label>
            Visibility status
            <select
              value={selectedStatus}
              onChange={(event) => onStatusChange(event.target.value as "WORKING" | "NOT_WORKING")}
            >
              <option value="WORKING">WORKING</option>
              <option value="NOT_WORKING">NOT_WORKING</option>
            </select>
          </label>
        </fieldset>

        <button type="submit" disabled={isLoading || isSubmitting}>
          {isSubmitting ? "Saving status..." : "Save status"}
        </button>
      </form>
    )}
  </SellerPageShell>
);
