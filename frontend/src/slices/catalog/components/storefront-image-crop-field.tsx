import { useId, useRef, useState, type ChangeEvent } from "react";
import Cropper from "react-easy-crop";
import { cropImageToDataUrl, readFileAsDataUrl, type CropArea } from "../lib/crop-image";

type StorefrontImageCropFieldProps = {
  name: string;
  label: string;
  value: string;
  aspect: number;
  onChange: (value: string) => void;
};

export const StorefrontImageCropField = ({
  name,
  label,
  value,
  aspect,
  onChange,
}: StorefrontImageCropFieldProps) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const resetCropModal = () => {
    setSourceImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropArea(null);
    setErrorMessage(null);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file === undefined) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSourceImage(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropArea(null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Image file could not be prepared.");
    }
  };

  const applyCrop = async () => {
    if (sourceImage === null || cropArea === null) {
      setErrorMessage("Select a visible crop area before saving the image.");
      return;
    }

    setIsApplying(true);
    setErrorMessage(null);

    try {
      const cropped = await cropImageToDataUrl(sourceImage, cropArea);
      onChange(cropped);
      resetCropModal();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Image crop failed.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div data-storefront-editor-field="image">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          void handleFileChange(event);
        }}
      />
      <div data-storefront-image-picker="preview" data-has-image={value.length > 0 ? "true" : "false"}>
        {value.length > 0 ? (
          <img src={value} alt="" data-storefront-image-preview={name} />
        ) : (
          <p data-storefront-image-empty>No image selected yet.</p>
        )}
      </div>
      <div data-storefront-image-actions>
        <button type="button" onClick={openPicker}>
          {value.length > 0 ? "Replace image" : "Upload image"}
        </button>
        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
            }}
          >
            Remove image
          </button>
        ) : null}
      </div>
      {errorMessage !== null ? <p role="alert">{errorMessage}</p> : null}

      {sourceImage !== null ? (
        <div data-storefront-cropper="backdrop" role="dialog" aria-modal="true" aria-label={`${label} cropper`}>
          <div data-storefront-cropper="panel">
            <div data-storefront-cropper="stage">
              <Cropper
                image={sourceImage}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                objectFit="cover"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => {
                  setCropArea({
                    width: croppedAreaPixels.width,
                    height: croppedAreaPixels.height,
                    x: croppedAreaPixels.x,
                    y: croppedAreaPixels.y,
                  });
                }}
              />
            </div>
            <label data-storefront-cropper="zoom">
              Zoom
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(event) => {
                  setZoom(Number(event.target.value));
                }}
              />
            </label>
            <div data-storefront-cropper="actions">
              <button type="button" onClick={() => void applyCrop()} disabled={isApplying}>
                {isApplying ? "Applying..." : "Use crop"}
              </button>
              <button type="button" onClick={resetCropModal} disabled={isApplying}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
