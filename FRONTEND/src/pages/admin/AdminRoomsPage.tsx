import { useEffect, useMemo, useState, type FormEvent } from "react";
import { adminService } from "@/api/adminService";
import type { AdminRoomListItem } from "@/features/admin/types";
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
  formatDateTime,
  getErrorMessage,
  getOffsetFromPage,
} from "@/features/admin/utils";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { PaginationMeta } from "@/types/common";

const defaultMeta: PaginationMeta = {
  total: 0,
  offset: 0,
  limit: 10,
  has_next: false,
};

const AdminRoomsPage = () => {
  const [rooms, setRooms] = useState<AdminRoomListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const [filters, setFilters] = useState({
    status: "",
    sort: "updated_at_desc",
    page: 1,
    limit: 10,
  });
  const [bulkStatus, setBulkStatus] = useState<"maintenance" | "available">(
    "maintenance",
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    room_number: "",
    floor: 1,
    status: "available" as "available" | "occupied" | "maintenance",
    room_type_id: "",
  });

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status:
        (filters.status as "available" | "occupied" | "maintenance") ||
        undefined,
      sort: filters.sort,
      offset: getOffsetFromPage(filters.page, filters.limit),
      limit: filters.limit,
    }),
    [debouncedSearch, filters],
  );

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setPageError("");
        const response = await adminService.getRooms(query);
        setRooms(response.data);
        setMeta(response.meta);
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được danh sách rooms."));
      } finally {
        setLoading(false);
      }
    };

    void fetchRooms();
  }, [query]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const reloadRooms = async () => {
    const response = await adminService.getRooms(query);
    setRooms(response.data);
    setMeta(response.meta);
  };

  const openEdit = (room: AdminRoomListItem) => {
    setEditForm({
      id: room.id,
      room_number: room.room_number,
      floor: room.floor,
      status: room.status,
      room_type_id: room.room_type_id,
    });
    setEditOpen(true);
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      await adminService.updateRoom(editForm.id, editForm);
      setEditOpen(false);
      setPageSuccess("Đã cập nhật room.");
      await reloadRooms();
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật room thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedRoomIds.length === 0) return;

    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      await adminService.bulkUpdateRoomStatus(selectedRoomIds, bulkStatus);
      setSelectedRoomIds([]);
      setPageSuccess("Đã bulk update trạng thái phòng.");
      await reloadRooms();
    } catch (error) {
      setPageError(getErrorMessage(error, "Bulk update thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const visibleRoomIds = rooms.map((room) => room.id);
  const allSelected =
    visibleRoomIds.length > 0 &&
    visibleRoomIds.every((roomId) => selectedRoomIds.includes(roomId));

  return (
    <>
      <AdminPageHeader
        title="Room Management"
        description="Quản lý phòng, chỉnh trạng thái đơn lẻ hoặc hàng loạt."
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
          placeholder="Tìm số phòng hoặc tên hotel"
        />
        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={filters.status}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">available</option>
          <option value="occupied">occupied</option>
          <option value="maintenance">maintenance</option>
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
          <option value="updated_at_desc">Mới cập nhật</option>
          <option value="room_number">Số phòng tăng dần</option>
          <option value="floor">Tầng tăng dần</option>
          <option value="status">Theo trạng thái</option>
        </select>
        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={bulkStatus}
          onChange={(event) =>
            setBulkStatus(event.target.value as "maintenance" | "available")
          }
        >
          <option value="maintenance">maintenance</option>
          <option value="available">available</option>
        </select>
        <AdminButton
          onClick={() => void handleBulkUpdate()}
          disabled={submitting || selectedRoomIds.length === 0}
        >
          Bulk update
        </AdminButton>
      </AdminToolbar>

      <AdminPanel title="Danh sách rooms">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : rooms.length === 0 ? (
          <AdminEmptyState message="Không có room nào khớp bộ lọc." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) =>
                          setSelectedRoomIds(
                            event.target.checked ? visibleRoomIds : [],
                          )
                        }
                      />
                    </th>
                    <th className="px-3 py-3 font-medium">Room</th>
                    <th className="px-3 py-3 font-medium">Hotel / Type</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Updated</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id} className="border-b border-slate-100">
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.includes(room.id)}
                          onChange={(event) =>
                            setSelectedRoomIds((current) =>
                              event.target.checked
                                ? [...current, room.id]
                                : current.filter((id) => id !== room.id),
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-900">
                          {room.room_number}
                        </p>
                        <p className="text-slate-500">Tầng {room.floor}</p>
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        <p>{room.Hotel?.name || "--"}</p>
                        <p>{room.RoomType?.name || "--"}</p>
                      </td>
                      <td className="px-3 py-4">
                        <AdminBadge label={room.status} />
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {formatDateTime(room.updated_at)}
                      </td>
                      <td className="px-3 py-4">
                        <AdminButton
                          variant="secondary"
                          onClick={() => openEdit(room)}
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
        title="Cập nhật room"
        onClose={() => setEditOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleEdit}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              className={AdminInputClassName}
              placeholder="Số phòng"
              value={editForm.room_number}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  room_number: event.target.value,
                }))
              }
            />
            <input
              type="number"
              className={AdminInputClassName}
              placeholder="Tầng"
              value={editForm.floor}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  floor: Number(event.target.value),
                }))
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select
              className={AdminInputClassName}
              value={editForm.status}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  status: event.target.value as
                    | "available"
                    | "occupied"
                    | "maintenance",
                }))
              }
            >
              <option value="available">available</option>
              <option value="occupied">occupied</option>
              <option value="maintenance">maintenance</option>
            </select>
            <input
              className={AdminInputClassName}
              placeholder="Room type id"
              value={editForm.room_type_id}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  room_type_id: event.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton variant="secondary" onClick={() => setEditOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu room"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  );
};

export default AdminRoomsPage;
