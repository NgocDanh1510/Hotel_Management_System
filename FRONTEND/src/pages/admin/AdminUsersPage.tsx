import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminService } from "@/api/adminService";
import type { UsersListItem, AdminUserDetail, UserRole } from "@/types/user";
import type { PaginationMeta } from "@/types/common";

const AdminUsersPage: React.FC = () => {
  // --- State ---
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    has_next: false,
  });

  const [filters, setFilters] = useState({
    q: "",
    role_name: "",
    is_active: "" as string | boolean,
    sort: "created_at_desc",
    page: 1,
    limit: 10,
  });

  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    is_active: true,
  });

  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role_ids: [] as string[],
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const timerSearch = useRef(null);
  // --- API Calls ---
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        is_active:
          filters.is_active === "" ? undefined : filters.is_active === "true",
      };
      const response = await adminService.getUsers(params as any);

      if (response.statusCode === 200) {
        setUsers(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      alert("Error fetching users");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  useEffect(() => {
    adminService.getRoles().then((res) => {
      if (res.statusCode === 200) setRoles(res.data);
    });
  }, []);

  // --- Handlers ---
  const handleViewDetail = async (id: string) => {
    const res = await adminService.getUserById(id);
    if (res.statusCode === 200) {
      setSelectedUser(res.data);
      setIsDetailModalOpen(true);
    }
  };

  const handleOpenEdit = (user: UsersListItem) => {
    setEditFormData({
      name: user.name,
      phone: user.phone || "",
      is_active: user.is_active,
    });
    setSelectedUser(user as any);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const res = await adminService.updateUser(selectedUser.id, editFormData);
    if (res.statusCode === 200) {
      setIsEditModalOpen(false);
      fetchUsers();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminService.createUser(createFormData);
    if (res.statusCode === 201) {
      setIsCreateModalOpen(false);
      setCreateFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role_ids: [],
      });
      fetchUsers();
    } else {
      alert(res.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const res = await adminService.deleteUser(id);
    if (res.statusCode === 200) {
      fetchUsers();
    } else {
      alert(res.message || "Failed to delete user");
    }
  };

  const handleOpenRoles = (user: UsersListItem) => {
    setSelectedUser(user as any);
    setSelectedRoleIds(user.roles.map((r) => r.id));
    setIsRoleModalOpen(true);
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;
    const res = await adminService.updateUserRoles(selectedUser.id, {
      role_ids: selectedRoleIds,
    });
    if (res.statusCode === 200) {
      setIsRoleModalOpen(false);
      fetchUsers();
    }
  };

  const handelOnSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (timerSearch.current) clearTimeout(timerSearch.current);

    timerSearch.current = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        q: e.target.value,
        page: 1,
      }));
    }, 1000);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin: Manage Users</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded font-bold"
        >
          + Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-gray-100 p-4 rounded">
        <input
          type="text"
          placeholder="Search..."
          className="border p-2 rounded"
          onChange={handelOnSearch}
        />
        <select
          className="border p-2 rounded"
          value={filters.role_name}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              role_name: e.target.value,
              page: 1,
            }))
          }
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          className="border p-2 rounded"
          value={filters.is_active.toString()}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              is_active: e.target.value,
              page: 1,
            }))
          }
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          className="border p-2 rounded"
          value={filters.sort}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }))
          }
        >
          <option value="created_at_desc">Newest</option>
          <option value="created_at_asc">Oldest</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-left">
          <thead className="bg-gray-200">
            <tr>
              <th>STT</th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Roles</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 font-medium">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">
                    {user.roles.map((r) => r.name).join(", ")}
                  </td>
                  <td className="p-2">
                    {user.is_active ? "✅ Active" : "❌ Inactive"}
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => handleViewDetail(user.id)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenRoles(user)}
                      className="bg-indigo-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Roles
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center py-2">
        <p className="text-sm">Total: {meta.total}</p>
        <div className="space-x-2">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            className="border px-3 py-1 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>Page {filters.page}</span>
          <button
            disabled={!meta.has_next}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            className="border px-3 py-1 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Name"
                required
                value={createFormData.name}
                onChange={(e) =>
                  setCreateFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
              <input
                type="email"
                className="w-full border p-2 rounded"
                placeholder="Email"
                required
                value={createFormData.email}
                onChange={(e) =>
                  setCreateFormData((p) => ({ ...p, email: e.target.value }))
                }
              />
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Phone"
                value={createFormData.phone}
                onChange={(e) =>
                  setCreateFormData((p) => ({ ...p, phone: e.target.value }))
                }
              />
              <input
                type="password"
                className="w-full border p-2 rounded"
                placeholder="Password"
                required
                value={createFormData.password}
                onChange={(e) =>
                  setCreateFormData((p) => ({ ...p, password: e.target.value }))
                }
              />
              <div className="space-y-1">
                <p className="text-sm font-bold">Assign Roles:</p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-1 border p-1 rounded text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={createFormData.role_ids.includes(role.id)}
                        onChange={() => {
                          setCreateFormData((p) => ({
                            ...p,
                            role_ids: p.role_ids.includes(role.id)
                              ? p.role_ids.filter((id) => id !== role.id)
                              : [...p.role_ids, role.id],
                          }));
                        }}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded font-bold"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-gray-200 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">User Detail</h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>ID:</strong> {selectedUser.id}
              </p>
              <p>
                <strong>Name:</strong> {selectedUser.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Phone:</strong> {selectedUser.phone || "N/A"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedUser.is_active ? "Active" : "Inactive"}
              </p>
              <hr />
              <p className="font-bold">Stats:</p>
              <p>Total Bookings: {selectedUser.stats?.total_bookings}</p>
              <p>Total Spent: {selectedUser.stats?.total_spent}</p>
              <p>Avg Rating: {selectedUser.stats?.avg_rating_given}</p>
            </div>
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="mt-6 w-full bg-gray-200 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Phone"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData((p) => ({ ...p, phone: e.target.value }))
                }
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editFormData.is_active}
                  onChange={(e) =>
                    setEditFormData((p) => ({
                      ...p,
                      is_active: e.target.checked,
                    }))
                  }
                />
                Active
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-200 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Manage Roles</h2>
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 border p-2 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => {
                      setSelectedRoleIds((prev) =>
                        prev.includes(role.id)
                          ? prev.filter((r) => r !== role.id)
                          : [...prev, role.id],
                      );
                    }}
                  />
                  {role.name}
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleUpdateRoles}
                className="flex-1 bg-indigo-600 text-white py-2 rounded"
              >
                Update
              </button>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="flex-1 bg-gray-200 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
