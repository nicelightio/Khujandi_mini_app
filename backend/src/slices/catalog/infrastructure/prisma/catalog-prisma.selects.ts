export const selectSellerShop = {
  id: true,
  sellerId: true,
  name: true,
  description: true,
  headerImageUrl: true,
  backgroundImageUrl: true,
  status: true,
  renameCount: true,
  requiresManualRenameReview: true,
  isDeleted: true,
} as const;

export const selectSellerMenuPage = {
  id: true,
  shopId: true,
  name: true,
  position: true,
  shop: {
    select: {
      sellerId: true,
      isDeleted: true,
      status: true,
    },
  },
} as const;

export const selectSellerProduct = {
  id: true,
  shopId: true,
  menuPageId: true,
  name: true,
  description: true,
  imageUrl: true,
  priceMinor: true,
  isDeleted: true,
  shop: {
    select: {
      sellerId: true,
      isDeleted: true,
    },
  },
} as const;

export const selectSellerBinding = {
  id: true,
  shopId: true,
  sellerId: true,
  telegramId: true,
} as const;

export const selectAdminProvisionedShop = {
  id: true,
  name: true,
  sellerId: true,
  status: true,
  sellerBindings: {
    select: {
      telegramId: true,
    },
  },
} as const;

export const selectSellerShopWrite = {
  ...selectSellerShop,
  updatedAt: true,
} as const;

export const selectSellerMenuPageWrite = {
  ...selectSellerMenuPage,
  createdAt: true,
  updatedAt: true,
} as const;

export const selectSellerProductWrite = {
  ...selectSellerProduct,
  createdAt: true,
  updatedAt: true,
} as const;
