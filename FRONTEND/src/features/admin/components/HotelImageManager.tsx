import { useState, type FormEvent } from "react";
import type {
  HotelImageItem,
  HotelImageUploadPayload,
} from "@/features/admin/types";
import {
  AdminButton,
  AdminEmptyState,
  AdminInputClassName,
} from "./AdminPrimitives";

const emptyImageForm = {
  file: null as File | null,
  sort_order: "",
  is_primary: false,
};

type HotelImageManagerProps = {
  images: HotelImageItem[];
  loading: boolean;
  submitting: boolean;
  onAdd: (payload: HotelImageUploadPayload) => Promise<void>;
  onDelete: (image: HotelImageItem) => Promise<void>;
};

const HotelImageManager = ({
  images,
  loading,
  submitting,
  onAdd,
  onDelete,
}: HotelImageManagerProps) => {
  const [form, setForm] = useState(emptyImageForm);
  const [fileInputKey, setFileInputKey] = useState(0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.file) return;

    try {
      await onAdd({
        file: form.file,
        sort_order: form.sort_order ? Number(form.sort_order) : undefined,
        is_primary: form.is_primary,
      });

      setForm(emptyImageForm);
      setFileInputKey((current) => current + 1);
    } catch {
      // Parent owns the visible error message.
    }
  };

  return (
    <div className="space-y-5">
      <form
        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3 md:grid-cols-[1fr_120px]">
          <input
            key={fileInputKey}
            required
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={`${AdminInputClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white`}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                file: event.target.files?.[0] || null,
              }))
            }
          />
          <input
            type="number"
            min={0}
            className={AdminInputClassName}
            placeholder="Thứ tự"
            value={form.sort_order}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sort_order: event.target.value,
              }))
            }
          />
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  is_primary: event.target.checked,
                }))
              }
            />
            Đặt làm ảnh chính
          </label>

          <AdminButton type="submit" disabled={submitting}>
            {submitting ? "Đang upload..." : "Upload ảnh"}
          </AdminButton>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải danh sách ảnh...</p>
      ) : images.length === 0 ? (
        <AdminEmptyState message="Hotel này chưa có ảnh nào." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="aspect-[16/10] bg-slate-100">
                <img
                  src={image.url}
                  alt={image.public_id}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {image.public_id}
                    </p>
                    <p className="text-xs text-slate-500">
                      Sort order: {image.sort_order}
                    </p>
                  </div>
                  {image.is_primary ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Primary
                    </span>
                  ) : null}
                </div>

                <div className="flex justify-end">
                  <AdminButton
                    variant="danger"
                    disabled={submitting}
                    onClick={() => void onDelete(image)}
                  >
                    Xóa ảnh
                  </AdminButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HotelImageManager;
