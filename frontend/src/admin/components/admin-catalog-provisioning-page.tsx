import { AdminPageShell } from "./admin-page-shell";
import type { AdminProvisionedShopSummary } from "../api/admin-catalog-provisioning-api";

export type AdminCatalogProvisioningFormValue = {
  sellerId: string;
  telegramId: string;
  name: string;
  description: string;
  headerImageUrl: string;
  backgroundImageUrl: string;
  status: "WORKING" | "NOT_WORKING";
};

type AdminCatalogProvisioningPageProps = {
  value: AdminCatalogProvisioningFormValue;
  isSubmitting: boolean;
  isLoadingShops: boolean;
  successMessage: string | null;
  errorMessage: string | null;
  shopsErrorMessage: string | null;
  provisionedShops: AdminProvisionedShopSummary[];
  onChange: <TKey extends keyof AdminCatalogProvisioningFormValue>(
    field: TKey,
    nextValue: AdminCatalogProvisioningFormValue[TKey],
  ) => void;
  onSubmit: () => void;
};

export const AdminCatalogProvisioningPage = ({
  value,
  isSubmitting,
  isLoadingShops,
  successMessage,
  errorMessage,
  shopsErrorMessage,
  provisionedShops,
  onChange,
  onSubmit,
}: AdminCatalogProvisioningPageProps) => (
  <AdminPageShell title="Catalog shop provisioning">
    <section aria-live="polite" data-admin-provisioning="summary">
      <span data-admin-ui="micro-label">Provisioning status</span>
      <p>Protected admin session is provided by the shared admin-access boundary.</p>
      <p>This form provisions a skeleton shop and binds one Telegram-linked seller identity.</p>
      <div data-admin-ui="fact-list">
        <div>
          <span>Runtime list</span>
          <strong>{isLoadingShops ? "Loading provisioned shops..." : `${provisionedShops.length} visible`}</strong>
        </div>
        <div>
          <span>Initial visibility</span>
          <strong>
            <span data-admin-ui="status-chip" data-admin-status-tone={value.status === "WORKING" ? "success" : "danger"}>
              {value.status}
            </span>
          </strong>
        </div>
        <div>
          <span>Seller binding</span>
          <strong>{value.telegramId.trim().length === 0 ? "Pending" : value.telegramId}</strong>
        </div>
      </div>
      {successMessage !== null ? <p role="status">{successMessage}</p> : null}
      {errorMessage !== null ? <p role="alert">{errorMessage}</p> : null}
      {shopsErrorMessage !== null ? <p role="alert">{shopsErrorMessage}</p> : null}
    </section>

    <form
      data-admin-provisioning="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      >
      <fieldset disabled={isSubmitting}>
        <legend>Provisioning workspace</legend>
        <label>
          Seller ID
          <input
            name="sellerId"
            value={value.sellerId}
            onChange={(event) => onChange("sellerId", event.target.value)}
          />
        </label>
        <label>
          Seller Telegram ID
          <input
            name="telegramId"
            value={value.telegramId}
            onChange={(event) => onChange("telegramId", event.target.value)}
          />
        </label>
        <label>
          Shop name
          <input name="name" value={value.name} onChange={(event) => onChange("name", event.target.value)} />
        </label>
        <label>
          Description
          <textarea
            name="description"
            value={value.description}
            onChange={(event) => onChange("description", event.target.value)}
          />
        </label>
        <label>
          Header image URL
          <input
            name="headerImageUrl"
            value={value.headerImageUrl}
            onChange={(event) => onChange("headerImageUrl", event.target.value)}
          />
        </label>
        <label>
          Background image URL
          <input
            name="backgroundImageUrl"
            value={value.backgroundImageUrl}
            onChange={(event) => onChange("backgroundImageUrl", event.target.value)}
          />
        </label>
        <label>
          Initial visibility
          <select value={value.status} onChange={(event) => onChange("status", event.target.value as "WORKING" | "NOT_WORKING")}>
            <option value="WORKING">WORKING</option>
            <option value="NOT_WORKING">NOT_WORKING</option>
          </select>
        </label>
      </fieldset>

      <button type="submit" data-magnetic="true" disabled={isSubmitting}>
        {isSubmitting ? "Provisioning shop..." : "Provision shop"}
      </button>
    </form>

    <section aria-live="polite" data-admin-provisioning="shops-list">
      <h2>Provisioned shops</h2>
      {isLoadingShops ? <p>Loading provisioned shops...</p> : null}
      {!isLoadingShops && provisionedShops.length === 0 ? <p>No shops have been provisioned yet.</p> : null}
      {provisionedShops.length > 0 ? (
        <table data-admin-ui="table">
          <thead>
            <tr>
              <th scope="col">Shop</th>
              <th scope="col">Visibility</th>
              <th scope="col">Seller</th>
              <th scope="col">Telegram</th>
              <th scope="col">Paths</th>
            </tr>
          </thead>
          <tbody>
            {provisionedShops.map((shop) => (
              <tr key={shop.shopId}>
                <td>{shop.shopName}</td>
                <td>
                  <span data-admin-ui="status-chip" data-admin-status-tone={shop.status === "WORKING" ? "success" : "danger"}>
                    {shop.status}
                  </span>
                </td>
                <td>{shop.sellerId}</td>
                <td>{shop.telegramId === null ? "Unbound" : shop.telegramId}</td>
                <td>{`${shop.secondaryPublicPath} / ${shop.primaryPublicPath}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  </AdminPageShell>
);
