import type { ShopPublicPaths } from "./catalog.types";

const cyrillicToLatinMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  ғ: "gh",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  қ: "q",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ӯ: "u",
  ф: "f",
  х: "h",
  ҳ: "h",
  ц: "ts",
  ч: "ch",
  ҷ: "j",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  і: "i",
  ї: "yi",
};

const transliterateToLatin = (value: string): string =>
  value
    .toLowerCase()
    .split("")
    .map((character) => cyrillicToLatinMap[character] ?? character)
    .join("");

export const buildVanityShopPublicPathBase = (shopName: string): string => {
  const transliterated = transliterateToLatin(shopName.trim());
  const normalized = transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized.length > 0 ? normalized : "shop";
};

export const buildSellerOrdinalPublicPath = (sellerId: string, ordinal: number): string =>
  `${sellerId}${ordinal}`;

export const getNextSellerShopOrdinal = (sellerId: string, primaryPublicPaths: string[]): number => {
  const prefix = sellerId;
  let maxOrdinal = 0;

  for (const path of primaryPublicPaths) {
    if (!path.startsWith(prefix)) {
      continue;
    }

    const suffix = path.slice(prefix.length);

    if (!/^\d+$/u.test(suffix)) {
      continue;
    }

    maxOrdinal = Math.max(maxOrdinal, Number(suffix));
  }

  return maxOrdinal + 1;
};

export const buildUniqueShopPublicPaths = (input: {
  sellerId: string;
  shopName: string;
  existingPublicPaths: string[];
  existingSellerPrimaryPublicPaths: string[];
}): ShopPublicPaths => {
  const occupiedPaths = new Set(input.existingPublicPaths.map((value) => value.toLowerCase()));
  const nextOrdinal = getNextSellerShopOrdinal(input.sellerId, input.existingSellerPrimaryPublicPaths);
  const primaryPublicPath = buildSellerOrdinalPublicPath(input.sellerId, nextOrdinal);
  const vanityBase = buildVanityShopPublicPathBase(input.shopName);

  let secondaryPublicPath = vanityBase;
  let vanityOrdinal = 2;

  while (occupiedPaths.has(secondaryPublicPath.toLowerCase()) || secondaryPublicPath === primaryPublicPath) {
    secondaryPublicPath = `${vanityBase}-${vanityOrdinal}`;
    vanityOrdinal += 1;
  }

  return {
    primaryPublicPath,
    secondaryPublicPath,
  };
};

export const getPreferredPublicPath = (paths: ShopPublicPaths): string => paths.secondaryPublicPath;
