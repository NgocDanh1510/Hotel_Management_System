import { useEffect, useState } from "react";
import paymentService from "@/api/paymentService";
import {
  ClientEmptyState,
  ClientMessage,
  ClientPanel,
  ClientSection,
  StatusBadge,
} from "@/components/client/ClientPrimitives";
import type { UserPayment } from "@/types/payment";
import { formatCurrency, formatDateTime, getApiErrorMessage } from "@/utils/client";

const MyPaymentsPage = () => {
  const [payments, setPayments] = useState<UserPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await paymentService.listMyPayments();
        setPayments(response.data);
      } catch (fetchError) {
        setError(
          getApiErrorMessage(fetchError, "Không tải được lịch sử thanh toán."),
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchPayments();
  }, []);

  return (
    <div className="space-y-6">
      <ClientSection
        eyebrow="My Payments"
        title="Lịch sử thanh toán của bạn"
        description="Theo dõi giao dịch thành công, refund hoặc pending ngay trên dữ liệu backend thật."
      >
        {error ? <ClientMessage tone="error" message={error} /> : null}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[28px] bg-white/70"
              />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <ClientEmptyState
            title="Chưa có giao dịch nào"
            description="Sau khi thanh toán booking, lịch sử giao dịch sẽ xuất hiện tại đây."
            actionLabel="Xem booking của tôi"
            actionTo="/me/bookings"
          />
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <ClientPanel key={payment.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                      {payment.gateway.toUpperCase()}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatCurrency(payment.amount)}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Booking #{payment.Booking?.id?.slice(0, 8) || "--"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateTime(payment.paid_at || payment.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <StatusBadge status={payment.status} />
                    <p className="text-sm text-slate-500">{payment.type}</p>
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

export default MyPaymentsPage;
