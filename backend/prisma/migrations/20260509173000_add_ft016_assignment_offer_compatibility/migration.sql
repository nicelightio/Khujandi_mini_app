-- Additive FT-016 persistence compatibility only: no existing row rewrites.
CREATE TYPE "AssignmentOfferKind" AS ENUM ('MANUAL', 'BROADCAST');
CREATE TYPE "AssignmentOfferStatus" AS ENUM ('PENDING', 'CLAIMED', 'EXPIRED', 'CANCELLED');

ALTER TABLE "User"
  ADD COLUMN "acceptingOrdersUntil" TIMESTAMP(3),
  ADD COLUMN "autoOfferEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ratingScore" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "AssignmentOffer" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "targetCourierId" TEXT,
  "kind" "AssignmentOfferKind" NOT NULL,
  "status" "AssignmentOfferStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AssignmentOffer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssignmentOffer_orderId_status_createdAt_idx"
  ON "AssignmentOffer"("orderId", "status", "createdAt");

CREATE INDEX "AssignmentOffer_targetCourierId_status_createdAt_idx"
  ON "AssignmentOffer"("targetCourierId", "status", "createdAt");

CREATE INDEX "AssignmentOffer_status_createdAt_idx"
  ON "AssignmentOffer"("status", "createdAt");

ALTER TABLE "AssignmentOffer"
  ADD CONSTRAINT "AssignmentOffer_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AssignmentOffer"
  ADD CONSTRAINT "AssignmentOffer_targetCourierId_fkey"
  FOREIGN KEY ("targetCourierId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
