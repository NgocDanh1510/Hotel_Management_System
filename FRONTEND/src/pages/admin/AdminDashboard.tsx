import { useEffect, useState } from "react";
import { adminService } from "@/api/adminService";
import type {
  AdminBookingListItem,
  AdminPaymentListItem,
  AdminReviewListItem,
} from "@/features/admin/types";
import {
  AdminBadge,
  AdminEmptyState,
  AdminMessage,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
} from "@/features/admin/components/AdminPrimitives";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getErrorMessage,
  toShortId,
} from "@/features/admin/utils";

type DashboardState = {
  usersTotal: number;
  hotelsTotal: number;
  bookingsTotal: number;
  reviewsTotal: number;
  paymentsTotal: number;
  recentBookings: AdminBookingListItem[];
  recentReviews: AdminReviewListItem[];
  recentPayments: AdminPaymentListItem[];
};

const initialState: DashboardState = {
  usersTotal: 0,
  hotelsTotal: 0,
  bookingsTotal: 0,
  reviewsTotal: 0,
  paymentsTotal: 0,
  recentBookings: [],
  recentReviews: [],
  recentPayments: [],
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardState>(initialState);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          usersResponse,
          hotelsResponse,
          bookingsResponse,
          reviewsResponse,
          paymentsResponse,
        ] = await Promise.all([
          adminService.getUsers({ page: 1, limit: 1 }),
          adminService.getAdminHotels({ offset: 0, limit: 1 }),
          adminService.getAdminBookings({
            offset: 0,
            limit: 5,
            sort: "created_at_desc",
          }),
          adminService.getAdminReviews({
            offset: 0,
            limit: 5,
            sort: "created_at_desc",
          }),
          adminService.getAdminPayments({
            offset: 0,
            limit: 5,
            sort: "paid_at_desc",
          }),
        ]);

        setDashboard({
          usersTotal: usersResponse.meta.total,
          hotelsTotal: hotelsResponse.meta.total,
          bookingsTotal: bookingsResponse.meta.total,
          reviewsTotal: reviewsResponse.meta.total,
          paymentsTotal: paymentsResponse.meta.total,
          recentBookings: bookingsResponse.data,
          recentReviews: reviewsResponse.data,
          recentPayments: paymentsResponse.data,
        });
      } catch (fetchError) {
        setError(
          getErrorMessage(
            fetchError,
            "Không tải được dữ liệu dashboard. Kiểm tra token và quyền admin.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Tổng quan nhanh để kiểm tra dữ liệu và các luồng admin quan trọng."
      />

      {error ? <AdminMessage tone="error" message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          label="Users"
          value={loading ? "..." : dashboard.usersTotal}
        />
        <AdminStatCard
          label="Hotels"
          value={loading ? "..." : dashboard.hotelsTotal}
        />
        <AdminStatCard
          label="Bookings"
          value={loading ? "..." : dashboard.bookingsTotal}
        />
        <AdminStatCard
          label="Reviews"
          value={loading ? "..." : dashboard.reviewsTotal}
        />
        <AdminStatCard
          label="Payments"
          value={loading ? "..." : dashboard.paymentsTotal}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <AdminPanel
          title="Recent Bookings"
          description="5 booking mới nhất để kiểm tra trạng thái."
        >
          <div className="space-y-3">
            {dashboard.recentBookings.length === 0 ? (
              <AdminEmptyState message="Chưa có booking nào." />
            ) : (
              dashboard.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        #{toShortId(booking.id)} -{" "}
                        {booking.user?.name || "Unknown guest"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {booking.hotel?.name || "--"} / phòng{" "}
                        {booking.room?.room_number || "--"}
                      </p>
                    </div>
                    <AdminBadge label={booking.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                    <span>{formatDate(booking.check_in)}</span>
                    <span>{formatCurrency(booking.total_price)}</span>
                    <span>{booking.guests_count} khách</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Recent Reviews"
          description="Danh sách review mới để kiểm tra duyệt."
        >
          <div className="space-y-3">
            {dashboard.recentReviews.length === 0 ? (
              <AdminEmptyState message="Chưa có review nào." />
            ) : (
              dashboard.recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {review.User?.name || "Unknown guest"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {review.Hotel?.name || "--"}
                      </p>
                    </div>
                    <AdminBadge
                      label={review.is_published ? "published" : "hidden"}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {review.comment || "Không có nội dung bình luận."}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{review.rating_overall}/5</span>
                    <span>{formatDateTime(review.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Recent Payments"
          description="Theo dõi thanh toán và refund gần nhất."
        >
          <div className="space-y-3">
            {dashboard.recentPayments.length === 0 ? (
              <AdminEmptyState message="Chưa có payment nào." />
            ) : (
              dashboard.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {payment.User?.name || "Unknown user"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Booking #{toShortId(payment.booking_id)}
                      </p>
                    </div>
                    <AdminBadge label={payment.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span>{payment.gateway}</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminPanel>
      </div>
    </>
  );
};

export default AdminDashboard;
