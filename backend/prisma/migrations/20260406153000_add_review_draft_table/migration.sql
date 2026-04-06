CREATE TABLE "ReviewDraft" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "actorTelegramId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "targetRole" "ReviewTargetRole" NOT NULL,
    "expectedStage" TEXT NOT NULL,
    "expectedRevision" TEXT NOT NULL,
    "rating" INTEGER,
    "reasonCode" TEXT,
    "submittedReviewId" TEXT,
    "submittedRevision" TEXT,
    "submittedComment" TEXT,
    "submittedCreatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReviewDraft_orderId_actorUserId_direction_key"
ON "ReviewDraft"("orderId", "actorUserId", "direction");

CREATE INDEX "ReviewDraft_actorUserId_expiresAt_idx"
ON "ReviewDraft"("actorUserId", "expiresAt");

CREATE INDEX "ReviewDraft_expiresAt_idx"
ON "ReviewDraft"("expiresAt");
