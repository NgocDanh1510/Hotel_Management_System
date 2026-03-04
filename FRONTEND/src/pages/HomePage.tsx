import { useEffect, useState } from "react";
import { ArrowRight, CalendarRange, MapPin, Search, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import hotelService from "@/api/hotelService";
import locationService from "@/api/locationService";
import HotelCard from "@/components/HotelCard";
import {
  ClientMessage,
  ClientPanel,
  ClientSection,
} from "@/components/client/ClientPrimitives";
import type { HotelListItem } from "@/types/hotel";
import type { LocationOption } from "@/types/location";
import { buildSearch, getApiErrorMessage, getDateAfter, getTomorrow } from "@/utils/client";

const defaultSearch = {
  q: "",
  city_id: "",
  check_in: getTomorrow(),
  check_out: getDateAfter(2),
  guests: "2",
};

const HomePage = () => {
  const navigate = useNavigate();
  const [searchForm, setSearchForm] = useState(defaultSearch);
  const [featuredHotels, setFeaturedHotels] = useState<HotelListItem[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomepage = async () => {
      try {
        setLoading(true);
        setError("");

        const [hotelResponse, cityResponse] = await Promise.all([
          hotelService.getHotels({ sort: "avg_rating", limit: 6 }),
          locationService.getCities(),
        ]);

        setFeaturedHotels(hotelResponse.data);
        setCities(cityResponse.data);
      } catch (fetchError) {
        setError(
          getApiErrorMessage(
            fetchError,
            "Không tải được dữ liệu trang chủ lúc này.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadHomepage();
  }, []);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(`/hotels?${buildSearch(searchForm)}`);
  };

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(140deg,#102338_0%,#153e57_42%,#c27b26_110%)] px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:px-8 sm:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_42%),radial-gradient(circle_at_bottom,_rgba(255,214,153,0.38),_transparent_34%)] lg:block" />
          <div className="relative max-w-2xl space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
              Customer Experience
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Tìm chỗ ở đúng gu, đặt phòng rõ ràng, theo dõi booking không rối.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-white/80 sm:text-base">
              Giao diện khách hàng mới bám trực tiếp trên backend hiện tại:
              xem khách sạn, kiểm tra phòng trống, tạo booking, thanh toán PayOS
              và quản lý đánh giá ở cùng một nơi.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-white/80">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                Danh sách khách sạn công khai
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                Booking theo tình trạng thật
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                Thanh toán mô phỏng end-to-end
              </span>
            </div>
          </div>
        </div>

        <ClientPanel className="bg-white/92 p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Tìm nhanh
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Bắt đầu hành trình của bạn
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Nhập nhu cầu cơ bản, mình sẽ đưa bạn tới danh sách khách sạn đã
              lọc sẵn.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Search size={16} />
                Từ khóa
              </span>
              <input
                value={searchForm.q}
                onChange={(event) =>
                  setSearchForm((current) => ({
                    ...current,
                    q: event.target.value,
                  }))
                }
                placeholder="Tên khách sạn hoặc khu vực"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin size={16} />
                Thành phố
              </span>
              <select
                value={searchForm.city_id}
                onChange={(event) =>
                  setSearchForm((current) => ({
                    ...current,
                    city_id: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              >
                <option value="">Tất cả thành phố</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <CalendarRange size={16} />
                  Check-in
                </span>
                <input
                  type="date"
                  value={searchForm.check_in}
                  min={getTomorrow()}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      check_in: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <CalendarRange size={16} />
                  Check-out
                </span>
                <input
                  type="date"
                  value={searchForm.check_out}
                  min={searchForm.check_in || getDateAfter(2)}
                  onChange={(event) =>
                    setSearchForm((current) => ({
                      ...current,
                      check_out: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Users size={16} />
                Số khách
              </span>
              <input
                type="number"
                min="1"
                value={searchForm.guests}
                onChange={(event) =>
                  setSearchForm((current) => ({
                    ...current,
                    guests: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Tìm khách sạn
              <ArrowRight size={16} />
            </button>
          </form>
        </ClientPanel>
      </section>

      {error ? <ClientMessage tone="error" message={error} /> : null}

      <ClientSection
        eyebrow="Gợi ý nổi bật"
        title="Khách sạn được khách đánh giá cao"
        description="Dữ liệu bên dưới lấy trực tiếp từ endpoint public và sắp xếp theo điểm rating."
        action={
          <Link
            to="/hotels"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            Xem tất cả
            <ArrowRight size={16} />
          </Link>
        }
      >
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[360px] animate-pulse rounded-[28px] bg-white/70"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        )}
      </ClientSection>

      <div className="grid gap-5 lg:grid-cols-3">
        {[
          {
            title: "1. Khám phá",
            description:
              "Tìm khách sạn theo tên, thành phố, khoảng giá và xếp hạng sao.",
          },
          {
            title: "2. Kiểm tra phòng trống",
            description:
              "Ngay tại trang chi tiết, khách có thể xem số phòng còn trống theo ngày.",
          },
          {
            title: "3. Quản lý sau đặt",
            description:
              "Booking, thanh toán, đánh giá và thông tin hồ sơ đều có màn riêng để theo dõi.",
          },
        ].map((item) => (
          <ClientPanel key={item.title}>
            <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {item.description}
            </p>
          </ClientPanel>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
