import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import bookingService from "@/api/bookingService";
import paymentService from "@/api/paymentService";
import reviewService from "@/api/reviewService";
import {
  ClientMessage,
  ClientPanel,
  ClientSection,
  StatusBadge,
} from "@/components/client/ClientPrimitives";
import type { BookingDetail, BookingInvoice } from "@/types/booking";
import type { PaymentGateway } from "@/types/payment";
import type { CreateReviewRequest, UserReview } from "@/types/review";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getApiErrorMessage,
} from "@/utils/client";

const BookingDetailPage = () => {
  const { id = "" } = useParams();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [invoice, setInvoice] = useState<BookingInvoice | null>(null);
  const [myReview, setMyReview] = useState<UserReview | null>(null);
  const [gateway, setGateway] = useState<PaymentGateway>("vnpay");
  const [reviewForm, setReviewForm] = useState<CreateReviewRequest>({
    booking_id: id,
    rating_overall: 5,
    rating_cleanliness: 5,
    rating_service: 5,
    rating_location: 5,
    comment: "",
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError("");

        const [bookingResponse, reviewsResponse] = await Promise.all([
          bookingService.getBookingDetail(id),
          reviewService.listMyReviews(),
        ]);

        setBooking(bookingResponse.data);
        const existingReview =
          reviewsResponse.data.find((review) => review.booking_id === id) || null;
        setMyReview(existingReview);
      } catch (fetchError) {
        setError(
          getApiErrorMessage(fetchError, "Không tải được chi tiết booking."),
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchBooking();
  }, [id]);

  const refreshBooking = async () => {
    const bookingResponse = await bookingService.getBookingDetail(id);
    setBooking(bookingResponse.data);
  };

  const handleCancelBooking = async () => {
    try {
      setProcessing(true);
      setMessage("");
      await bookingService.cancelBooking(id);
      await refreshBooking();
      setMessage("Đã gửi yêu cầu hủy booking.");
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Không hủy được booking."));
    } finally {
      setProcessing(false);
    }
  };

  const handlePayNow = async () => {
    if (!booking) return;

    try {
      setProcessing(true);
      setMessage("");
      setError("");

      const paymentResponse = await paymentService.createPayment({
        booking_id: booking.id,
        amount: booking.total_price,
        gateway,
      });

      await paymentService.mockCompletePayment(paymentResponse.data.payment_id);
      await refreshBooking();
      setMessage(
        `Đã hoàn tất thanh toán demo qua ${gateway.toUpperCase()}. Booking đã được chuyển sang confirmed.`,
      );
    } catch (actionError) {
      setError(
        getApiErrorMessage(actionError, "Không hoàn tất được thanh toán."),
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleLoadInvoice = async () => {
    try {
      setProcessing(true);
      const response = await bookingService.getBookingInvoice(id);
      setInvoice(response.data);
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Không tải được invoice."));
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setProcessing(true);
      setError("");
      const response = await reviewService.createReview(reviewForm);
      setMyReview(response.data);
      setMessage("Đã gửi đánh giá. Review sẽ hiển thị sau khi được duyệt.");
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Không gửi được đánh giá."));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="h-[55vh] animate-pulse rounded-[32px] bg-white/70" />;
  }

  if (!booking) {
    return (
      <ClientMessage
        tone="error"
        message={error || "Không tìm thấy booking này."}
      />
    );
  }

  const canPay =
    booking.status === "pending" &&
    !booking.payments.some((payment) => payment.status === "success");
  const canCancel = ["pending", "confirmed"].includes(booking.status);
  const canReview = booking.status === "checked_out" && !myReview;

  return (
    <div className="space-y-6">
      <ClientSection
        eyebrow="Booking Detail"
        title={`Booking tại ${booking.hotel.name}`}
        description="Trang này gom chi tiết booking, thanh toán demo, invoice và review sau lưu trú vào cùng một chỗ."
      >
        {message ? <ClientMessage tone="success" message={message} /> : null}
        {error ? <ClientMessage tone="error" message={error} /> : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <ClientPanel className="space-y-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                    Booking #{booking.id.slice(0, 8)}
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    {booking.room_type.name} - Phòng {booking.room.room_number}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Tạo lúc {formatDateTime(booking.created_at)}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Check-in
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatDate(booking.check_in)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Check-out
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatDate(booking.check_out)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Guests
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {booking.guests_count}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Total
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatCurrency(booking.total_price)}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Thông tin khách sạn
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {booking.hotel.name}
                    <br />
                    {booking.hotel.address || "Địa chỉ sẽ hiển thị khi backend trả về chi tiết đầy đủ."}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Thông tin khách đặt
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {booking.user.name}
                    <br />
                    {booking.user.email}
                  </p>
                </div>
              </div>

              {booking.special_requests ? (
                <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  <p className="font-semibold">Yêu cầu riêng</p>
                  <p className="mt-2">{booking.special_requests}</p>
                </div>
              ) : null}
            </ClientPanel>

            <ClientPanel className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                    Payments
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Lịch sử thanh toán
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLoadInvoice()}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  Xem invoice
                </button>
              </div>

              {booking.payments.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Chưa có giao dịch thanh toán nào cho booking này.
                </p>
              ) : (
                <div className="space-y-3">
                  {booking.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-2xl border border-slate-200 px-4 py-4"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {payment.gateway.toUpperCase()} - {payment.type}
                          </p>
                          <p className="text-sm text-slate-500">
                            {payment.transaction_id || "Chưa có transaction id"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={payment.status} />
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ClientPanel>

            {invoice ? (
              <ClientPanel className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                    Invoice
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {invoice.invoice_id}
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">Stay details</p>
                    <p className="mt-2">
                      {formatDate(invoice.stay_details.check_in)} -{" "}
                      {formatDate(invoice.stay_details.check_out)}
                    </p>
                    <p className="mt-1">
                      {invoice.stay_details.guests} khách
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">Billing</p>
                    <p className="mt-2">
                      Giá mỗi đêm:{" "}
                      {formatCurrency(invoice.billing.price_per_night)}
                    </p>
                    <p className="mt-1">
                      Tổng cộng: {formatCurrency(invoice.billing.total_price)}
                    </p>
                  </div>
                </div>
              </ClientPanel>
            ) : null}

            <ClientPanel className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Review
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Đánh giá sau lưu trú
                </h2>
              </div>

              {myReview ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">
                    Bạn đã gửi review cho booking này.
                  </p>
                  <p className="mt-2">
                    Điểm tổng: {myReview.rating_overall}/5 -{" "}
                    {myReview.is_published ? "Đã hiển thị công khai" : "Đang chờ duyệt"}
                  </p>
                  <Link
                    to="/me/reviews"
                    className="mt-3 inline-flex rounded-full border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-white"
                  >
                    Quản lý review của tôi
                  </Link>
                </div>
              ) : canReview ? (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["rating_overall", "Tổng"],
                      ["rating_cleanliness", "Sạch sẽ"],
                      ["rating_service", "Dịch vụ"],
                      ["rating_location", "Vị trí"],
                    ].map(([field, label]) => (
                      <label key={field} className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          {label}
                        </span>
                        <select
                          value={String(reviewForm[field as keyof CreateReviewRequest] || 5)}
                          onChange={(event) =>
                            setReviewForm((current) => ({
                              ...current,
                              [field]: Number(event.target.value),
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                        >
                          {[5, 4, 3, 2, 1].map((score) => (
                            <option key={score} value={score}>
                              {score}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                  <textarea
                    rows={4}
                    value={reviewForm.comment || ""}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        comment: event.target.value,
                      }))
                    }
                    placeholder="Chia sẻ trải nghiệm của bạn"
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={processing}
                    className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Gửi đánh giá
                  </button>
                </form>
              ) : (
                <p className="text-sm text-slate-600">
                  Review chỉ mở khi booking đã hoàn tất lưu trú (`checked_out`).
                </p>
              )}
            </ClientPanel>
          </div>

          <div className="space-y-5 xl:sticky xl:top-28 xl:h-fit">
            <ClientPanel className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Quick actions
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Thao tác nhanh
                </h2>
              </div>

              {canPay ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Cổng thanh toán demo
                    </span>
                    <select
                      value={gateway}
                      onChange={(event) =>
                        setGateway(event.target.value as PaymentGateway)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                    >
                      <option value="vnpay">VNPAY</option>
                      <option value="momo">MoMo</option>
                      <option value="stripe">Stripe</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => void handlePayNow()}
                    disabled={processing}
                    className="w-full rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Thanh toán {formatCurrency(booking.total_price)}
                  </button>
                </>
              ) : null}

              {canCancel ? (
                <button
                  type="button"
                  onClick={() => void handleCancelBooking()}
                  disabled={processing}
                  className="w-full rounded-full border border-rose-300 px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Hủy booking
                </button>
              ) : null}

              <Link
                to="/me/bookings"
                className="inline-flex w-full justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                Quay lại danh sách booking
              </Link>
            </ClientPanel>
          </div>
        </div>
      </ClientSection>
    </div>
  );
};

export default BookingDetailPage;
