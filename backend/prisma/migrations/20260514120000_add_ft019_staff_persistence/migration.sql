CREATE TYPE "StaffLifecycleAction" AS ENUM (
  'CREATED',
  'DEACTIVATED',
  'REACTIVATED',
  'NICKNAME_UPDATED'
);

ALTER TABLE "AdminAccount"
  ADD COLUMN "nickname" TEXT,
  ADD COLUMN "staffCreatedAt" TIMESTAMP(3),
  ADD COLUMN "staffCreatedByAdminAccountId" TEXT,
  ADD COLUMN "staffDeactivatedAt" TIMESTAMP(3),
  ADD COLUMN "staffDeactivatedByAdminAccountId" TEXT,
  ADD COLUMN "staffReactivatedAt" TIMESTAMP(3),
  ADD COLUMN "staffReactivatedByAdminAccountId" TEXT;

ALTER TABLE "User"
  ADD COLUMN "staffNickname" TEXT,
  ADD COLUMN "staffCreatedAt" TIMESTAMP(3),
  ADD COLUMN "staffCreatedByAdminAccountId" TEXT,
  ADD COLUMN "staffDeactivatedAt" TIMESTAMP(3),
  ADD COLUMN "staffDeactivatedByAdminAccountId" TEXT,
  ADD COLUMN "staffReactivatedAt" TIMESTAMP(3),
  ADD COLUMN "staffReactivatedByAdminAccountId" TEXT;

CREATE TABLE "OperatorStaffLifecycleEvent" (
  "id" BIGSERIAL NOT NULL,
  "operatorAdminAccountId" TEXT NOT NULL,
  "actorAdminAccountId" TEXT NOT NULL,
  "action" "StaffLifecycleAction" NOT NULL,
  "previousNickname" TEXT,
  "newNickname" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OperatorStaffLifecycleEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourierStaffLifecycleEvent" (
  "id" BIGSERIAL NOT NULL,
  "courierUserId" TEXT NOT NULL,
  "actorAdminAccountId" TEXT NOT NULL,
  "action" "StaffLifecycleAction" NOT NULL,
  "previousNickname" TEXT,
  "newNickname" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CourierStaffLifecycleEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperatorStaffRatingAdjustment" (
  "id" BIGSERIAL NOT NULL,
  "operatorAdminAccountId" TEXT NOT NULL,
  "actorAdminAccountId" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OperatorStaffRatingAdjustment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OperatorStaffRatingAdjustment_delta_check" CHECK ("delta" IN (-1, 1))
);

CREATE TABLE "CourierStaffRatingAdjustment" (
  "id" BIGSERIAL NOT NULL,
  "courierUserId" TEXT NOT NULL,
  "actorAdminAccountId" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CourierStaffRatingAdjustment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CourierStaffRatingAdjustment_delta_check" CHECK ("delta" IN (-1, 1))
);

CREATE INDEX "AdminAccount_role_staffDeactivatedAt_idx"
  ON "AdminAccount"("role", "staffDeactivatedAt");
CREATE INDEX "AdminAccount_staffCreatedByAdminAccountId_idx"
  ON "AdminAccount"("staffCreatedByAdminAccountId");

CREATE INDEX "User_role_staffDeactivatedAt_idx"
  ON "User"("role", "staffDeactivatedAt");
CREATE INDEX "User_staffCreatedByAdminAccountId_idx"
  ON "User"("staffCreatedByAdminAccountId");

CREATE INDEX "OperatorStaffLifecycleEvent_operatorAdminAccountId_createdAt_idx"
  ON "OperatorStaffLifecycleEvent"("operatorAdminAccountId", "createdAt");
CREATE INDEX "OperatorStaffLifecycleEvent_actorAdminAccountId_createdAt_idx"
  ON "OperatorStaffLifecycleEvent"("actorAdminAccountId", "createdAt");
CREATE INDEX "OperatorStaffLifecycleEvent_action_createdAt_idx"
  ON "OperatorStaffLifecycleEvent"("action", "createdAt");

CREATE INDEX "CourierStaffLifecycleEvent_courierUserId_createdAt_idx"
  ON "CourierStaffLifecycleEvent"("courierUserId", "createdAt");
CREATE INDEX "CourierStaffLifecycleEvent_actorAdminAccountId_createdAt_idx"
  ON "CourierStaffLifecycleEvent"("actorAdminAccountId", "createdAt");
CREATE INDEX "CourierStaffLifecycleEvent_action_createdAt_idx"
  ON "CourierStaffLifecycleEvent"("action", "createdAt");

CREATE INDEX "OperatorStaffRatingAdjustment_operatorAdminAccountId_createdAt_idx"
  ON "OperatorStaffRatingAdjustment"("operatorAdminAccountId", "createdAt");
CREATE INDEX "OperatorStaffRatingAdjustment_actorAdminAccountId_createdAt_idx"
  ON "OperatorStaffRatingAdjustment"("actorAdminAccountId", "createdAt");

CREATE INDEX "CourierStaffRatingAdjustment_courierUserId_createdAt_idx"
  ON "CourierStaffRatingAdjustment"("courierUserId", "createdAt");
CREATE INDEX "CourierStaffRatingAdjustment_actorAdminAccountId_createdAt_idx"
  ON "CourierStaffRatingAdjustment"("actorAdminAccountId", "createdAt");
