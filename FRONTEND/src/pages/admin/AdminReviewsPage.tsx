import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/api/adminService";
import type { AdminReviewListItem } from "@/features/admin/types";
import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminInputClassName,
  AdminMessage,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminToolbar,
} from "@/features/admin/components/AdminPrimitives";
import {
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

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState<AdminReviewListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);

  const [filters, setFilters] = useState({
    is_published: "",
    sort: "created_at_desc",
    min_rating: "",
    page: 1,
    limit: 10,
  });

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      is_published:
        filters.is_published === ""
          ? undefined
          : filters.is_published === "true",
      rating_overall_min: filters.min_rating
        ? Number(filters.min_rating)
        : undefined,
      sort: filters.sort,
      offset: getOffsetFromPage(filters.page, filters.limit),
      limit: filters.limit,
    }),
    [debouncedSearch, filters],
  );

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setPageError("");
        const response = await adminService.getAdminReviews(query);
        setReviews(response.data);
        setMeta(response.meta);
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được danh sách reviews."));
      } finally {
        setLoading(false);
      }
    };

    void fetchReviews();
  }, [query]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const reloadReviews = async () => {
    const response = await adminService.getAdminReviews(query);
    setReviews(response.data);
    setMeta(response.meta);
  };

  const toggleOne = async (review: AdminReviewListItem) => {
    try {
      setBusy(true);
      setPageError("");
      setPageSuccess("");
      await adminService.updateReview(review.id, {
        is_published: !review.is_published,
      });
      setPageSuccess(`Đã cập nhật review #${toShortId(review.id)}.`);
      await reloadReviews();
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật review thất bại."));
    } finally {
      setBusy(false);
    }
  };

  const handleBulkUpdate = async (isPublished: boolean) => {
    if (selectedIds.length === 0) return;

    try {
      setBusy(true);
      setPageError("");
      setPageSuccess("");
      await adminService.bulkPublishReviews(selectedIds, isPublished);
      setSelectedIds([]);
      setPageSuccess(
        isPublished ? "Đã publish các review đã chọn." : "Đã ẩn các review đã chọn.",
      );
      await reloadReviews();
    } catch (error) {
      setPageError(getErrorMessage(error, "Bulk update review thất bại."));
    } finally {
      setBusy(false);
    }
  };

  const allVisibleIds = reviews.map((review) => review.id);
  const allSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((reviewId) => selectedIds.includes(reviewId));

  return (
    <>
      <AdminPageHeader
        title="Review Management"
        description="Kiểm duyệt review đơn lẻ hoặc hàng loạt để test moderation flow."
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
          placeholder="Tìm comment hoặc tên user"
        />

        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={filters.is_published}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              is_published: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">published</option>
          <option value="false">hidden</option>
        </select>

        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={filters.min_rating}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              min_rating: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Mọi mức rating</option>
          <option value="5">Từ 5 sao</option>
          <option value="4">Từ 4 sao</option>
          <option value="3">Từ 3 sao</option>
          <option value="2">Từ 2 sao</option>
          <option value="1">Từ 1 sao</option>
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
          <option value="rating_overall_desc">Điểm cao hơn</option>
          <option value="rating_overall">Điểm thấp hơn</option>
        </select>

        <div className="flex flex-wrap gap-2">
          <AdminButton
            onClick={() => void handleBulkUpdate(true)}
            disabled={busy || selectedIds.length === 0}
          >
            Publish đã chọn
          </AdminButton>
          <AdminButton
            variant="secondary"
            onClick={() => void handleBulkUpdate(false)}
            disabled={busy || selectedIds.length === 0}
          >
            Hide đã chọn
          </AdminButton>
        </div>
      </AdminToolbar>

      <AdminPanel title="Danh sách reviews">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : reviews.length === 0 ? (
          <AdminEmptyState message="Không có review nào khớp bộ lọc." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) =>
                          setSelectedIds(
                            event.target.checked ? allVisibleIds : [],
                          )
                        }
                      />
                    </th>
                    <th className="px-3 py-3 font-medium">Review</th>
                    <th className="px-3 py-3 font-medium">Rating</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 align-top">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(review.id)}
                          onChange={(event) =>
                            setSelectedIds((current) =>
                              event.target.checked
                                ? [...current, review.id]
                                : current.filter((id) => id !== review.id),
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-4 align-top">
                        <p className="font-medium text-slate-900">
                          {review.User?.name || "Unknown guest"} -{" "}
                          {review.Hotel?.name || "--"}
                        </p>
                        <p className="mt-1 max-w-xl text-slate-500">
                          {review.comment || "Không có nội dung bình luận."}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          #{toShortId(review.id)} - {formatDateTime(review.created_at)}
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        <p>Overall: {review.rating_overall}/5</p>
                        <p>Cleanliness: {review.rating_cleanliness ?? "--"}</p>
                        <p>Service: {review.rating_service ?? "--"}</p>
                        <p>Location: {review.rating_location ?? "--"}</p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <AdminBadge
                          label={review.is_published ? "published" : "hidden"}
                        />
                      </td>
                      <td className="px-3 py-4 align-top">
                        <AdminButton
                          onClick={() => void toggleOne(review)}
                          disabled={busy}
                        >
                          {review.is_published ? "Ẩn review" : "Publish review"}
                        </AdminButton>
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

export default AdminReviewsPage;
