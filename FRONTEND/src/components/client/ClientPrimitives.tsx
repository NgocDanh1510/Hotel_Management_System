import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router-dom";
import { getBookingStatusTone } from "@/utils/client";

export const ClientSection = ({
  eyebrow,
  title,
  description,
  action,
  children,
}: PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
}>) => (
  <section className="space-y-5">
    {title || description || action ? (
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    ) : null}
    {children}
  </section>
);

export const ClientPanel = ({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) => (
  <div
    className={`rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur ${className}`}
  >
    {children}
  </div>
);

export const ClientMessage = ({
  tone,
  message,
}: {
  tone: "success" | "error" | "info";
  message: string;
}) => {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-sky-200 bg-sky-50 text-sky-800";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClassName}`}>
      {message}
    </div>
  );
};

export const ClientEmptyState = ({
  title,
  description,
  actionLabel,
  actionTo,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}) => (
  <ClientPanel className="border-dashed text-center">
    <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
      {description}
    </p>
    {actionLabel && actionTo ? (
      <Link
        to={actionTo}
        className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        {actionLabel}
      </Link>
    ) : null}
  </ClientPanel>
);

export const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getBookingStatusTone(
      status,
    )}`}
  >
    {status.replaceAll("_", " ")}
  </span>
);
