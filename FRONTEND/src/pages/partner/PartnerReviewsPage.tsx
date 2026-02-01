import { useEffect, useMemo, useState } from "react";
import { partnerService } from "@/api/partnerService";
import type { PartnerReviewListItem } from "@/types/partner";
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
  formatDateTime,
  getErrorMessage,
  getOffsetFromPage,
} from "@/features/admin/utils";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { PaginationMeta } from "@/types/common";

const defaultMeta: PaginationMeta = {
  total: 0,
  offset: 0,
  limit: 10,
  has_next: false,
};

const PartnerReviewsPage = () => {
  const [reviews, setReviews] = useState<PartnerReviewListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const [filters, setFilters] = useState({
    is_published: "",
    sort: "created_at_desc",
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
        const response = await partnerService.getReviews(query);
        setReviews(response.data);
        setMeta(response.meta);
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được reviews."));
      } finally {
        setLoading(false);
      }
    };

    void fetchReviews();
  }, [query]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  return (
    <>
      <AdminPageHeader
        title="Partner Reviews"
        description="Theo dõi review thuộc khách sạn của bạn. Phần reply hoặc flag sẽ được nối thêm khi backend hoàn thiện chức năng."
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}

      <AdminToolbar>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className={`${AdminInputClassName} md:max-w-xs`}
          placeholder="Tìm theo tên khách hoặc nội dung review"
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
          <option value="">Tất cả hiển thị</option>
          <option value="true">published</option>
          <option value="false">hidden</option>
        </select>
      </AdminToolbar>

      <AdminPanel title="Danh sách reviews">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : reviews.length === 0 ? (
          <AdminEmptyState message="Không có review nào khớp bộ lọc." />
        ) : (
          <>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {review.User?.name || "Unknown guest"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {review.Hotel?.name || "--"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminBadge label={`${review.rating_overall}/5`} />
                      <AdminBadge
                        label={review.is_published ? "published" : "hidden"}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {review.comment || "Không có nội dung bình luận."}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    {formatDateTime(review.created_at)}
                  </p>
                </div>
              ))}
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

export default PartnerReviewsPage;
