import type { PaginationMeta } from "@/types/common";

type ErrorShape = {
  data?: {
    message?: string;
    errors?: string[];
  };
  message?: string;
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "--";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export const formatDate = (value?: string | null) => {
  if (!value) return "--";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(value));
};

export const formatCurrency = (value?: number | null, currency = "VND") => {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const getErrorMessage = (
  error: unknown,
  fallback = "Đã có lỗi xảy ra",
) => {
  const normalizedError = error as ErrorShape | undefined;
  const message = normalizedError?.data?.message || normalizedError?.message;
  const detail = normalizedError?.data?.errors?.join(", ");

  if (message && detail) {
    return `${message}: ${detail}`;
  }

  return message || fallback;
};

export const getPageFromMeta = (meta: PaginationMeta) => {
  if (meta.page) return meta.page;
  const limit = meta.limit || 10;
  const offset = meta.offset || 0;
  return Math.floor(offset / limit) + 1;
};

export const getTotalPages = (meta: PaginationMeta) => {
  const limit = meta.limit || 10;
  return Math.max(1, Math.ceil(meta.total / limit));
};

export const getOffsetFromPage = (page: number, limit: number) =>
  Math.max(0, (page - 1) * limit);

export const toShortId = (value: string) => value.slice(0, 8);

export const getBookingStatusTargets = (status: string) => {
  switch (status) {
    case "pending":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["checked_in", "cancelled"];
    case "checked_in":
      return ["checked_out"];
    default:
      return [];
  }
};

export const getStatusTone = (status: string) => {
  switch (status) {
    case "approved":
    case "confirmed":
    case "checked_in":
    case "checked_out":
    case "success":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
    case "cancellation_pending":
      return "bg-amber-100 text-amber-700";
    case "rejected":
    case "cancelled":
    case "failed":
      return "bg-rose-100 text-rose-700";
    case "refund":
    case "refunded":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};
