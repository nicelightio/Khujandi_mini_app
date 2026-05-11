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

const buildPublicStorefrontPath = (publicPath: string): string => `/shops/${publicPath}`;
const formatShopStatus = (status: "WORKING" | "NOT_WORKING"): string =>
  status === "WORKING" ? "Работает" : "Не работает";

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
  <AdminPageShell title="Создание магазинов каталога" layout="hero">
    <section aria-live="polite" data-admin-provisioning="summary">
      <span data-admin-ui="micro-label">Статус создания</span>
      <h2>Созданные магазины сразу готовы для продавца.</h2>
      <p>
        Создание магазина поднимает долговечную витрину-заготовку, привязывает продавца из Telegram и выдает публичные пути.
      </p>
      <div data-admin-ui="fact-list">
        <div>
          <span>Список из среды выполнения</span>
          <strong>{isLoadingShops ? "Загружаем созданные магазины..." : `Видно: ${provisionedShops.length}`}</strong>
        </div>
        <div>
          <span>Начальная видимость</span>
          <strong>
            <span data-admin-ui="status-chip" data-admin-status-tone={value.status === "WORKING" ? "success" : "danger"}>
              {formatShopStatus(value.status)}
            </span>
          </strong>
        </div>
        <div>
          <span>Привязка продавца</span>
          <strong>{value.telegramId.trim().length === 0 ? "Ожидает" : value.telegramId}</strong>
        </div>
        <div>
          <span>Стартовый контент</span>
          <strong>Страницы меню и товары</strong>
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
        <legend>Рабочая область создания</legend>
        <label>
          ID продавца
          <input
            name="sellerId"
            value={value.sellerId}
            onChange={(event) => onChange("sellerId", event.target.value)}
          />
        </label>
        <label>
          Telegram ID продавца
          <input
            name="telegramId"
            value={value.telegramId}
            onChange={(event) => onChange("telegramId", event.target.value)}
          />
        </label>
        <label>
          Название магазина
          <input name="name" value={value.name} onChange={(event) => onChange("name", event.target.value)} />
        </label>
        <label>
          Описание
          <textarea
            name="description"
            value={value.description}
            onChange={(event) => onChange("description", event.target.value)}
          />
        </label>
        <label>
          URL картинки шапки
          <input
            name="headerImageUrl"
            value={value.headerImageUrl}
            onChange={(event) => onChange("headerImageUrl", event.target.value)}
          />
        </label>
        <label>
          URL фоновой картинки
          <input
            name="backgroundImageUrl"
            value={value.backgroundImageUrl}
            onChange={(event) => onChange("backgroundImageUrl", event.target.value)}
          />
        </label>
        <label>
          Начальная видимость
          <select value={value.status} onChange={(event) => onChange("status", event.target.value as "WORKING" | "NOT_WORKING")}>
            <option value="WORKING">WORKING</option>
            <option value="NOT_WORKING">NOT_WORKING</option>
          </select>
        </label>
      </fieldset>

      <button type="submit" data-magnetic="true" disabled={isSubmitting}>
        {isSubmitting ? "Создаем магазин..." : "Создать магазин"}
      </button>
    </form>

    <section aria-live="polite" data-admin-provisioning="shops-list">
      <div data-admin-provisioning="shops-header">
        <div>
          <span data-admin-ui="micro-label">Среда каталога</span>
          <h2>Созданные магазины</h2>
        </div>
        <span data-admin-ui="status-chip" data-admin-status-tone="accent">
          {isLoadingShops ? "Загрузка" : `Магазинов: ${provisionedShops.length}`}
        </span>
      </div>
      {isLoadingShops ? <p>Загружаем созданные магазины...</p> : null}
      {!isLoadingShops && provisionedShops.length === 0 ? (
        <p>Магазины еще не созданы. Создайте первую витрину-заготовку через форму выше.</p>
      ) : null}
      {provisionedShops.length > 0 ? (
        <ul data-admin-provisioning="shop-cards">
          {provisionedShops.map((shop) => (
            <li key={shop.shopId} data-admin-provisioning="shop-card">
              <div data-admin-provisioning="shop-card-main">
                <div>
                  <span data-admin-ui="micro-label">Магазин</span>
                  <h3>{shop.shopName}</h3>
                </div>
                <span data-admin-ui="status-chip" data-admin-status-tone={shop.status === "WORKING" ? "success" : "danger"}>
                  {formatShopStatus(shop.status)}
                </span>
              </div>

              <dl data-admin-provisioning="shop-facts">
                <div>
                  <dt>Продавец</dt>
                  <dd>{shop.sellerId}</dd>
                </div>
                <div>
                  <dt>Telegram</dt>
                  <dd>{shop.telegramId === null ? "Не привязан" : shop.telegramId}</dd>
                </div>
              </dl>

              <div data-admin-provisioning="paths" aria-label={`Публичные пути storefront для ${shop.shopName}`}>
                <a href={buildPublicStorefrontPath(shop.secondaryPublicPath)}>{shop.secondaryPublicPath}</a>
                <a href={buildPublicStorefrontPath(shop.primaryPublicPath)}>{shop.primaryPublicPath}</a>
              </div>
              <p data-admin-provisioning="paths-summary">{`${shop.secondaryPublicPath} / ${shop.primaryPublicPath}`}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  </AdminPageShell>
);
