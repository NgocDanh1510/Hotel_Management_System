import { useEffect, useState } from "react";
import { partnerService } from "@/api/partnerService";
import type {
  PartnerBookingListItem,
  PartnerDashboardSummary,
  PartnerPaymentListItem,
  PartnerReviewListItem,
} from "@/types/partner";
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

const initialDashboard: PartnerDashboardSummary = {
  hotels: { total: 0, pending: 0, approved: 0, rejected: 0 },
  rooms: { total: 0, available: 0, occupied: 0, maintenance: 0 },
  bookings: {
    total: 0,
    pending: 0,
    confirmed: 0,
    checked_in: 0,
    checked_out: 0,
    cancelled: 0,
    cancellation_pending: 0,
    no_show: 0,
  },
  payments: {
    total_transactions: 0,
    successful_transactions: 0,
    gross_revenue: 0,
    pending_refund_requests: 0,
  },
  reviews: {
    published_count: 0,
    average_rating: 0,
  },
};

const PartnerDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] =
    useState<PartnerDashboardSummary>(initialDashboard);
  const [recentBookings, setRecentBookings] = useState<PartnerBookingListItem[]>(
    [],
  );
  const [recentPayments, setRecentPayments] = useState<PartnerPaymentListItem[]>(
    [],
  );
  const [recentReviews, setRecentReviews] = useState<PartnerReviewListItem[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          dashboardResponse,
          bookingsResponse,
          paymentsResponse,
          reviewsResponse,
        ] = await Promise.all([
          partnerService.getDashboard(),
          partnerService.getBookings({
            offset: 0,
            limit: 5,
            sort: "created_at_desc",
          }),
          partnerService.getPayments({
            offset: 0,
            limit: 5,
            sort: "paid_at_desc",
          }),
          partnerService.getReviews({
            offset: 0,
            limit: 5,
            sort: "created_at_desc",
          }),
        ]);

        setDashboard(dashboardResponse.data);
        setRecentBookings(bookingsResponse.data);
        setRecentPayments(paymentsResponse.data);
        setRecentReviews(reviewsResponse.data);
      } catch (fetchError) {
        setError(
          getErrorMessage(
            fetchError,
            "Không tải được dashboard partner. Kiểm tra tài khoản hotel owner và permission.",
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
        title="Partner Dashboard"
        description="Tổng quan nhanh về khách sạn của bạn, tình trạng phòng, booking mới và doanh thu hiện có."
      />

      {error ? <AdminMessage tone="error" message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          label="Hotels"
          value={loading ? "..." : dashboard.hotels.total}
          hint={`Approved ${dashboard.hotels.approved} / Pending ${dashboard.hotels.pending}`}
        />
        <AdminStatCard
          label="Rooms"
          value={loading ? "..." : dashboard.rooms.total}
          hint={`Available ${dashboard.rooms.available}`}
        />
        <AdminStatCard
          label="Bookings"
          value={loading ? "..." : dashboard.bookings.total}
          hint={`Confirmed ${dashboard.bookings.confirmed}`}
        />
        <AdminStatCard
          label="Revenue"
          value={loading ? "..." : formatCurrency(dashboard.payments.gross_revenue)}
          hint={`${dashboard.payments.successful_transactions} giao dịch thành công`}
        />
        <AdminStatCard
          label="Rating"
          value={loading ? "..." : dashboard.reviews.average_rating}
          hint={`${dashboard.reviews.published_count} review đã publish`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <AdminPanel
          title="Recent Bookings"
          description="Booking mới nhất thuộc hệ khách sạn của bạn."
        >
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <AdminEmptyState message="Chưa có booking nào." />
            ) : (
              recentBookings.map((booking) => (
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
          title="Recent Payments"
          description="Theo dõi thanh toán mới nhất đi qua khách sạn của bạn."
        >
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <AdminEmptyState message="Chưa có thanh toán nào." />
            ) : (
              recentPayments.map((payment) => (
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

        <AdminPanel
          title="Recent Reviews"
          description="Review mới nhất để bạn theo dõi trải nghiệm lưu trú."
        >
          <div className="space-y-3">
            {recentReviews.length === 0 ? (
              <AdminEmptyState message="Chưa có review nào." />
            ) : (
              recentReviews.map((review) => (
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
      </div>
    </>
  );
};

export default PartnerDashboardPage;
