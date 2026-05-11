import { AdminPageShell } from "./admin-page-shell";

export const AdminUnknownRoute = () => (
  <AdminPageShell title="Страница админки не найдена">
    <section>
      <p>Неизвестный путь admin-web. Используйте только явные маршруты админки.</p>
      <p>Вернитесь к назначениям, отменам, созданию магазинов или странице входа.</p>
    </section>
  </AdminPageShell>
);
