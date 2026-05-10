-- Durable actor metadata for operator/admin status history rows.
-- Nullable and additive: existing history rows remain readable without backfill.
ALTER TABLE "OrderStatusHistory"
  ADD COLUMN "changedByRole" TEXT,
  ADD COLUMN "changedByName" TEXT;
