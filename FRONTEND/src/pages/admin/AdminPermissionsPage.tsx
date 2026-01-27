import { useEffect, useMemo, useState, type FormEvent } from "react";
import { adminService } from "@/api/adminService";
import type { AdminPermissionListItem } from "@/features/admin/types";
import {
  AdminButton,
  AdminEmptyState,
  AdminInputClassName,
  AdminMessage,
  AdminModal,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminToolbar,
} from "@/features/admin/components/AdminPrimitives";
import { getErrorMessage } from "@/features/admin/utils";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { PaginationMeta } from "@/types/common";

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 20,
  has_next: false,
};

const AdminPermissionsPage = () => {
  const [permissions, setPermissions] = useState<AdminPermissionListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const [filters, setFilters] = useState({
    module: "",
    page: 1,
    limit: 20,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    code: "",
    module: "",
    description: "",
  });

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      module: filters.module || undefined,
      page: filters.page,
      limit: filters.limit,
      sort: "module",
      order: "ASC" as const,
    }),
    [debouncedSearch, filters],
  );

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await adminService.getPermissions(query);
      setPermissions(response.data);
      setMeta(response.meta);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được permissions."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPermissions();
  }, [query]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const openEdit = async (permission: AdminPermissionListItem) => {
    try {
      setPageError("");
      const response = await adminService.getPermissionById(permission.id);
      setEditForm({
        id: response.data.id,
        code: response.data.code,
        module: response.data.module,
        description: response.data.description || "",
      });
      setEditOpen(true);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được permission detail."));
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      await adminService.updatePermission(editForm.id, {
        module: editForm.module,
        description: editForm.description || null,
      });
      setEditOpen(false);
      setPageSuccess("Đã cập nhật permission.");
      await fetchPermissions();
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật permission thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const moduleOptions = Array.from(
    new Set(permissions.map((permission) => permission.module)),
  ).sort();

  return (
    <>
      <AdminPageHeader
        title="Permission Management"
        description="Xem và cập nhật metadata của permission. Code là immutable theo backend."
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}
      {pageSuccess ? (
        <AdminMessage tone="success" message={pageSuccess} />
      ) : null}

      <AdminToolbar>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className={`${AdminInputClassName} md:max-w-xs`}
          placeholder="Tìm code hoặc mô tả"
        />
        <select
          className={`${AdminInputClassName} md:max-w-[220px]`}
          value={filters.module}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              module: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Tất cả module</option>
          {moduleOptions.map((moduleName) => (
            <option key={moduleName} value={moduleName}>
              {moduleName}
            </option>
          ))}
        </select>
      </AdminToolbar>

      <AdminPanel title="Danh sách permissions">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : permissions.length === 0 ? (
          <AdminEmptyState message="Không có permission nào." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Code</th>
                    <th className="px-3 py-3 font-medium">Module</th>
                    <th className="px-3 py-3 font-medium">Description</th>
                    <th className="px-3 py-3 font-medium">Roles</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => (
                    <tr
                      key={permission.id}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-4 font-medium text-slate-900">
                        {permission.code}
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {permission.module}
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {permission.description || "--"}
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {permission.role_count}
                      </td>
                      <td className="px-3 py-4">
                        <AdminButton
                          variant="secondary"
                          onClick={() => void openEdit(permission)}
                        >
                          Sửa
                        </AdminButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination
              meta={meta}
              onPageChange={(page) =>
                setFilters((current) => ({ ...current, page }))
              }
            />
          </>
        )}
      </AdminPanel>

      <AdminModal
        open={editOpen}
        title="Cập nhật permission"
        onClose={() => setEditOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSave}>
          <input
            disabled
            className={`${AdminInputClassName} bg-slate-100`}
            value={editForm.code}
          />
          <input
            required
            className={AdminInputClassName}
            placeholder="module_name"
            value={editForm.module}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                module: event.target.value,
              }))
            }
          />
          <textarea
            className={AdminInputClassName}
            placeholder="Mô tả"
            value={editForm.description}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton variant="secondary" onClick={() => setEditOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu permission"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  );
};

export default AdminPermissionsPage;
