import { useEffect, useMemo, useState, type FormEvent } from "react";
import { adminService } from "@/api/adminService";
import type { AdminPaymentListItem } from "@/features/admin/types";
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

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState<AdminPaymentListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);

  const [filters, setFilters] = useState({
    status: "",
    type: "",
    gateway: "",
    sort: "paid_at_desc",
    page: 1,
    limit: 10,
  });

  const [refundOpen, setRefundOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<AdminPaymentListItem | null>(null);
  const [refundForm, setRefundForm] = useState({
    amount: 0,
    reason: "",
  });

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status: filters.status || undefined,
      type: filters.type || undefined,
      gateway: filters.gateway || undefined,
      sort: filters.sort,
      offset: getOffsetFromPage(filters.page, filters.limit),
      limit: filters.limit,
    }),
    [debouncedSearch, filters],
  );

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setPageError("");
        const response = await adminService.getAdminPayments(query);
        setPayments(response.data);
        setMeta(response.meta);
      } catch (error) {
        setPageError(
          getErrorMessage(error, "Không tải được danh sách payments."),
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchPayments();
  }, [query]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const reloadPayments = async () => {
    const response = await adminService.getAdminPayments(query);
    setPayments(response.data);
    setMeta(response.meta);
  };

  const handleOpenRefund = (payment: AdminPaymentListItem) => {
    setSelectedPayment(payment);
    setRefundForm({
      amount: payment.amount,
      reason: "",
    });
    setRefundOpen(true);
  };

  const handleCreateRefund = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPayment) return;

    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      await adminService.createRefund(selectedPayment.id, refundForm);
      setRefundOpen(false);
      setSelectedPayment(null);
      setPageSuccess(`Đã tạo refund cho payment #${toShortId(selectedPayment.id)}.`);
      await reloadPayments();
    } catch (error) {
      setPageError(getErrorMessage(error, "Tạo refund thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Payment Management"
        description="Theo dõi thanh toán và test flow refund trực tiếp từ admin."
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
          placeholder="Tìm transaction id hoặc email user"
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
          <option value="">Tất cả status</option>
          <option value="pending">pending</option>
          <option value="success">success</option>
          <option value="failed">failed</option>
          <option value="refunded">refunded</option>
        </select>

        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={filters.type}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              type: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Tất cả type</option>
          <option value="full_payment">full_payment</option>
          <option value="deposit">deposit</option>
          <option value="refund">refund</option>
        </select>

        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={filters.gateway}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              gateway: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Tất cả gateway</option>
          <option value="vnpay">vnpay</option>
          <option value="momo">momo</option>
          <option value="stripe">stripe</option>
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
          <option value="paid_at_desc">Thanh toán gần nhất</option>
          <option value="amount_desc">Số tiền cao hơn</option>
          <option value="created_at_desc">Tạo gần nhất</option>
        </select>
      </AdminToolbar>

      <AdminPanel title="Danh sách payments">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : payments.length === 0 ? (
          <AdminEmptyState message="Không có payment nào khớp bộ lọc." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Payment</th>
                    <th className="px-3 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Amount</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const canRefund =
                      payment.status === "success" && payment.type !== "refund";

                    return (
                      <tr key={payment.id} className="border-b border-slate-100">
                        <td className="px-3 py-4 align-top">
                          <p className="font-medium text-slate-900">
                            #{toShortId(payment.id)} - {payment.gateway}
                          </p>
                          <p className="text-slate-500">
                            Booking #{toShortId(payment.booking_id)}
                          </p>
                          <p className="text-slate-400">
                            Txn: {payment.transaction_id || "--"}
                          </p>
                        </td>
                        <td className="px-3 py-4 align-top text-slate-500">
                          <p>{payment.User?.name || "Unknown user"}</p>
                          <p>{payment.User?.email || "--"}</p>
                          <p className="text-slate-400">
                            {formatDateTime(payment.paid_at || payment.created_at)}
                          </p>
                        </td>
                        <td className="px-3 py-4 align-top text-slate-500">
                          <p>{formatCurrency(payment.amount)}</p>
                          <p>{payment.type}</p>
                        </td>
                        <td className="px-3 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <AdminBadge label={payment.status} />
                            <AdminBadge label={payment.type} />
                          </div>
                          {payment.note ? (
                            <p className="mt-2 max-w-xs text-xs text-slate-400">
                              {payment.note}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-4 align-top">
                          {canRefund ? (
                            <AdminButton
                              onClick={() => handleOpenRefund(payment)}
                            >
                              Refund
                            </AdminButton>
                          ) : (
                            <span className="text-slate-400">Không khả dụng</span>
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

      <AdminModal
        open={refundOpen}
        title="Tạo refund"
        description="Backend hỗ trợ partial refund, nên bạn có thể nhập số tiền bất kỳ hợp lệ."
        onClose={() => setRefundOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleCreateRefund}>
          <input
            type="number"
            min={1}
            className={AdminInputClassName}
            placeholder="Số tiền refund"
            value={refundForm.amount}
            onChange={(event) =>
              setRefundForm((current) => ({
                ...current,
                amount: Number(event.target.value),
              }))
            }
          />

          <textarea
            required
            className={AdminInputClassName}
            placeholder="Lý do refund"
            value={refundForm.reason}
            onChange={(event) =>
              setRefundForm((current) => ({
                ...current,
                reason: event.target.value,
              }))
            }
          />

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton
              variant="secondary"
              onClick={() => setRefundOpen(false)}
            >
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang refund..." : "Tạo refund"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  );
};

export default AdminPaymentsPage;
