import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import bookingService from "@/api/bookingService";
import {
  ClientEmptyState,
  ClientMessage,
  ClientPanel,
  ClientSection,
  StatusBadge,
} from "@/components/client/ClientPrimitives";
import type { BookingListItem, BookingStatus } from "@/types/booking";
import type { PaginationMeta } from "@/types/common";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/utils/client";

const statuses: Array<{ label: string; value: "" | BookingStatus }> = [
  { label: "Tất cả", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Checked in", value: "checked_in" },
  { label: "Checked out", value: "checked_out" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refund pending", value: "cancellation_pending" },
];

const MyBookingsPage = () => {
  const [status, setStatus] = useState<"" | BookingStatus>("");
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await bookingService.listMyBookings({
          status: status || undefined,
          sort: "created_at",
          offset: 0,
          limit: 20,
        });

        setBookings(response.data);
        setMeta(response.meta);
      } catch (fetchError) {
        setError(
          getApiErrorMessage(fetchError, "Không tải được danh sách booking."),
        );
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchBookings();
  }, [status]);

  return (
    <div className="space-y-6">
      <ClientSection
        eyebrow="My Bookings"
        title="Theo dõi tất cả booking của bạn"
        description="Trang này dùng endpoint `user/bookings`, nên rất tiện để test quyền guest và các trạng thái booking trên backend."
      >
        <ClientPanel className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              {loading ? "Đang đồng bộ..." : `Tổng ${meta?.total || 0} booking`}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Lịch sử đặt phòng
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {statuses.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setStatus(item.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  status === item.value
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </ClientPanel>

        {error ? <ClientMessage tone="error" message={error} /> : null}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-[28px] bg-white/70"
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <ClientEmptyState
            title="Bạn chưa có booking nào"
            description="Sau khi chọn khách sạn và tạo booking ở trang chi tiết, lịch sử của bạn sẽ xuất hiện ở đây."
            actionLabel="Tìm khách sạn"
            actionTo="/hotels"
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <ClientPanel key={booking.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                        {booking.hotel_name}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                        {booking.room_type_name} - Phòng {booking.room_number}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      <span>{formatDate(booking.check_in)}</span>
                      <span>{formatDate(booking.check_out)}</span>
                      <span>{booking.guests_count} khách</span>
                      <span>{formatCurrency(booking.total_price)}</span>
                    </div>
                    {booking.special_requests ? (
                      <p className="text-sm leading-6 text-slate-500">
                        Yêu cầu riêng: {booking.special_requests}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <StatusBadge status={booking.status} />
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </ClientPanel>
            ))}
          </div>
        )}
      </ClientSection>
    </div>
  );
};

export default MyBookingsPage;
