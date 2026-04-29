import { routes } from "../../shared/lib/routes";
import { sellerRoutes } from "../../seller/lib/routes";
import { adminRoutes } from "../lib/routes";
import { AdminPageShell } from "./admin-page-shell";

const dashboardLinks = [
  { href: adminRoutes.assignment, label: "Назначение курьеров", description: "Распределение заказов и курьеров" },
  { href: adminRoutes.cancellation, label: "Отмена и возвраты", description: "Операционная отмена и ручной refund" },
  { href: adminRoutes.catalogProvisioning, label: "Provisioning магазинов", description: "Создание магазинов и привязка seller-ов" },
  { href: routes.orderTracking, label: "Слежение за курьером", description: "Customer-safe статус заказа и доставки" },
  { href: sellerRoutes.shopStatus, label: "Панель магазина", description: "Статусы WORKING / NOT_WORKING" },
] as const;

export const AdminDashboardPage = () => (
  <AdminPageShell title="Admin dashboard" layout="hero">
    <section data-admin-dashboard="intro">
      <span data-admin-ui="micro-label">Main admin page</span>
      <h2>Все доступные интерфейсы</h2>
      <p>Эта страница собирает операционные панели приложения в одной админке.</p>
    </section>

    <section data-admin-dashboard="links" aria-label="Admin interface links">
      {dashboardLinks.map((link) => (
        <a key={link.href} href={link.href} data-admin-dashboard="link" data-magnetic="true">
          <strong>{link.label}</strong>
          <span>{link.description}</span>
        </a>
      ))}
    </section>
  </AdminPageShell>
);
