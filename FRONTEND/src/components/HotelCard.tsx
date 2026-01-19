import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import type { HotelListItem } from "@/types/hotel";
import { formatCurrency } from "@/utils/client";

interface HotelCardProps {
  hotel: HotelListItem;
}

const fallbackImage =
  "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=1200&q=80";

const HotelCard = ({ hotel }: HotelCardProps) => {
  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.14)]">
      <Link to={`/hotels/${hotel.slug}`} className="block">
        <div className="relative h-64 overflow-hidden">
          <img
            src={hotel.primary_image_url || fallbackImage}
            alt={hotel.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {hotel.star_rating.toFixed(1)} sao
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-2xl font-semibold">{hotel.name}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/90">
              <MapPin size={15} />
              {[hotel.district, hotel.city].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
      </Link>

      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Điểm đánh giá khách lưu trú</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {hotel.avg_rating.toFixed(1)}
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right">
            <p className="text-sm font-medium text-amber-800">
              {hotel.review_count} review
            </p>
            <p className="text-xs text-amber-700">đã xác thực</p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Giá từ
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(hotel.min_price)}
            </p>
          </div>
          <Link
            to={`/hotels/${hotel.slug}`}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
};

export default HotelCard;
