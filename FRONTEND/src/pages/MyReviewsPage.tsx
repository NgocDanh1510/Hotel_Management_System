import { useEffect, useState } from "react";
import reviewService from "@/api/reviewService";
import {
  ClientEmptyState,
  ClientMessage,
  ClientPanel,
  ClientSection,
} from "@/components/client/ClientPrimitives";
import type { UserReview } from "@/types/review";
import { formatDate, getApiErrorMessage } from "@/utils/client";

const MyReviewsPage = () => {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.listMyReviews();
      setReviews(response.data);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Không tải được review của bạn."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await reviewService.deleteMyReview(id);
      setMessage("Đã xóa review.");
      await fetchReviews();
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Không xóa được review."));
    }
  };

  const handleUpdate = async (review: UserReview) => {
    try {
      await reviewService.updateMyReview(review.id, {
        booking_id: review.booking_id,
        rating_overall: review.rating_overall,
        rating_cleanliness: review.rating_cleanliness || undefined,
        rating_service: review.rating_service || undefined,
        rating_location: review.rating_location || undefined,
        comment: commentDraft,
      });
      setEditingReviewId(null);
      setCommentDraft("");
      setMessage("Đã cập nhật review. Review sẽ quay về trạng thái chờ duyệt.");
      await fetchReviews();
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Không cập nhật được review."));
    }
  };

  return (
    <div className="space-y-6">
      <ClientSection
        eyebrow="My Reviews"
        title="Quản lý các đánh giá đã gửi"
        description="Bạn có thể sửa hoặc xóa review đã viết; khi sửa, backend sẽ đưa review về trạng thái chờ duyệt lại."
      >
        {message ? <ClientMessage tone="success" message={message} /> : null}
        {error ? <ClientMessage tone="error" message={error} /> : null}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-[28px] bg-white/70"
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <ClientEmptyState
            title="Bạn chưa gửi review nào"
            description="Sau khi hoàn tất lưu trú và đánh giá ở trang booking detail, review của bạn sẽ xuất hiện ở đây."
            actionLabel="Xem booking của tôi"
            actionTo="/me/bookings"
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ClientPanel key={review.id} className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                      {review.Hotel?.name || "Khách sạn"}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                      {review.rating_overall}/5
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Gửi ngày {formatDate(review.created_at)}
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                    {review.is_published ? "Đang hiển thị" : "Chờ duyệt"}
                  </div>
                </div>

                {editingReviewId === review.id ? (
                  <div className="space-y-3">
                    <textarea
                      rows={4}
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => void handleUpdate(review)}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                      >
                        Lưu chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReviewId(null);
                          setCommentDraft("");
                        }}
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    {review.comment || "Bạn chưa để lại nội dung bình luận."}
                  </p>
                )}

                {editingReviewId !== review.id ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(review.id);
                        setCommentDraft(review.comment || "");
                      }}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                    >
                      Sửa review
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(review.id)}
                      className="rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                    >
                      Xóa review
                    </button>
                  </div>
                ) : null}
              </ClientPanel>
            ))}
          </div>
        )}
      </ClientSection>
    </div>
  );
};

export default MyReviewsPage;
