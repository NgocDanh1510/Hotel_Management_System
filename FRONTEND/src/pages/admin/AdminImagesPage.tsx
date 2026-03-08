import { useMemo, useState, type FormEvent, useEffect } from "react";
import { adminService } from "@/api/adminService";
import type { AdminImageItem } from "@/features/admin/types";
import {
  AdminBadge,
  AdminButton,
  AdminInputClassName,
  AdminMessage,
  AdminPageHeader,
  AdminPanel,
} from "@/features/admin/components/AdminPrimitives";
import { getErrorMessage } from "@/features/admin/utils";
import { X, Copy, Trash2 } from "lucide-react";

const AdminImagesPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [failedUploads, setFailedUploads] = useState<
    { originalName: string; reason: string }[]
  >([]);
  const [images, setImages] = useState<AdminImageItem[]>([]);
  const [allImages, setAllImages] = useState<AdminImageItem[]>([]);
  const [allImagesLoading, setAllImagesLoading] = useState(true);
  const [entityType, setEntityType] = useState<"hotel" | "room_type">("hotel");
  const [entityId, setEntityId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<AdminImageItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load all images on mount
  useEffect(() => {
    const fetchAllImages = async () => {
      try {
        setAllImagesLoading(true);
        const response = await adminService.getAllImages({ page: 1, limit: 100 });
        setAllImages(response.data.data);
      } catch (error) {
        console.error("Failed to load images:", error);
      } finally {
        setAllImagesLoading(false);
      }
    };

    fetchAllImages();
  }, []);

  const sortedImages = useMemo(
    () => [...images].sort((left, right) => left.sort_order - right.sort_order),
    [images],
  );

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length === 0) return;

    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      setFailedUploads([]);

      const response = await adminService.uploadImages(files, entityType, entityId);
      setImages(response.data.images);
      setFailedUploads(response.data.failed);
      setPageSuccess(
        `Upload xong ${response.data.success_count} ảnh. ${response.data.failed.length > 0 ? `Lỗi ${response.data.failed.length} ảnh.` : ""}`,
      );
      
      // Reload all images
      const allImagesResponse = await adminService.getAllImages({ page: 1, limit: 100 });
      setAllImages(allImagesResponse.data.data);
    } catch (error) {
      setPageError(getErrorMessage(error, "Upload ảnh thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      await adminService.setPrimaryImage(imageId);
      setImages((current) =>
        current.map((image) => ({
          ...image,
          is_primary: image.id === imageId,
        })),
      );
      setPageSuccess("Đã đặt ảnh primary.");
    } catch (error) {
      setPageError(getErrorMessage(error, "Đặt ảnh primary thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      await adminService.deleteImage(imageId);
      setImages((current) => current.filter((image) => image.id !== imageId));
      setAllImages((current) => current.filter((image) => image.id !== imageId));
      setShowModal(false);
      setSelectedImage(null);
      setPageSuccess("Đã xóa ảnh.");
    } catch (error) {
      setPageError(getErrorMessage(error, "Xóa ảnh thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReorder = async () => {
    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      await adminService.reorderImages(
        images.map((image) => ({
          id: image.id,
          sort_order: image.sort_order,
        })),
      );
      setPageSuccess("Đã cập nhật thứ tự ảnh.");
    } catch (error) {
      setPageError(getErrorMessage(error, "Reorder ảnh thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <AdminPageHeader
        title="Image Tools"
        description="Quản lý toàn bộ ảnh trong hệ thống"
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}
      {pageSuccess ? (
        <AdminMessage tone="success" message={pageSuccess} />
      ) : null}

      <AdminPanel title="Upload images">
        <form className="space-y-4" onSubmit={handleUpload}>
          <div className="grid gap-4 md:grid-cols-3">
            <select
              className={AdminInputClassName}
              value={entityType}
              onChange={(event) =>
                setEntityType(event.target.value as "hotel" | "room_type")
              }
            >
              <option value="hotel">hotel</option>
              <option value="room_type">room_type</option>
            </select>
            <input
              required
              className={AdminInputClassName}
              placeholder="Entity id"
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
            />
            <input
              required
              type="file"
              multiple
              className={AdminInputClassName}
              onChange={(event) =>
                setFiles(Array.from(event.target.files || []))
              }
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton type="submit" disabled={submitting || files.length === 0}>
              {submitting ? "Đang upload..." : "Upload"}
            </AdminButton>
          </div>
        </form>
      </AdminPanel>

      {failedUploads.length > 0 ? (
        <AdminPanel title="Upload failures">
          <div className="space-y-2 text-sm text-rose-600">
            {failedUploads.map((item) => (
              <p key={`${item.originalName}-${item.reason}`}>
                {item.originalName}: {item.reason}
              </p>
            ))}
          </div>
        </AdminPanel>
      ) : null}

      {sortedImages.length > 0 ? (
        <AdminPanel title="Current uploaded images">
          <div className="mb-4 flex justify-end">
            <AdminButton
              variant="secondary"
              onClick={() => void handleReorder()}
              disabled={submitting}
            >
              Lưu sort order
            </AdminButton>
          </div>
          <div className="space-y-4">
            {sortedImages.map((image) => (
              <div
                key={image.id}
                className="grid gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-[120px_1fr_auto]"
              >
                <img
                  src={image.url}
                  alt={image.public_id}
                  className="h-24 w-24 rounded-xl object-cover"
                />
                <div className="space-y-2 text-sm text-slate-500">
                  <p className="font-medium text-slate-900">{image.public_id}</p>
                  <p>{image.url}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <AdminBadge label={image.entity_type} />
                    {image.is_primary ? (
                      <AdminBadge label="primary" />
                    ) : null}
                    <label className="flex items-center gap-2">
                      sort
                      <input
                        type="number"
                        className={`${AdminInputClassName} w-24`}
                        value={image.sort_order}
                        onChange={(event) =>
                          setImages((current) =>
                            current.map((item) =>
                              item.id === image.id
                                ? {
                                    ...item,
                                    sort_order: Number(event.target.value),
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!image.is_primary ? (
                    <AdminButton
                      variant="secondary"
                      onClick={() => void handleSetPrimary(image.id)}
                      disabled={submitting}
                    >
                      Set primary
                    </AdminButton>
                  ) : null}
                  <AdminButton
                    variant="danger"
                    onClick={() => void handleDelete(image.id)}
                    disabled={submitting}
                  >
                    Xóa
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel title="Tất cả ảnh trong hệ thống">
        {allImagesLoading ? (
          <div className="text-center text-slate-500">Đang tải ảnh...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {allImages.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => {
                  setSelectedImage(image);
                  setShowModal(true);
                }}
                className="group relative overflow-hidden rounded-xl border border-slate-200 transition hover:shadow-lg"
              >
                <img
                  src={image.url}
                  alt={image.public_id}
                  className="aspect-square w-full object-cover transition group-hover:scale-110"
                />
                {image.is_primary && (
                  <div className="absolute inset-0 bg-black/20"></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
                  <span className="text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
                    Xem chi tiết
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </AdminPanel>

      {showModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Chi tiết ảnh</h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSelectedImage(null);
                }}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <img
                src={selectedImage.url}
                alt={selectedImage.public_id}
                className="h-64 w-full rounded-xl object-cover"
              />

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">ID</label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-100 p-3">
                    <code className="flex-1 break-all text-sm text-slate-600">
                      {selectedImage.id}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedImage.id)}
                      className="flex-shrink-0 text-slate-500 hover:text-slate-900"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Public ID</label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-100 p-3">
                    <code className="flex-1 break-all text-sm text-slate-600">
                      {selectedImage.public_id}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedImage.public_id)}
                      className="flex-shrink-0 text-slate-500 hover:text-slate-900"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">URL</label>
                  <div className="mt-1 flex items-center gap-2 rounded-lg bg-slate-100 p-3">
                    <code className="flex-1 break-all text-sm text-slate-600">
                      {selectedImage.url}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedImage.url)}
                      className="flex-shrink-0 text-slate-500 hover:text-slate-900"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Entity Type
                    </label>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedImage.entity_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Entity ID
                    </label>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedImage.entity_id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Sort Order
                    </label>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedImage.sort_order}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Is Primary
                    </label>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedImage.is_primary ? "Có" : "Không"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Ngày tạo
                  </label>
                  <p className="mt-1 text-sm text-slate-600">
                    {new Date(selectedImage.created_at!).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <AdminButton
                  variant="danger"
                  onClick={() => void handleDelete(selectedImage.id)}
                  disabled={submitting}
                >
                  <Trash2 size={16} className="mr-2 inline" />
                  Xóa ảnh
                </AdminButton>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedImage(null);
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminImagesPage;
