import { useEffect, useState, type FormEvent } from "react";
import { adminService } from "@/api/adminService";
import type { AdminAmenityOption } from "@/features/admin/types";
import {
  AdminButton,
  AdminEmptyState,
  AdminInputClassName,
  AdminMessage,
  AdminModal,
  AdminPageHeader,
  AdminPanel,
} from "@/features/admin/components/AdminPrimitives";
import { getErrorMessage } from "@/features/admin/utils";

const emptyForm = {
  name: "",
  icon: "",
};

const AdminAmenitiesPage = () => {
  const [amenities, setAmenities] = useState<AdminAmenityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<AdminAmenityOption | null>(
    null,
  );
  const [form, setForm] = useState(emptyForm);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await adminService.getAmenities();
      setAmenities(response.data);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được danh sách amenities."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAmenities();
  }, []);

  const openCreate = () => {
    setEditingAmenity(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (amenity: AdminAmenityOption) => {
    setEditingAmenity(amenity);
    setForm({
      name: amenity.name,
      icon: amenity.icon || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");

      if (editingAmenity) {
        await adminService.updateAmenity(editingAmenity.id, {
          name: form.name,
          icon: form.icon || undefined,
        });
        setPageSuccess("Đã cập nhật amenity.");
      } else {
        await adminService.createAmenity({
          name: form.name,
          icon: form.icon || undefined,
        });
        setPageSuccess("Đã tạo amenity.");
      }

      setModalOpen(false);
      await fetchAmenities();
    } catch (error) {
      setPageError(getErrorMessage(error, "Lưu amenity thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (amenity: AdminAmenityOption) => {
    const confirmed = window.confirm(`Xóa amenity ${amenity.name}?`);
    if (!confirmed) return;

    try {
      setPageError("");
      setPageSuccess("");
      await adminService.deleteAmenity(amenity.id);
      setPageSuccess("Đã xóa amenity.");
      await fetchAmenities();
    } catch (error) {
      setPageError(getErrorMessage(error, "Xóa amenity thất bại."));
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Amenity Management"
        description="Quản lý danh mục tiện ích dùng cho hotel và room type."
        action={<AdminButton onClick={openCreate}>Tạo amenity</AdminButton>}
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}
      {pageSuccess ? (
        <AdminMessage tone="success" message={pageSuccess} />
      ) : null}

      <AdminPanel title="Danh sách amenities">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : amenities.length === 0 ? (
          <AdminEmptyState message="Chưa có amenity nào." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Icon</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {amenities.map((amenity) => (
                  <tr key={amenity.id} className="border-b border-slate-100">
                    <td className="px-3 py-4 font-medium text-slate-900">
                      {amenity.name}
                    </td>
                    <td className="px-3 py-4 text-slate-500">
                      {amenity.icon || "--"}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <AdminButton
                          variant="secondary"
                          onClick={() => openEdit(amenity)}
                        >
                          Sửa
                        </AdminButton>
                        <AdminButton
                          variant="danger"
                          onClick={() => void handleDelete(amenity)}
                        >
                          Xóa
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <AdminModal
        open={modalOpen}
        title={editingAmenity ? "Cập nhật amenity" : "Tạo amenity"}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            required
            className={AdminInputClassName}
            placeholder="Tên tiện ích"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <input
            className={AdminInputClassName}
            placeholder="Icon key"
            value={form.icon}
            onChange={(event) =>
              setForm((current) => ({ ...current, icon: event.target.value }))
            }
          />

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu amenity"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  );
};

export default AdminAmenitiesPage;
