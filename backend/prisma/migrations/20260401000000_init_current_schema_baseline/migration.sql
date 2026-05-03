-- Baseline migration for bootstrapping a blank PostgreSQL database to the
-- current pre-ReviewDraft schema. Later migrations add ReviewDraft and
-- Shop(sellerId, name) uniqueness.

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED_BY_ADMIN', 'CANCELLED_BY_COURIER_UNAVAILABLE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'FAILED', 'CANCELED', 'PENDING');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_MANUAL', 'DONE', 'REJECTED');

-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('WORKING', 'NOT_WORKING');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BOSS', 'MANAGER', 'ADMIN', 'SELLER', 'COURIER', 'CLIENT');

-- CreateEnum
CREATE TYPE "AdminAuthAuditAction" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOCKED', 'LOGOUT');

-- CreateEnum
CREATE TYPE "ReviewTargetRole" AS ENUM ('CLIENT', 'COURIER');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('MINI_APP', 'TELEGRAM_BOT');

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryPublicPath" TEXT NOT NULL,
    "secondaryPublicPath" TEXT NOT NULL,
    "description" TEXT,
    "headerImageUrl" TEXT,
    "backgroundImageUrl" TEXT,
    "status" "ShopStatus" NOT NULL DEFAULT 'WORKING',
    "renameCount" INTEGER NOT NULL DEFAULT 0,
    "requiresManualRenameReview" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuPage" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "menuPageId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "priceMinor" INTEGER NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerShopBinding" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerShopBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shopNameSnapshot" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "courierId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "itemsTotalMinor" INTEGER NOT NULL,
    "deliveryFeeMinor" INTEGER NOT NULL,
    "totalAmountMinor" INTEGER NOT NULL,
    "paymentProvider" TEXT NOT NULL,
    "paymentProviderTxId" TEXT NOT NULL,
    "telegramPaymentChargeId" TEXT,
    "providerPaymentChargeId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "refundNote" TEXT,
    "cancelledByUserId" TEXT,
    "cancellationReasonCode" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" BIGSERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "oldStatus" "OrderStatus" NOT NULL,
    "newStatus" "OrderStatus" NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryAssignmentAudit" (
    "id" BIGSERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "courierUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryAssignmentAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCancellationAudit" (
    "id" BIGSERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "action" TEXT NOT NULL,
    "reasonCode" TEXT,
    "refundStatus" "RefundStatus" NOT NULL,
    "refundNote" TEXT,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderCancellationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "name" TEXT NOT NULL,
    "username" TEXT,
    "language" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" BIGSERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "targetRole" "ReviewTargetRole" NOT NULL,
    "rating" INTEGER NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "comment" TEXT,
    "source" "ReviewSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiniAppSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiniAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramAuthReplay" (
    "id" TEXT NOT NULL,
    "initDataHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramAuthReplay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAccount" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "adminAccountId" TEXT NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "idleExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuthAudit" (
    "id" BIGSERIAL NOT NULL,
    "adminAccountId" TEXT NOT NULL,
    "action" "AdminAuthAuditAction" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "traceId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuthAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_primaryPublicPath_key" ON "Shop"("primaryPublicPath");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_secondaryPublicPath_key" ON "Shop"("secondaryPublicPath");

-- CreateIndex
CREATE INDEX "Shop_sellerId_idx" ON "Shop"("sellerId");

-- CreateIndex
CREATE INDEX "Shop_status_idx" ON "Shop"("status");

-- CreateIndex
CREATE INDEX "Shop_isDeleted_idx" ON "Shop"("isDeleted");

-- CreateIndex
CREATE INDEX "MenuPage_shopId_position_idx" ON "MenuPage"("shopId", "position");

-- CreateIndex
CREATE INDEX "Product_shopId_idx" ON "Product"("shopId");

-- CreateIndex
CREATE INDEX "Product_menuPageId_idx" ON "Product"("menuPageId");

-- CreateIndex
CREATE INDEX "Product_isDeleted_idx" ON "Product"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "SellerShopBinding_shopId_key" ON "SellerShopBinding"("shopId");

-- CreateIndex
CREATE INDEX "SellerShopBinding_sellerId_idx" ON "SellerShopBinding"("sellerId");

-- CreateIndex
CREATE INDEX "SellerShopBinding_telegramId_idx" ON "SellerShopBinding"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentProviderTxId_key" ON "Order"("paymentProviderTxId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_telegramPaymentChargeId_key" ON "Order"("telegramPaymentChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_providerPaymentChargeId_key" ON "Order"("providerPaymentChargeId");

-- CreateIndex
CREATE INDEX "Order_clientId_createdAt_idx" ON "Order"("clientId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_courierId_status_updatedAt_idx" ON "Order"("courierId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Order_status_updatedAt_idx" ON "Order"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Order_isDeleted_idx" ON "Order"("isDeleted");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_changedAt_idx" ON "OrderStatusHistory"("orderId", "changedAt");

-- CreateIndex
CREATE INDEX "DeliveryAssignmentAudit_orderId_createdAt_idx" ON "DeliveryAssignmentAudit"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "DeliveryAssignmentAudit_adminUserId_createdAt_idx" ON "DeliveryAssignmentAudit"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderCancellationAudit_orderId_createdAt_idx" ON "OrderCancellationAudit"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderCancellationAudit_actorUserId_createdAt_idx" ON "OrderCancellationAudit"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_entity_entityId_id_idx" ON "Event"("entity", "entityId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "Review_orderId_createdAt_idx" ON "Review"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_targetUserId_createdAt_idx" ON "Review"("targetUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_authorId_targetUserId_key" ON "Review"("orderId", "authorId", "targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MiniAppSession_sessionTokenHash_key" ON "MiniAppSession"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "MiniAppSession_userId_expiresAt_idx" ON "MiniAppSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramAuthReplay_initDataHash_key" ON "TelegramAuthReplay"("initDataHash");

-- CreateIndex
CREATE INDEX "TelegramAuthReplay_expiresAt_idx" ON "TelegramAuthReplay"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAccount_login_key" ON "AdminAccount"("login");

-- CreateIndex
CREATE INDEX "AdminAccount_role_idx" ON "AdminAccount"("role");

-- CreateIndex
CREATE INDEX "AdminAccount_lockedUntil_idx" ON "AdminAccount"("lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_refreshTokenHash_key" ON "AdminSession"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminAccountId_refreshTokenExpiresAt_idx" ON "AdminSession"("adminAccountId", "refreshTokenExpiresAt");

-- CreateIndex
CREATE INDEX "AdminSession_adminAccountId_idleExpiresAt_idx" ON "AdminSession"("adminAccountId", "idleExpiresAt");

-- CreateIndex
CREATE INDEX "AdminAuthAudit_adminAccountId_action_createdAt_idx" ON "AdminAuthAudit"("adminAccountId", "action", "createdAt");

-- AddForeignKey
ALTER TABLE "MenuPage" ADD CONSTRAINT "MenuPage_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_menuPageId_fkey" FOREIGN KEY ("menuPageId") REFERENCES "MenuPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerShopBinding" ADD CONSTRAINT "SellerShopBinding_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryAssignmentAudit" ADD CONSTRAINT "DeliveryAssignmentAudit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCancellationAudit" ADD CONSTRAINT "OrderCancellationAudit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiniAppSession" ADD CONSTRAINT "MiniAppSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminAccountId_fkey" FOREIGN KEY ("adminAccountId") REFERENCES "AdminAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuthAudit" ADD CONSTRAINT "AdminAuthAudit_adminAccountId_fkey" FOREIGN KEY ("adminAccountId") REFERENCES "AdminAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

