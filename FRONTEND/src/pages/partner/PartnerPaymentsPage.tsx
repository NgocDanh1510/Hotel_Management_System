import { useEffect, useMemo, useState } from "react";
import { partnerService } from "@/api/partnerService";
import type { PartnerPaymentListItem } from "@/types/partner";
import {
  AdminBadge,
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

const PartnerPaymentsPage = () => {
  const [payments, setPayments] = useState<PartnerPaymentListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    sort: "paid_at_desc",
    page: 1,
    limit: 10,
  });

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status: filters.status || undefined,
      type: filters.type || undefined,
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
        const response = await partnerService.getPayments(query);
        setPayments(response.data);
        setMeta(response.meta);
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được payments."));
      } finally {
        setLoading(false);
      }
    };

    void fetchPayments();
  }, [query]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  return (
    <>
      <AdminPageHeader
        title="Partner Payments"
        description="Theo dõi dòng tiền, giao dịch thành công và refund đi qua khách sạn của bạn."
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}

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
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100">
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-900">
                          #{toShortId(payment.id)}
                        </p>
                        <p className="text-slate-500">
                          Booking #{toShortId(payment.booking_id)}
                        </p>
                        <p className="text-slate-400">
                          {payment.transaction_id || payment.gateway}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        <p>{payment.User?.name || "--"}</p>
                        <p>{payment.User?.email || "--"}</p>
                        <p className="text-slate-400">
                          {formatDateTime(payment.paid_at || payment.created_at)}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        <p>{formatCurrency(payment.amount)}</p>
                        <p>{payment.type}</p>
                      </td>
                      <td className="px-3 py-4">
                        <AdminBadge label={payment.status} />
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
    </>
  );
};

export default PartnerPaymentsPage;
