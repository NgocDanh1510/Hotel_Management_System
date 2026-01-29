import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/api/adminService";
import type { AdminBookingListItem } from "@/features/admin/types";
import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminInputClassName,
  AdminMessage,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminToolbar,
} from "@/features/admin/components/AdminPrimitives";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getBookingStatusTargets,
  getErrorMessage,
  getOffsetFromPage,
  toShortId,
} from "@/features/admin/utils";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { PaginationMeta } from "@/types/common";

const defaultMeta: PaginationMeta = {
  total: 0,
  offset: 0,
  limit: 10,
  has_next: false,
};

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState<AdminBookingListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);

  const [filters, setFilters] = useState({
    status: "",
    sort: "created_at_desc",
    page: 1,
    limit: 10,
  });

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status: filters.status || undefined,
      sort: filters.sort,
      offset: getOffsetFromPage(filters.page, filters.limit),
      limit: filters.limit,
    }),
    [debouncedSearch, filters],
  );

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setPageError("");
        const response = await adminService.getAdminBookings(query);
        setBookings(response.data);
        setMeta(response.meta);
      } catch (error) {
        setPageError(
          getErrorMessage(error, "Không tải được danh sách bookings."),
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchBookings();
  }, [query]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const reloadBookings = async () => {
    const response = await adminService.getAdminBookings(query);
    setBookings(response.data);
    setMeta(response.meta);
  };

  const handleUpdateStatus = async (booking: AdminBookingListItem) => {
    const nextStatus =
      statusDrafts[booking.id] || getBookingStatusTargets(booking.status)[0];

    if (!nextStatus) return;

    try {
      setBusyId(booking.id);
      setPageError("");
      setPageSuccess("");
      await adminService.updateBookingStatus(booking.id, nextStatus);
      setPageSuccess(`Đã cập nhật booking #${toShortId(booking.id)}.`);
      await reloadBookings();
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật trạng thái thất bại."));
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Booking Management"
        description="Tìm booking, xem nhanh thông tin và đổi trạng thái theo flow backend."
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
          placeholder="Tìm user, email, room, hotel"
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
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="checked_in">checked_in</option>
          <option value="checked_out">checked_out</option>
          <option value="cancelled">cancelled</option>
          <option value="cancellation_pending">cancellation_pending</option>
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
          <option value="check_in_desc">Check-in gần nhất</option>
          <option value="total_price_desc">Giá cao hơn</option>
          <option value="status">Theo trạng thái</option>
        </select>
      </AdminToolbar>

      <AdminPanel title="Danh sách bookings">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : bookings.length === 0 ? (
          <AdminEmptyState message="Không có booking nào khớp bộ lọc." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Booking</th>
                    <th className="px-3 py-3 font-medium">Stay</th>
                    <th className="px-3 py-3 font-medium">Amount</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Change status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const nextStatuses = getBookingStatusTargets(booking.status);
                    const nextValue =
                      statusDrafts[booking.id] || nextStatuses[0] || "";

                    return (
                      <tr
                        key={booking.id}
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-4 align-top">
                          <p className="font-medium text-slate-900">
                            #{toShortId(booking.id)} -{" "}
                            {booking.user?.name || "Unknown guest"}
                          </p>
                          <p className="text-slate-500">
                            {booking.user?.email || "--"}
                          </p>
                          <p className="text-slate-400">
                            {booking.hotel?.name || "--"} / phòng{" "}
                            {booking.room?.room_number || "--"}
                          </p>
                        </td>
                        <td className="px-3 py-4 align-top text-slate-500">
                          <p>
                            {formatDate(booking.check_in)} -{" "}
                            {formatDate(booking.check_out)}
                          </p>
                          <p>{booking.guests_count} khách</p>
                          <p className="text-slate-400">
                            Tạo lúc {formatDateTime(booking.created_at)}
                          </p>
                        </td>
                        <td className="px-3 py-4 align-top text-slate-500">
                          <p>{formatCurrency(booking.total_price)}</p>
                          <p>{formatCurrency(booking.price_per_night)}/đêm</p>
                        </td>
                        <td className="px-3 py-4 align-top">
                          <AdminBadge label={booking.status} />
                          {booking.special_requests ? (
                            <p className="mt-2 max-w-xs text-xs text-slate-400">
                              {booking.special_requests}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-4 align-top">
                          {nextStatuses.length === 0 ? (
                            <span className="text-slate-400">
                              Trạng thái cuối
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <select
                                className={`${AdminInputClassName} min-w-[170px]`}
                                value={nextValue}
                                onChange={(event) =>
                                  setStatusDrafts((current) => ({
                                    ...current,
                                    [booking.id]: event.target.value,
                                  }))
                                }
                              >
                                {nextStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              <AdminButton
                                onClick={() => void handleUpdateStatus(booking)}
                                disabled={busyId === booking.id}
                              >
                                {busyId === booking.id ? "Đang cập nhật..." : "Lưu"}
                              </AdminButton>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
    </>
  );
};

export default AdminBookingsPage;
