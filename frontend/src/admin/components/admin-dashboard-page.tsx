import { routes } from "../../shared/lib/routes";
import { sellerRoutes } from "../../seller/lib/routes";
import { adminRoutes } from "../lib/routes";
import { AdminPageShell } from "./admin-page-shell";

type AdminDashboardRole = "boss" | "operator" | "admin";

type AdminDashboardLink = {
  href: string;
  label: string;
  description: string;
  allowedRoles?: readonly AdminDashboardRole[];
};

const dashboardLinks: readonly AdminDashboardLink[] = [
  { href: adminRoutes.assignment, label: "Назначение курьеров", description: "Распределение заказов и курьеров" },
  { href: adminRoutes.cancellation, label: "Отмена и возвраты", description: "Операционная отмена и ручной возврат" },
  { href: adminRoutes.catalogProvisioning, label: "Создание магазинов", description: "Создание магазинов и привязка продавцов" },
  {
    href: adminRoutes.staff,
    label: "Staff panel",
    description: "Таблицы курьеров и операторов",
    allowedRoles: ["admin", "boss"] as const,
  },
  { href: routes.orderTracking, label: "Слежение за курьером", description: "Безопасный для клиента статус заказа и доставки" },
  { href: sellerRoutes.shopStatus, label: "Панель магазина", description: "Статусы WORKING / NOT_WORKING" },
];

type AdminDashboardPageProps = {
  role?: AdminDashboardRole;
};

export const AdminDashboardPage = ({ role = "admin" }: AdminDashboardPageProps) => {
  const visibleLinks = dashboardLinks.filter(
    (link) => link.allowedRoles === undefined || link.allowedRoles.includes(role),
  );

  return (
    <AdminPageShell title="Главная админки" layout="hero">
      <section data-admin-dashboard="intro">
        <span data-admin-ui="micro-label">Главная страница</span>
        <h2>Все доступные интерфейсы</h2>
        <p>Эта страница собирает операционные панели приложения в одной админке.</p>
      </section>

      <section data-admin-dashboard="links" aria-label="Ссылки админки">
        {visibleLinks.map((link) => (
          <a key={link.href} href={link.href} data-admin-dashboard="link" data-magnetic="true">
            <strong>{link.label}</strong>
            <span>{link.description}</span>
          </a>
        ))}
      </section>
    </AdminPageShell>
  );
};
