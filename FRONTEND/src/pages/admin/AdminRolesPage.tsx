import { useEffect, useMemo, useState, type FormEvent } from "react";
import { adminService } from "@/api/adminService";
import type {
  AdminPermissionListItem,
  AdminRoleDetail,
  AdminRoleListItem,
} from "@/features/admin/types";
import {
  AdminBadge,
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
  limit: 10,
  has_next: false,
};

const emptyRoleForm = {
  name: "",
  description: "",
};

const AdminRolesPage = () => {
  const [roles, setRoles] = useState<AdminRoleListItem[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const [filters, setFilters] = useState({
    is_system: "",
    page: 1,
    limit: 10,
  });
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRoleListItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRoleDetail | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const [roleForm, setRoleForm] = useState(emptyRoleForm);

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      is_system:
        filters.is_system === "" ? undefined : filters.is_system === "true",
      page: filters.page,
      limit: filters.limit,
      sort: "created_at",
      order: "DESC" as const,
    }),
    [debouncedSearch, filters],
  );

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await adminService.getRoles(query);
      setRoles(response.data);
      setMeta(response.meta);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được danh sách roles."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRoles();
  }, [query]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await adminService.getPermissions({
          page: 1,
          limit: 200,
          sort: "module",
          order: "ASC",
        });
        setPermissions(response.data);
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được permissions."));
      }
    };

    void fetchPermissions();
  }, []);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const openCreate = () => {
    setEditingRole(null);
    setRoleForm(emptyRoleForm);
    setRoleModalOpen(true);
  };

  const openEdit = (role: AdminRoleListItem) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
    });
    setRoleModalOpen(true);
  };

  const openPermissions = async (role: AdminRoleListItem) => {
    try {
      setPageError("");
      const response = await adminService.getRoleById(role.id);
      setSelectedRole(response.data);
      setSelectedPermissionIds(response.data.permissions.map((item) => item.id));
      setPermissionModalOpen(true);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được role detail."));
    }
  };

  const handleSaveRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");

      if (editingRole) {
        await adminService.updateRole(editingRole.id, {
          name: roleForm.name,
          description: roleForm.description || undefined,
        });
        setPageSuccess("Đã cập nhật role.");
      } else {
        await adminService.createRole({
          name: roleForm.name,
          description: roleForm.description || undefined,
        });
        setPageSuccess("Đã tạo role.");
      }

      setRoleModalOpen(false);
      await fetchRoles();
    } catch (error) {
      setPageError(getErrorMessage(error, "Lưu role thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: AdminRoleListItem) => {
    const confirmed = window.confirm(`Xóa role ${role.name}?`);
    if (!confirmed) return;

    try {
      setPageError("");
      setPageSuccess("");
      await adminService.deleteRole(role.id);
      setPageSuccess("Đã xóa role.");
      await fetchRoles();
    } catch (error) {
      setPageError(getErrorMessage(error, "Xóa role thất bại."));
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      await adminService.updateRolePermissions(selectedRole.id, {
        permission_ids: selectedPermissionIds,
      });
      setPermissionModalOpen(false);
      setPageSuccess("Đã cập nhật permissions cho role.");
      await fetchRoles();
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật permissions thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Role Management"
        description="Quản lý role và gán permission cho từng role."
        action={<AdminButton onClick={openCreate}>Tạo role</AdminButton>}
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
          placeholder="Tìm theo tên hoặc mô tả"
        />
        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={filters.is_system}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              is_system: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Tất cả roles</option>
          <option value="true">system</option>
          <option value="false">custom</option>
        </select>
      </AdminToolbar>

      <AdminPanel title="Danh sách roles">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : roles.length === 0 ? (
          <AdminEmptyState message="Không có role nào." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Role</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Counts</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-b border-slate-100">
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-900">{role.name}</p>
                        <p className="text-slate-500">
                          {role.description || "--"}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <AdminBadge
                          label={role.is_system ? "system" : "custom"}
                        />
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        <p>{role.permission_count} permissions</p>
                        <p>{role.user_count} users</p>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <AdminButton
                            variant="secondary"
                            onClick={() => void openPermissions(role)}
                          >
                            Permissions
                          </AdminButton>
                          <AdminButton
                            variant="secondary"
                            onClick={() => openEdit(role)}
                            disabled={role.is_system}
                          >
                            Sửa
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            onClick={() => void handleDeleteRole(role)}
                            disabled={role.is_system}
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
        open={roleModalOpen}
        title={editingRole ? "Cập nhật role" : "Tạo role"}
        onClose={() => setRoleModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSaveRole}>
          <input
            required
            className={AdminInputClassName}
            placeholder="role_name"
            value={roleForm.name}
            onChange={(event) =>
              setRoleForm((current) => ({
                ...current,
                name: event.target.value.toLowerCase(),
              }))
            }
          />
          <textarea
            className={AdminInputClassName}
            placeholder="Mô tả"
            value={roleForm.description}
            onChange={(event) =>
              setRoleForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton
              variant="secondary"
              onClick={() => setRoleModalOpen(false)}
            >
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu role"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={permissionModalOpen}
        title={`Permissions - ${selectedRole?.name || ""}`}
        description="Chọn permission cần gán cho role."
        onClose={() => setPermissionModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            {permissions.map((permission) => (
              <label
                key={permission.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissionIds.includes(permission.id)}
                  onChange={() =>
                    setSelectedPermissionIds((current) =>
                      current.includes(permission.id)
                        ? current.filter((id) => id !== permission.id)
                        : [...current, permission.id],
                    )
                  }
                />
                <span>
                  <span className="block font-medium text-slate-900">
                    {permission.code}
                  </span>
                  <span className="block text-slate-500">
                    {permission.module}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton
              variant="secondary"
              onClick={() => setPermissionModalOpen(false)}
            >
              Hủy
            </AdminButton>
            <AdminButton onClick={() => void handleUpdatePermissions()}>
              {submitting ? "Đang cập nhật..." : "Lưu permissions"}
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminRolesPage;
