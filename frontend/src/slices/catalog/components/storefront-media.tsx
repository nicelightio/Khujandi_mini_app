import { useEffect, useState, type CSSProperties } from "react";

const storefrontMediaCrossfadeMs = 280;

const useStorefrontMediaCrossfade = (value: string) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [previousValue, setPreviousValue] = useState<string | null>(null);

  useEffect(() => {
    if (value === currentValue) {
      return;
    }

    setPreviousValue(currentValue);
    setCurrentValue(value);

    const timeoutHandle = window.setTimeout(() => {
      setPreviousValue(null);
    }, storefrontMediaCrossfadeMs);

    return () => {
      window.clearTimeout(timeoutHandle);
    };
  }, [currentValue, value]);

  return {
    currentValue,
    previousValue,
  };
};

const createStorefrontMediaStyle = (imageUrl: string): CSSProperties => ({
  "--storefront-media-image": `url(${imageUrl})`,
} as CSSProperties);

export const StorefrontCrossfadeBackground = ({ imageUrl, media }: { imageUrl: string; media: "hero" | "content" }) => {
  const { currentValue, previousValue } = useStorefrontMediaCrossfade(imageUrl);

  return (
    <div data-storefront-media={media}>
      {previousValue !== null ? <div data-storefront-media-layer="previous" style={createStorefrontMediaStyle(previousValue)} /> : null}
      <div
        data-storefront-media-layer={previousValue === null ? "static" : "current"}
        style={createStorefrontMediaStyle(currentValue)}
      />
    </div>
  );
};

export const StorefrontCrossfadeImage = ({ src, alt }: { src: string; alt: string }) => {
  const { currentValue, previousValue } = useStorefrontMediaCrossfade(src);

  return (
    <div data-storefront-product="media">
      {previousValue !== null ? <img src={previousValue} alt="" aria-hidden="true" data-storefront-product="image" data-storefront-image-layer="previous" /> : null}
      <img
        src={currentValue}
        alt={alt}
        data-storefront-product="image"
        data-storefront-image-layer={previousValue === null ? "static" : "current"}
      />
    </div>
  );
};
