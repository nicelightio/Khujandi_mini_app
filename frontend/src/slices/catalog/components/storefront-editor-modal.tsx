import { StorefrontImageCropField } from "./storefront-image-crop-field";
import type { CatalogStorefrontViewModel } from "./storefront-view";

type StorefrontEditorModalProps = {
  storefront: CatalogStorefrontViewModel;
  onEditorFieldChange?: (name: string, value: string) => void;
  onCancelEditor?: () => void;
  onSubmitEditor?: () => void;
};

export const StorefrontEditorModal = ({
  storefront,
  onEditorFieldChange,
  onCancelEditor,
  onSubmitEditor,
}: StorefrontEditorModalProps) => {
  if (storefront.editor === null) {
    return null;
  }

  return (
    <div data-storefront-editor="backdrop">
      <form
        data-catalog-editor="active"
        data-storefront-editor="panel"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitEditor?.();
        }}
      >
        <div data-storefront-editor="header">
          <div>
            <p data-storefront-section-label>Seller edit mode</p>
            <h3>{storefront.editor.title}</h3>
          </div>
          <button type="button" data-magnetic="true" onClick={() => onCancelEditor?.()} disabled={storefront.isSaving}>
            Close
          </button>
        </div>
        <div data-storefront-editor="fields">
          {storefront.editor.fields.map((field) => {
            if (field.inputMode === "image") {
              return (
                <StorefrontImageCropField
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  value={field.value}
                  aspect={field.name === "headerImageUrl" ? 16 / 9 : 1}
                  onChange={(value) => onEditorFieldChange?.(field.name, value)}
                />
              );
            }

            return (
              <label key={field.name} data-storefront-editor-field={field.inputMode}>
                <span>{field.label}</span>
                {field.inputMode === "textarea" ? (
                  <textarea value={field.value} onChange={(event) => onEditorFieldChange?.(field.name, event.target.value)} />
                ) : (
                  <input
                    type={field.inputMode === "number" ? "number" : "text"}
                    value={field.value}
                    onChange={(event) => onEditorFieldChange?.(field.name, event.target.value)}
                  />
                )}
              </label>
            );
          })}
        </div>
        <div data-storefront-editor="actions">
          <button type="submit" data-magnetic="true" disabled={storefront.isSaving}>
            {storefront.isSaving ? "Saving..." : storefront.editor.submitLabel}
          </button>
          <button type="button" data-magnetic="true" onClick={() => onCancelEditor?.()} disabled={storefront.isSaving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
