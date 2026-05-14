-- Normalize the historical MANAGER alias into the canonical OPERATOR role.
-- PostgreSQL cannot drop an enum value directly, so recreate UserRole and cast
-- every dependent column through text with MANAGER mapped to OPERATOR.

ALTER TYPE "UserRole" RENAME TO "UserRole_old";

CREATE TYPE "UserRole" AS ENUM (
  'BOSS',
  'OPERATOR',
  'ADMIN',
  'SELLER',
  'COURIER',
  'CLIENT'
);

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole"
  USING (
    CASE
      WHEN "role"::text = 'MANAGER' THEN 'OPERATOR'
      ELSE "role"::text
    END
  )::"UserRole";

ALTER TABLE "OrderCancellationAudit"
  ALTER COLUMN "actorRole" TYPE "UserRole"
  USING (
    CASE
      WHEN "actorRole"::text = 'MANAGER' THEN 'OPERATOR'
      ELSE "actorRole"::text
    END
  )::"UserRole";

ALTER TABLE "AdminAccount"
  ALTER COLUMN "role" TYPE "UserRole"
  USING (
    CASE
      WHEN "role"::text = 'MANAGER' THEN 'OPERATOR'
      ELSE "role"::text
    END
  )::"UserRole";

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CLIENT';

DROP TYPE "UserRole_old";
