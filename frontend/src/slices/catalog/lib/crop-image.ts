export type CropArea = {
  width: number;
  height: number;
  x: number;
  y: number;
};

const loadImage = async (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded for cropping."));
    image.src = source;
  });

export const readFileAsDataUrl = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Image file could not be read."));
        return;
      }

      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Image file could not be read."));
    reader.readAsDataURL(file);
  });

export const cropImageToDataUrl = async (source: string, area: CropArea): Promise<string> => {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(area.width));
  const height = Math.max(1, Math.round(area.height));

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("Canvas context is unavailable for image cropping.");
  }

  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.92);
};
