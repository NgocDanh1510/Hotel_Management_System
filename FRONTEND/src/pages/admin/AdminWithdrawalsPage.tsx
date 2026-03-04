import { useEffect, useMemo, useState, type FormEvent } from "react";
import { adminService } from "@/api/adminService";
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
import type { WithdrawalRequest } from "@/types/wallet";

const defaultMeta: PaginationMeta = {
  total: 0,
  offset: 0,
  limit: 10,
  has_next: false,
};

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
  });
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [processForm, setProcessForm] = useState({
    status: "paid" as "paid" | "rejected",
    admin_note: "",
    transfer_reference: "",
  });

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status: filters.status || undefined,
      offset: getOffsetFromPage(filters.page, filters.limit),
      limit: filters.limit,
    }),
    [debouncedSearch, filters],
  );

  const loadWithdrawals = async () => {
    const response = await adminService.getWithdrawals(query);
    setWithdrawals(response.data);
    setMeta(response.meta);
  };

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        setLoading(true);
        setPageError("");
        await loadWithdrawals();
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được withdrawal."));
      } finally {
        setLoading(false);
      }
    };

    void fetchWithdrawals();
  }, [query]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const openProcessModal = (
    withdrawal: WithdrawalRequest,
    status: "paid" | "rejected",
  ) => {
    setSelectedWithdrawal(withdrawal);
    setProcessForm({
      status,
      admin_note: "",
      transfer_reference: "",
    });
  };

  const handleProcess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWithdrawal) return;

    try {
      setSubmitting(true);
      setPageError("");
      setPageSuccess("");
      await adminService.processWithdrawal(selectedWithdrawal.id, processForm);
      setPageSuccess(
        `Đã cập nhật withdrawal #${toShortId(selectedWithdrawal.id)}.`,
      );
      setSelectedWithdrawal(null);
      await loadWithdrawals();
    } catch (error) {
      setPageError(getErrorMessage(error, "Không xử lý được withdrawal."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Withdrawal Management"
        description="Duyệt thủ công các yêu cầu rút tiền của partner sau khi đối soát chuyển khoản."
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
          placeholder="Tìm tài khoản hoặc mã chuyển khoản"
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
          <option value="paid">paid</option>
          <option value="rejected">rejected</option>
        </select>
      </AdminToolbar>

      <AdminPanel title="Yêu cầu rút tiền">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : withdrawals.length === 0 ? (
          <AdminEmptyState message="Không có withdrawal nào khớp bộ lọc." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Request</th>
                    <th className="px-3 py-3 font-medium">Partner</th>
                    <th className="px-3 py-3 font-medium">Bank</th>
                    <th className="px-3 py-3 font-medium">Amount</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 align-top">
                        <p className="font-medium text-slate-900">
                          #{toShortId(item.id)}
                        </p>
                        <p className="text-slate-400">
                          {formatDateTime(item.created_at)}
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        <p>{item.partner?.name || "--"}</p>
                        <p>{item.partner?.email || "--"}</p>
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        <p>{item.bank_name}</p>
                        <p>{item.bank_account_number}</p>
                        <p>{item.bank_account_name}</p>
                      </td>
                      <td className="px-3 py-4 align-top font-semibold text-slate-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <AdminBadge label={item.status} />
                        {item.transfer_reference ? (
                          <p className="mt-2 text-xs text-slate-400">
                            Ref: {item.transfer_reference}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-4 align-top">
                        {item.status === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <AdminButton
                              onClick={() => openProcessModal(item, "paid")}
                            >
                              Paid
                            </AdminButton>
                            <AdminButton
                              variant="danger"
                              onClick={() => openProcessModal(item, "rejected")}
                            >
                              Reject
                            </AdminButton>
                          </div>
                        ) : (
                          <span className="text-slate-400">Đã xử lý</span>
                        )}
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

      <AdminModal
        open={Boolean(selectedWithdrawal)}
        title={
          processForm.status === "paid"
            ? "Xác nhận đã thanh toán"
            : "Từ chối yêu cầu rút tiền"
        }
        onClose={() => setSelectedWithdrawal(null)}
      >
        <form onSubmit={handleProcess} className="space-y-4">
          {selectedWithdrawal ? (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                #{toShortId(selectedWithdrawal.id)} -{" "}
                {formatCurrency(selectedWithdrawal.amount)}
              </p>
              <p className="mt-1">
                {selectedWithdrawal.bank_name} /{" "}
                {selectedWithdrawal.bank_account_number}
              </p>
            </div>
          ) : null}

          {processForm.status === "paid" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Mã chuyển khoản
              </span>
              <input
                value={processForm.transfer_reference}
                onChange={(event) =>
                  setProcessForm((current) => ({
                    ...current,
                    transfer_reference: event.target.value,
                  }))
                }
                className={AdminInputClassName}
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Ghi chú admin
            </span>
            <textarea
              rows={4}
              value={processForm.admin_note}
              onChange={(event) =>
                setProcessForm((current) => ({
                  ...current,
                  admin_note: event.target.value,
                }))
              }
              className={AdminInputClassName}
            />
          </label>

          <div className="flex justify-end gap-2">
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => setSelectedWithdrawal(null)}
            >
              Đóng
            </AdminButton>
            <AdminButton
              type="submit"
              variant={processForm.status === "paid" ? "primary" : "danger"}
              disabled={submitting}
            >
              {submitting ? "Đang lưu..." : "Xác nhận"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  );
};

export default AdminWithdrawalsPage;
