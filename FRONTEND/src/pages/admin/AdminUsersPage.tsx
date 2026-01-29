import { useEffect, useMemo, useState, type FormEvent } from "react";
import { adminService } from "@/api/adminService";
import type { AdminRoleOption } from "@/features/admin/types";
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
import {
  formatCurrency,
  formatDateTime,
  getErrorMessage,
} from "@/features/admin/utils";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { PaginationMeta } from "@/types/common";
import type { AdminUserDetail, UsersListItem } from "@/types/user";

const defaultMeta: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  has_next: false,
};

const emptyCreateForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role_ids: [] as string[],
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [roleError, setRoleError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);

  const [filters, setFilters] = useState({
    role_name: "",
    is_active: "",
    sort: "created_at_desc",
    page: 1,
    limit: 10,
  });

  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    phone: "",
    is_active: true,
  });
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const userQuery = useMemo(
    () => ({
      q: debouncedSearch,
      role_name: filters.role_name || undefined,
      is_active:
        filters.is_active === ""
          ? undefined
          : filters.is_active === "true",
      sort: filters.sort,
      page: filters.page,
      limit: filters.limit,
    }),
    [debouncedSearch, filters],
  );

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setPageError("");
        const response = await adminService.getUsers(userQuery);
        setUsers(response.data);
        setMeta(response.meta);
      } catch (error) {
        setPageError(
          getErrorMessage(error, "Không tải được danh sách users."),
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, [userQuery]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await adminService.getRoles();
        setRoles(response.data);
        setRoleError("");
      } catch (error) {
        setRoles([]);
        setRoleError(
          getErrorMessage(
            error,
            "Không tải được danh sách role. Bạn vẫn có thể test các thao tác khác.",
          ),
        );
      }
    };

    void fetchRoles();
  }, []);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const resetMessages = () => {
    setPageError("");
    setPageSuccess("");
  };

  const handleOpenCreate = () => {
    resetMessages();
    setCreateForm(emptyCreateForm);
    setCreateOpen(true);
  };

  const handleViewUser = async (userId: string) => {
    try {
      resetMessages();
      const response = await adminService.getUserById(userId);
      setSelectedUser(response.data);
      setDetailOpen(true);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được chi tiết user."));
    }
  };

  const handleOpenEdit = (user: UsersListItem) => {
    resetMessages();
    setEditForm({
      id: user.id,
      name: user.name,
      phone: user.phone || "",
      is_active: user.is_active,
    });
    setEditOpen(true);
  };

  const handleOpenRoles = (user: UsersListItem) => {
    resetMessages();
    setSelectedUser({
      ...user,
      stats: {
        total_bookings: 0,
        total_spent: 0,
        last_booking_at: null,
        avg_rating_given: 0,
      },
    });
    setSelectedRoleIds(user.roles.map((role) => role.id));
    setRoleOpen(true);
  };

  const reloadUsers = async () => {
    const response = await adminService.getUsers(userQuery);
    setUsers(response.data);
    setMeta(response.meta);
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.createUser(createForm);
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      setPageSuccess("Đã tạo user mới.");
      await reloadUsers();
    } catch (error) {
      setPageError(getErrorMessage(error, "Tạo user thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.updateUser(editForm.id, {
        name: editForm.name,
        phone: editForm.phone,
        is_active: editForm.is_active,
      });
      setEditOpen(false);
      setPageSuccess("Đã cập nhật user.");
      await reloadUsers();
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật user thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.updateUserRoles(selectedUser.id, {
        role_ids: selectedRoleIds,
      });
      setRoleOpen(false);
      setPageSuccess("Đã cập nhật role cho user.");
      await reloadUsers();
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật role thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: UsersListItem) => {
    const confirmed = window.confirm(`Xóa user ${user.email}?`);
    if (!confirmed) return;

    try {
      resetMessages();
      await adminService.deleteUser(user.id);
      setPageSuccess("Đã xóa user.");
      await reloadUsers();
    } catch (error) {
      setPageError(getErrorMessage(error, "Xóa user thất bại."));
    }
  };

  return (
    <>
      <AdminPageHeader
        title="User Management"
        description="Tạo, cập nhật, phân quyền và kiểm tra thống kê cơ bản của user."
        action={<AdminButton onClick={handleOpenCreate}>Tạo user</AdminButton>}
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}
      {pageSuccess ? (
        <AdminMessage tone="success" message={pageSuccess} />
      ) : null}
      {roleError ? <AdminMessage tone="info" message={roleError} /> : null}

      <AdminToolbar>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className={`${AdminInputClassName} md:max-w-xs`}
          placeholder="Tìm theo tên, email, số điện thoại"
        />

        <select
          className={`${AdminInputClassName} md:max-w-xs`}
          value={filters.role_name}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              role_name: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Tất cả role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.name}>
              {role.name}
            </option>
          ))}
        </select>

        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={filters.is_active}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              is_active: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang active</option>
          <option value="false">Đã khóa</option>
        </select>

        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={filters.sort}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              sort: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="created_at_desc">Mới nhất</option>
          <option value="created_at_asc">Cũ nhất</option>
          <option value="name_asc">Tên A-Z</option>
          <option value="name_desc">Tên Z-A</option>
        </select>
      </AdminToolbar>

      <AdminPanel title="Danh sách users">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : users.length === 0 ? (
          <AdminEmptyState message="Không có user nào khớp bộ lọc." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Roles</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Created</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 align-top">
                        <p className="font-medium text-slate-900">
                          {user.name}
                        </p>
                        <p className="text-slate-500">{user.email}</p>
                        <p className="text-slate-400">{user.phone || "--"}</p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          {user.roles.length === 0 ? (
                            <span className="text-slate-400">No role</span>
                          ) : (
                            user.roles.map((role) => (
                              <AdminBadge key={role.id} label={role.name} />
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <AdminBadge
                          label={user.is_active ? "active" : "inactive"}
                        />
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        {formatDateTime(user.created_at)}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <AdminButton onClick={() => handleViewUser(user.id)}>
                            Xem
                          </AdminButton>
                          <AdminButton
                            variant="secondary"
                            onClick={() => handleOpenEdit(user)}
                          >
                            Sửa
                          </AdminButton>
                          <AdminButton
                            variant="secondary"
                            onClick={() => handleOpenRoles(user)}
                            disabled={roles.length === 0}
                          >
                            Roles
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            onClick={() => handleDeleteUser(user)}
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
        open={createOpen}
        title="Tạo user mới"
        description="Form tối giản để test flow tạo user và gán role."
        onClose={() => setCreateOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleCreateUser}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              className={AdminInputClassName}
              placeholder="Họ tên"
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <input
              required
              type="email"
              className={AdminInputClassName}
              placeholder="Email"
              value={createForm.email}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Số điện thoại"
              value={createForm.phone}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
            <input
              required
              type="password"
              className={AdminInputClassName}
              placeholder="Mật khẩu"
              value={createForm.password}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Roles</p>
            {roles.length === 0 ? (
              <p className="text-sm text-slate-400">Không có dữ liệu role.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={createForm.role_ids.includes(role.id)}
                      onChange={() =>
                        setCreateForm((current) => ({
                          ...current,
                          role_ids: current.role_ids.includes(role.id)
                            ? current.role_ids.filter((id) => id !== role.id)
                            : [...current.role_ids, role.id],
                        }))
                      }
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton
              variant="secondary"
              onClick={() => setCreateOpen(false)}
            >
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang tạo..." : "Tạo user"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={detailOpen}
        title="Chi tiết user"
        onClose={() => setDetailOpen(false)}
      >
        {selectedUser ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-900">Tên:</span>{" "}
                {selectedUser.name}
              </p>
              <p>
                <span className="font-medium text-slate-900">Email:</span>{" "}
                {selectedUser.email}
              </p>
              <p>
                <span className="font-medium text-slate-900">Phone:</span>{" "}
                {selectedUser.phone || "--"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Trạng thái:</span>{" "}
                {selectedUser.is_active ? "Active" : "Inactive"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Tạo lúc:</span>{" "}
                {formatDateTime(selectedUser.created_at)}
              </p>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-900">Total bookings:</span>{" "}
                {selectedUser.stats.total_bookings}
              </p>
              <p>
                <span className="font-medium text-slate-900">Total spent:</span>{" "}
                {formatCurrency(selectedUser.stats.total_spent)}
              </p>
              <p>
                <span className="font-medium text-slate-900">Last booking:</span>{" "}
                {formatDateTime(selectedUser.stats.last_booking_at)}
              </p>
              <p>
                <span className="font-medium text-slate-900">Avg rating:</span>{" "}
                {selectedUser.stats.avg_rating_given ?? "--"}
              </p>
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminModal
        open={editOpen}
        title="Cập nhật user"
        onClose={() => setEditOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleUpdateUser}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              className={AdminInputClassName}
              placeholder="Họ tên"
              value={editForm.name}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Số điện thoại"
              value={editForm.phone}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={editForm.is_active}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  is_active: event.target.checked,
                }))
              }
            />
            User đang active
          </label>

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton variant="secondary" onClick={() => setEditOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={roleOpen}
        title="Quản lý role"
        description="Chọn role mới cho user rồi cập nhật."
        onClose={() => setRoleOpen(false)}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() =>
                    setSelectedRoleIds((current) =>
                      current.includes(role.id)
                        ? current.filter((id) => id !== role.id)
                        : [...current, role.id],
                    )
                  }
                />
                {role.name}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton variant="secondary" onClick={() => setRoleOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton onClick={handleUpdateRoles} disabled={submitting}>
              {submitting ? "Đang cập nhật..." : "Cập nhật roles"}
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminUsersPage;
