import React, { useState, useEffect, useCallback } from "react";
import hotelService from "@/api/hotelService";
import HotelCard from "@/components/HotelCard";
import type { HotelListItem } from "@/types/hotel";
import type { PaginationMeta } from "@/types/common";

const HotelListPage: React.FC = () => {
  // Active filters applied to the API call
  const [activeFilters, setActiveFilters] = useState({
    q: "",
    city: "",
    price_min: "",
    price_max: "",
    star_rating_min: "",
    star_rating_max: "",
    check_in: "",
    check_out: "",
    guests: "",
    sort: "created_at",
  });

  // Local form state for the filter bar
  const [formState, setFormState] = useState({ ...activeFilters });

  const [hotels, setHotels] = useState<HotelListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHotels = useCallback(
    async (filters: typeof activeFilters, page: number = 1, append: boolean = false) => {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);

      try {
        // Clean up empty filters
        const params: Record<string, any> = { page, limit: 12 };
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== "" && value !== null && value !== undefined) {
            params[key] = value;
          }
        });

        const { data, meta: paginationMeta } = await hotelService.getHotels(params);

        if (append) {
          setHotels((prev) => [...prev, ...data]);
        } else {
          setHotels(data);
        }
        setMeta(paginationMeta);
      } catch (err: any) {
        setError(err.message || "Failed to load hotels. Please try again later.");
        if (!append) setHotels([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Fetch on mount and when activeFilters change
  useEffect(() => {
    fetchHotels(activeFilters, 1, false);
  }, [activeFilters, fetchHotels]);

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    
    // For selects (like sort or city), we can auto-apply the filter
    if (e.target.tagName === "SELECT") {
      setActiveFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle Search button click
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters({ ...formState });
  };

  // Handle Load More
  const handleLoadMore = () => {
    if (meta && meta.has_next) {
      const nextPage = (meta.page || 1) + 1;
      fetchHotels(activeFilters, nextPage, true);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Find Your Perfect Stay</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Filters */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Search & Filters
              </h2>

              <form onSubmit={handleSearch} className="space-y-5">
                {/* Search Term */}
                <div>
                  <label htmlFor="q" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    id="q"
                    name="q"
                    value={formState.q}
                    onChange={handleInputChange}
                    placeholder="Hotel name, city, address..."
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <select
                    id="city"
                    name="city"
                    value={formState.city}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  >
                    <option value="">All Cities</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Nha Trang">Nha Trang</option>
                    <option value="Phú Quốc">Phú Quốc</option>
                    <option value="Đà Lạt">Đà Lạt</option>
                  </select>
                </div>

                {/* Dates & Guests */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="check_in" className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                    <input
                      type="date"
                      id="check_in"
                      name="check_in"
                      value={formState.check_in}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label htmlFor="check_out" className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                    <input
                      type="date"
                      id="check_out"
                      name="check_out"
                      value={formState.check_out}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                  <input
                    type="number"
                    id="guests"
                    name="guests"
                    min="1"
                    value={formState.guests}
                    onChange={handleInputChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range (VND)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      name="price_min"
                      placeholder="Min"
                      min="0"
                      value={formState.price_min}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                    <input
                      type="number"
                      name="price_max"
                      placeholder="Max"
                      min="0"
                      value={formState.price_max}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      name="star_rating_min"
                      placeholder="Min (1)"
                      min="1"
                      max="5"
                      value={formState.star_rating_min}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                    <input
                      type="number"
                      name="star_rating_max"
                      placeholder="Max (5)"
                      min="1"
                      max="5"
                      value={formState.star_rating_max}
                      onChange={handleInputChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Search Hotels
                </button>
              </form>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-3/4">
            {/* Top Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center mb-6">
              <p className="text-gray-600 text-sm mb-4 sm:mb-0">
                {isLoading ? "Searching..." : `Found ${meta?.total || 0} hotels`}
              </p>
              
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <label htmlFor="sort" className="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
                <select
                  id="sort"
                  name="sort"
                  value={formState.sort}
                  onChange={handleInputChange}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-1.5 pl-3 pr-8 border"
                >
                  <option value="created_at">Newest Added</option>
                  <option value="star_rating">Star Rating (High to Low)</option>
                  <option value="price_asc">Price (Low to High)</option>
                  <option value="price_desc">Price (High to Low)</option>
                  <option value="avg_rating">Guest Rating</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-pulse h-full">
                    <div className="bg-gray-200 h-48 sm:h-56 w-full"></div>
                    <div className="p-5">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                      <div className="flex justify-between items-end mt-8 pt-4 border-t border-gray-100">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : hotels.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {hotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} />
                  ))}
                </div>

                {meta && meta.has_next && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoadingMore ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No hotels found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms to find what you're looking for.</p>
                <button 
                  onClick={() => {
                    const resetState = {
                      q: "", city: "", price_min: "", price_max: "",
                      star_rating_min: "", star_rating_max: "",
                      check_in: "", check_out: "", guests: "", sort: "created_at"
                    };
                    setFormState(resetState);
                    setActiveFilters(resetState);
                  }}
                  className="mt-6 text-blue-600 font-medium hover:text-blue-500"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelListPage;
