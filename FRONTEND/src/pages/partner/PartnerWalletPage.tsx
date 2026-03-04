import { useEffect, useMemo, useState, type FormEvent } from "react";
import { partnerService } from "@/api/partnerService";
import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminInputClassName,
  AdminMessage,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminStatCard,
  AdminToolbar,
} from "@/features/admin/components/AdminPrimitives";
import {
  formatCurrency,
  formatDateTime,
  getErrorMessage,
  getOffsetFromPage,
  toShortId,
} from "@/features/admin/utils";
import type { PaginationMeta } from "@/types/common";
import type {
  CreateWithdrawalPayload,
  PartnerWalletOverview,
  WithdrawalRequest,
} from "@/types/wallet";

const defaultMeta: PaginationMeta = {
  total: 0,
  offset: 0,
  limit: 10,
  has_next: false,
};

const defaultForm: CreateWithdrawalPayload = {
  amount: 0,
  bank_name: "",
  bank_account_number: "",
  bank_account_name: "",
  bank_bin: "",
};

const PartnerWalletPage = () => {
  const [walletOverview, setWalletOverview] =
    useState<PartnerWalletOverview | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
  });
  const [form, setForm] = useState<CreateWithdrawalPayload>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const query = useMemo(
    () => ({
      status: filters.status || undefined,
      offset: getOffsetFromPage(filters.page, filters.limit),
      limit: filters.limit,
    }),
    [filters],
  );

  const loadData = async () => {
    const [walletResponse, withdrawalsResponse] = await Promise.all([
      partnerService.getWallet(),
      partnerService.getWithdrawals(query),
    ]);
    setWalletOverview(walletResponse.data);
    setWithdrawals(withdrawalsResponse.data);
    setMeta(withdrawalsResponse.meta);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setPageError("");
        await loadData();
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được ví partner."));
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [query]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      await partnerService.createWithdrawal({
        ...form,
        amount: Number(form.amount),
      });
      setForm(defaultForm);
      setPageSuccess("Đã gửi yêu cầu rút tiền.");
      await loadData();
    } catch (error) {
      setPageError(getErrorMessage(error, "Không gửi được yêu cầu rút tiền."));
    } finally {
      setSubmitting(false);
    }
  };

  const wallet = walletOverview?.wallet;

  return (
    <>
      <AdminPageHeader
        title="Partner Wallet"
        description="Theo dõi số dư chờ xử lý, số dư có thể rút và gửi yêu cầu rút tiền."
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}
      {pageSuccess ? (
        <AdminMessage tone="success" message={pageSuccess} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          label="Chờ xử lý"
          value={loading ? "..." : formatCurrency(wallet?.pending_balance || 0)}
        />
        <AdminStatCard
          label="Có thể rút"
          value={loading ? "..." : formatCurrency(wallet?.available_balance || 0)}
        />
        <AdminStatCard
          label="Đang rút"
          value={
            loading
              ? "..."
              : formatCurrency(wallet?.withdrawal_pending_balance || 0)
          }
        />
        <AdminStatCard
          label="Tổng đã ghi nhận"
          value={loading ? "..." : formatCurrency(wallet?.total_earned || 0)}
        />
        <AdminStatCard
          label="Tổng đã rút"
          value={loading ? "..." : formatCurrency(wallet?.total_withdrawn || 0)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <AdminPanel title="Gửi yêu cầu rút tiền">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Số tiền
              </span>
              <input
                type="number"
                min="1"
                value={form.amount || ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: Number(event.target.value),
                  }))
                }
                className={AdminInputClassName}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Ngân hàng
              </span>
              <input
                value={form.bank_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bank_name: event.target.value,
                  }))
                }
                className={AdminInputClassName}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Số tài khoản
              </span>
              <input
                value={form.bank_account_number}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bank_account_number: event.target.value,
                  }))
                }
                className={AdminInputClassName}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Chủ tài khoản
              </span>
              <input
                value={form.bank_account_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bank_account_name: event.target.value,
                  }))
                }
                className={AdminInputClassName}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Bank BIN
              </span>
              <input
                value={form.bank_bin || ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bank_bin: event.target.value,
                  }))
                }
                className={AdminInputClassName}
              />
            </label>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </AdminButton>
          </form>
        </AdminPanel>

        <AdminPanel title="Lịch sử ví gần đây">
          {loading ? (
            <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
          ) : !walletOverview?.recent_transactions.length ? (
            <AdminEmptyState message="Chưa có giao dịch ví nào." />
          ) : (
            <div className="space-y-3">
              {walletOverview.recent_transactions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{item.type}</p>
                      <p className="text-xs text-slate-500">
                        {item.booking_id
                          ? `Booking #${toShortId(item.booking_id)}`
                          : item.withdrawal_request_id
                            ? `Withdrawal #${toShortId(item.withdrawal_request_id)}`
                            : "Ledger"}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </div>

      <AdminToolbar>
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
          <option value="paid">paid</option>
          <option value="rejected">rejected</option>
        </select>
      </AdminToolbar>

      <AdminPanel title="Yêu cầu rút tiền">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : withdrawals.length === 0 ? (
          <AdminEmptyState message="Chưa có yêu cầu rút tiền nào." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Request</th>
                    <th className="px-3 py-3 font-medium">Bank</th>
                    <th className="px-3 py-3 font-medium">Amount</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-900">
                          #{toShortId(item.id)}
                        </p>
                        <p className="text-slate-400">
                          {formatDateTime(item.created_at)}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        <p>{item.bank_name}</p>
                        <p>{item.bank_account_number}</p>
                        <p>{item.bank_account_name}</p>
                      </td>
                      <td className="px-3 py-4 font-semibold text-slate-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-3 py-4">
                        <AdminBadge label={item.status} />
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

export default PartnerWalletPage;
