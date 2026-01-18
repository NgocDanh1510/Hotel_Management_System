import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Filter, RefreshCcw } from "lucide-react";
import hotelService from "@/api/hotelService";
import locationService from "@/api/locationService";
import HotelCard from "@/components/HotelCard";
import {
  ClientEmptyState,
  ClientMessage,
  ClientPanel,
  ClientSection,
} from "@/components/client/ClientPrimitives";
import type { HotelListItem } from "@/types/hotel";
import type { PaginationMeta } from "@/types/common";
import type { LocationOption } from "@/types/location";
import {
  buildSearch,
  getApiErrorMessage,
  getDateAfter,
  getTomorrow,
} from "@/utils/client";

const defaultValues = {
  q: "",
  city_id: "",
  check_in: "",
  check_out: "",
  guests: "2",
  price_min: "",
  price_max: "",
  star_rating_min: "",
  star_rating_max: "",
  sort: "created_at",
};

const HotelListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    q: searchParams.get("q") || defaultValues.q,
    city_id: searchParams.get("city_id") || defaultValues.city_id,
    check_in: searchParams.get("check_in") || defaultValues.check_in,
    check_out: searchParams.get("check_out") || defaultValues.check_out,
    guests: searchParams.get("guests") || defaultValues.guests,
    price_min: searchParams.get("price_min") || defaultValues.price_min,
    price_max: searchParams.get("price_max") || defaultValues.price_max,
    star_rating_min:
      searchParams.get("star_rating_min") || defaultValues.star_rating_min,
    star_rating_max:
      searchParams.get("star_rating_max") || defaultValues.star_rating_max,
    sort: searchParams.get("sort") || defaultValues.sort,
  });

  const [cities, setCities] = useState<LocationOption[]>([]);
  const [hotels, setHotels] = useState<HotelListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await locationService.getCities();
        setCities(response.data);
      } catch {
        setCities([]);
      }
    };

    void loadCities();
  }, []);

  useEffect(() => {
    setFilters({
      q: searchParams.get("q") || defaultValues.q,
      city_id: searchParams.get("city_id") || defaultValues.city_id,
      check_in: searchParams.get("check_in") || defaultValues.check_in,
      check_out: searchParams.get("check_out") || defaultValues.check_out,
      guests: searchParams.get("guests") || defaultValues.guests,
      price_min: searchParams.get("price_min") || defaultValues.price_min,
      price_max: searchParams.get("price_max") || defaultValues.price_max,
      star_rating_min:
        searchParams.get("star_rating_min") || defaultValues.star_rating_min,
      star_rating_max:
        searchParams.get("star_rating_max") || defaultValues.star_rating_max,
      sort: searchParams.get("sort") || defaultValues.sort,
    });
  }, [searchParams]);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        setError("");

        const page = Number(searchParams.get("page") || "1");
        const response = await hotelService.getHotels({
          q: searchParams.get("q") || undefined,
          city_id: searchParams.get("city_id") || undefined,
          check_in: searchParams.get("check_in") || undefined,
          check_out: searchParams.get("check_out") || undefined,
          guests: searchParams.get("guests")
            ? Number(searchParams.get("guests"))
            : undefined,
          price_min: searchParams.get("price_min")
            ? Number(searchParams.get("price_min"))
            : undefined,
          price_max: searchParams.get("price_max")
            ? Number(searchParams.get("price_max"))
            : undefined,
          star_rating_min: searchParams.get("star_rating_min")
            ? Number(searchParams.get("star_rating_min"))
            : undefined,
          star_rating_max: searchParams.get("star_rating_max")
            ? Number(searchParams.get("star_rating_max"))
            : undefined,
          sort: searchParams.get("sort") || undefined,
          page,
          limit: 9,
        });

        setHotels(response.data);
        setMeta(response.meta);
      } catch (fetchError) {
        setError(
          getApiErrorMessage(fetchError, "Không tải được danh sách khách sạn."),
        );
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchHotels();
  }, [searchParams]);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchParams(buildSearch({ ...filters, page: 1 }));
  };

  const resetFilters = () => {
    setFilters(defaultValues);
    setSearchParams("");
  };

  const handleLoadMore = async () => {
    if (!meta?.has_next) return;

    const nextPage = Number(meta.page || 1) + 1;

    try {
      setLoadingMore(true);
      const response = await hotelService.getHotels({
        q: filters.q || undefined,
        city_id: filters.city_id || undefined,
        check_in: filters.check_in || undefined,
        check_out: filters.check_out || undefined,
        guests: filters.guests ? Number(filters.guests) : undefined,
        price_min: filters.price_min ? Number(filters.price_min) : undefined,
        price_max: filters.price_max ? Number(filters.price_max) : undefined,
        star_rating_min: filters.star_rating_min
          ? Number(filters.star_rating_min)
          : undefined,
        star_rating_max: filters.star_rating_max
          ? Number(filters.star_rating_max)
          : undefined,
        sort: filters.sort,
        page: nextPage,
        limit: 9,
      });

      setHotels((current) => [...current, ...response.data]);
      setMeta(response.meta);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Không tải thêm được dữ liệu."));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-6">
      <ClientSection
        eyebrow="Hotel Search"
        title="Tìm khách sạn phù hợp"
        description="Bộ lọc này đang map thẳng sang backend public hiện tại, nên bạn có thể test luôn luồng thật thay vì dữ liệu giả."
      >
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <ClientPanel className="h-fit space-y-5 xl:sticky xl:top-28">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Bộ lọc
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Tinh chỉnh tìm kiếm
                </h2>
              </div>
              <Filter className="text-amber-700" size={20} />
            </div>

            <form onSubmit={applyFilters} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Từ khóa
                </span>
                <input
                  value={filters.q}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      q: event.target.value,
                    }))
                  }
                  placeholder="Tên khách sạn hoặc địa chỉ"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Thành phố
                </span>
                <select
                  value={filters.city_id}
                  onChange={(event) =>
                    setFilters((current) => ({
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

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Check-in
                  </span>
                  <input
                    type="date"
                    min={getTomorrow()}
                    value={filters.check_in}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        check_in: event.target.value,
                        check_out:
                          current.check_out &&
                          current.check_out < event.target.value
                            ? getDateAfter(2)
                            : current.check_out,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Check-out
                  </span>
                  <input
                    type="date"
                    min={filters.check_in || getDateAfter(2)}
                    value={filters.check_out}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        check_out: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Số khách
                </span>
                <input
                  type="number"
                  min="1"
                  value={filters.guests}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      guests: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Giá từ
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={filters.price_min}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        price_min: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Giá đến
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={filters.price_max}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        price_max: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Sao từ
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={filters.star_rating_min}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        star_rating_min: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Sao đến
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={filters.star_rating_max}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        star_rating_max: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Sắp xếp
                </span>
                <select
                  value={filters.sort}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      sort: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                >
                  <option value="created_at">Mới cập nhật</option>
                  <option value="avg_rating">Rating cao nhất</option>
                  <option value="star_rating">Sao cao nhất</option>
                  <option value="price_asc">Giá thấp đến cao</option>
                  <option value="price_desc">Giá cao đến thấp</option>
                </select>
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Áp dụng
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  <RefreshCcw size={15} />
                  Reset
                </button>
              </div>
            </form>
          </ClientPanel>

          <div className="space-y-5">
            <ClientPanel className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Kết quả
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {loading
                    ? "Đang tìm..."
                    : `${meta?.total || 0} khách sạn phù hợp`}
                </h2>
              </div>
              <Link
                to="/"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                Quay lại trang chủ
              </Link>
            </ClientPanel>

            {error ? <ClientMessage tone="error" message={error} /> : null}

            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[360px] animate-pulse rounded-[28px] bg-white/75"
                  />
                ))}
              </div>
            ) : hotels.length === 0 ? (
              <ClientEmptyState
                title="Chưa tìm thấy khách sạn phù hợp"
                description="Thử nới bộ lọc hoặc bỏ bớt điều kiện ngày, giá và xếp hạng để xem thêm kết quả."
                actionLabel="Xóa bộ lọc"
                actionTo="/hotels"
              />
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {hotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} />
                  ))}
                </div>

                {meta?.has_next ? (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingMore ? "Đang tải..." : "Tải thêm khách sạn"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </ClientSection>
    </div>
  );
};

export default HotelListPage;
