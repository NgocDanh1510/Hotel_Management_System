import { useMemo, useState, type FormEvent } from "react";
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

const AdminImagesPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [failedUploads, setFailedUploads] = useState<
    { originalName: string; reason: string }[]
  >([]);
  const [images, setImages] = useState<AdminImageItem[]>([]);
  const [entityType, setEntityType] = useState<"hotel" | "room_type">("hotel");
  const [entityId, setEntityId] = useState("");
  const [files, setFiles] = useState<File[]>([]);

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

  return (
    <>
      <AdminPageHeader
        title="Image Tools"
        description="Backend chưa có endpoint list ảnh tổng quát, nên màn này tập trung test upload và thao tác trên ảnh vừa upload."
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
    </>
  );
};

export default AdminImagesPage;
