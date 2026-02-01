import { useEffect, useMemo, useState } from "react";
import { partnerService } from "@/api/partnerService";
import type {
  PartnerBookingDetail,
  PartnerBookingInvoice,
  PartnerBookingListItem,
} from "@/types/partner";
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

const PartnerBookingsPage = () => {
  const [bookings, setBookings] = useState<PartnerBookingListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<PartnerBookingDetail | null>(
    null,
  );
  const [selectedInvoice, setSelectedInvoice] =
    useState<PartnerBookingInvoice | null>(null);

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
        const response = await partnerService.getBookings(query);
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
    const response = await partnerService.getBookings(query);
    setBookings(response.data);
    setMeta(response.meta);
  };

  const handleUpdateStatus = async (booking: PartnerBookingListItem) => {
    const nextStatus =
      statusDrafts[booking.id] || getBookingStatusTargets(booking.status)[0];

    if (!nextStatus) return;

    try {
      setBusyId(booking.id);
      setPageError("");
      setPageSuccess("");
      await partnerService.updateBookingStatus(booking.id, nextStatus);
      setPageSuccess(`Đã cập nhật booking #${toShortId(booking.id)}.`);
      await reloadBookings();
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật trạng thái thất bại."));
    } finally {
      setBusyId("");
    }
  };

  const handleCancelBooking = async (booking: PartnerBookingListItem) => {
    try {
      setBusyId(booking.id);
      setPageError("");
      setPageSuccess("");
      await partnerService.cancelBooking(booking.id);
      setPageSuccess(`Đã xử lý huỷ booking #${toShortId(booking.id)}.`);
      await reloadBookings();
    } catch (error) {
      setPageError(getErrorMessage(error, "Huỷ booking thất bại."));
    } finally {
      setBusyId("");
    }
  };

  const handleNoShow = async (booking: PartnerBookingListItem) => {
    try {
      setBusyId(booking.id);
      setPageError("");
      setPageSuccess("");
      await partnerService.setBookingNoShow(booking.id);
      setPageSuccess(`Đã đánh dấu no-show cho booking #${toShortId(booking.id)}.`);
      await reloadBookings();
    } catch (error) {
      setPageError(getErrorMessage(error, "Không đánh dấu được no-show."));
    } finally {
      setBusyId("");
    }
  };

  const openDetail = async (bookingId: string) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setSelectedDetail(null);
      const response = await partnerService.getBookingDetail(bookingId);
      setSelectedDetail(response.data);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được booking detail."));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openInvoice = async (bookingId: string) => {
    try {
      setInvoiceOpen(true);
      setInvoiceLoading(true);
      setSelectedInvoice(null);
      const response = await partnerService.getBookingInvoice(bookingId);
      setSelectedInvoice(response.data);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được invoice."));
      setInvoiceOpen(false);
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Partner Bookings"
        description="Theo dõi booking vào khách sạn của bạn, cập nhật trạng thái check-in và xử lý no-show hoặc huỷ."
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}
      {pageSuccess ? <AdminMessage tone="success" message={pageSuccess} /> : null}

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
          <option value="no_show">no_show</option>
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
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const nextStatuses = getBookingStatusTargets(booking.status);
                    const nextValue =
                      statusDrafts[booking.id] || nextStatuses[0] || "";
                    const canCancel = ["pending", "confirmed"].includes(booking.status);
                    const canNoShow = booking.status === "confirmed";

                    return (
                      <tr key={booking.id} className="border-b border-slate-100">
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
                          <div className="flex flex-wrap gap-2">
                            <AdminButton
                              variant="secondary"
                              onClick={() => void openDetail(booking.id)}
                            >
                              Detail
                            </AdminButton>
                            <AdminButton
                              variant="secondary"
                              onClick={() => void openInvoice(booking.id)}
                            >
                              Invoice
                            </AdminButton>
                            {nextStatuses.length > 0 ? (
                              <>
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
                                  {busyId === booking.id ? "Đang lưu..." : "Lưu"}
                                </AdminButton>
                              </>
                            ) : null}
                            {canCancel ? (
                              <AdminButton
                                variant="ghost"
                                onClick={() => void handleCancelBooking(booking)}
                                disabled={busyId === booking.id}
                              >
                                Huỷ booking
                              </AdminButton>
                            ) : null}
                            {canNoShow ? (
                              <AdminButton
                                variant="ghost"
                                onClick={() => void handleNoShow(booking)}
                                disabled={busyId === booking.id}
                              >
                                No-show
                              </AdminButton>
                            ) : null}
                          </div>
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

      <AdminModal
        open={detailOpen}
        title="Booking detail"
        onClose={() => setDetailOpen(false)}
      >
        {detailLoading ? (
          <p className="text-sm text-slate-500">Đang tải chi tiết booking...</p>
        ) : selectedDetail ? (
          <div className="space-y-4 text-sm text-slate-600">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">Khách</p>
                <p className="mt-2">{selectedDetail.user?.name || "--"}</p>
                <p>{selectedDetail.user?.email || "--"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">Lưu trú</p>
                <p className="mt-2">{selectedDetail.hotel?.name || "--"}</p>
                <p>
                  {formatDate(selectedDetail.check_in)} -{" "}
                  {formatDate(selectedDetail.check_out)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-medium text-slate-900">Booking</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <p>Phòng: {selectedDetail.room?.room_number || "--"}</p>
                <p>Loại phòng: {selectedDetail.room_type?.name || "--"}</p>
                <p>Trạng thái: {selectedDetail.status}</p>
                <p>Tổng tiền: {formatCurrency(selectedDetail.total_price)}</p>
              </div>
              {selectedDetail.special_requests ? (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-slate-500">
                  {selectedDetail.special_requests}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <AdminEmptyState message="Không có dữ liệu detail." />
        )}
      </AdminModal>

      <AdminModal
        open={invoiceOpen}
        title="Booking invoice"
        onClose={() => setInvoiceOpen(false)}
      >
        {invoiceLoading ? (
          <p className="text-sm text-slate-500">Đang tải invoice...</p>
        ) : selectedInvoice ? (
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Invoice ID
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {selectedInvoice.invoice_id}
              </p>
              <p className="mt-1 text-slate-500">
                Issue: {formatDateTime(selectedInvoice.issued_at)}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">Khách</p>
                <p className="mt-2">{selectedInvoice.customer?.name || "--"}</p>
                <p>{selectedInvoice.customer?.email || "--"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">Khách sạn</p>
                <p className="mt-2">{selectedInvoice.hotel?.name || "--"}</p>
                <p>{selectedInvoice.hotel?.address || "--"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="grid gap-2 md:grid-cols-2">
                <p>Phòng: {selectedInvoice.room_details.room_number || "--"}</p>
                <p>Loại phòng: {selectedInvoice.room_details.room_type || "--"}</p>
                <p>Tổng tiền: {formatCurrency(selectedInvoice.billing.total_price)}</p>
                <p>
                  Giá/đêm: {formatCurrency(selectedInvoice.billing.price_per_night)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <AdminEmptyState message="Không có dữ liệu invoice." />
        )}
      </AdminModal>
    </>
  );
};

export default PartnerBookingsPage;
