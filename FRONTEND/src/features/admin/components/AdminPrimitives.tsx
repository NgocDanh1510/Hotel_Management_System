import type {
  ButtonHTMLAttributes,
  PropsWithChildren,
  ReactNode,
} from "react";
import type { PaginationMeta } from "@/types/common";
import { getPageFromMeta, getStatusTone, getTotalPages } from "../utils";

export const AdminPageHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {description ? (
        <p className="text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export const AdminPanel = ({
  title,
  description,
  children,
}: PropsWithChildren<{ title?: string; description?: string }>) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    {title || description ? (
      <div className="border-b border-slate-200 px-5 py-4">
        {title ? (
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        ) : null}
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
    ) : null}
    <div className="p-5">{children}</div>
  </section>
);

export const AdminToolbar = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-center">
    {children}
  </div>
);

export const AdminInputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500";

export const AdminButton = ({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger" | "ghost";
  }
>) => {
  const variantClassName =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-700"
      : variant === "secondary"
        ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
        : variant === "danger"
          ? "bg-rose-600 text-white hover:bg-rose-500"
          : "bg-transparent text-slate-700 hover:bg-slate-100";

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClassName} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const AdminBadge = ({ label }: { label: string }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(
      label,
    )}`}
  >
    {label}
  </span>
);

export const AdminMessage = ({
  tone,
  message,
}: {
  tone: "success" | "error" | "info";
  message: string;
}) => {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${toneClassName}`}>
      {message}
    </div>
  );
};

export const AdminEmptyState = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
    {message}
  </div>
);

export const AdminStatCard = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
  </div>
);

export const AdminModal = ({
  open,
  title,
  description,
  children,
  onClose,
}: PropsWithChildren<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
}>) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const AdminPagination = ({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) => {
  const currentPage = getPageFromMeta(meta);
  const totalPages = getTotalPages(meta);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Tổng {meta.total} mục, trang {currentPage}/{totalPages}
      </span>
      <div className="flex items-center gap-2">
        <AdminButton
          variant="secondary"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Trước
        </AdminButton>
        <AdminButton
          variant="secondary"
          disabled={!meta.has_next}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau
        </AdminButton>
      </div>
    </div>
  );
};
