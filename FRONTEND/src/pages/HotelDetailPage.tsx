import { useEffect, useState } from "react";
import { CalendarRange, MapPin, Mail, Phone, Star, Users } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import bookingService from "@/api/bookingService";
import hotelService from "@/api/hotelService";
import {
  ClientMessage,
  ClientPanel,
  ClientSection,
} from "@/components/client/ClientPrimitives";
import { useAuth } from "@/contexts/AuthContext";
import type { HotelDetail, RoomAvailability } from "@/types/hotel";
import type { Review } from "@/types/review";
import {
  formatCurrency,
  formatDate,
  getApiErrorMessage,
  getDateAfter,
  getNightCount,
  getTomorrow,
} from "@/utils/client";

const defaultAvailability = {
  check_in: getTomorrow(),
  check_out: getDateAfter(2),
  guests: "2",
};

const HotelDetailPage = () => {
  const { slug = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [hotelDetail, setHotelDetail] = useState<HotelDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [bookingRoomTypeId, setBookingRoomTypeId] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [availabilityForm, setAvailabilityForm] = useState({
    check_in: searchParams.get("check_in") || defaultAvailability.check_in,
    check_out: searchParams.get("check_out") || defaultAvailability.check_out,
    guests: searchParams.get("guests") || defaultAvailability.guests,
  });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setPageError("");

        const detailResponse = await hotelService.getHotelBySlug(slug);
        setHotelDetail(detailResponse.data);

        const hotelId = detailResponse.data.hotel.id;
        const reviewResponse = await hotelService.getHotelReviews(hotelId, {
          limit: 6,
          offset: 0,
        });

        setReviews(reviewResponse.data);
      } catch (fetchError) {
        setPageError(
          getApiErrorMessage(fetchError, "Không tải được chi tiết khách sạn."),
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [slug]);

  useEffect(() => {
    if (
      hotelDetail &&
      availabilityForm.check_in &&
      availabilityForm.check_out &&
      availabilityForm.guests
    ) {
      void handleCheckAvailability(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelDetail]);

  const handleCheckAvailability = async (silent = false) => {
    if (!hotelDetail) return;

    try {
      setCheckingAvailability(true);
      if (!silent) {
        setActionMessage("");
      }

      const response = await hotelService.getHotelAvailability(hotelDetail.hotel.id, {
        check_in: availabilityForm.check_in,
        check_out: availabilityForm.check_out,
        guests: Number(availabilityForm.guests),
      });

      setAvailability(response.data);
      setSearchParams({
        check_in: availabilityForm.check_in,
        check_out: availabilityForm.check_out,
        guests: availabilityForm.guests,
      });
      if (!silent) {
        setActionMessage("Đã cập nhật danh sách phòng còn trống.");
      }
    } catch (error) {
      setActionMessage(getApiErrorMessage(error, "Không kiểm tra được phòng trống."));
      setAvailability([]);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!hotelDetail || !bookingRoomTypeId) {
      setActionMessage("Hãy chọn một hạng phòng trước khi đặt.");
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    try {
      setSubmittingBooking(true);
      setActionMessage("");

      const response = await bookingService.createBooking({
        hotel_id: hotelDetail.hotel.id,
        room_type_id: bookingRoomTypeId,
        check_in: availabilityForm.check_in,
        check_out: availabilityForm.check_out,
        guests_count: Number(availabilityForm.guests),
      });

      navigate(`/bookings/${response.data.booking.id}`);
    } catch (error) {
      setActionMessage(getApiErrorMessage(error, "Không tạo được booking."));
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loading) {
    return <div className="h-[60vh] animate-pulse rounded-[36px] bg-white/70" />;
  }

  if (!hotelDetail) {
    return (
      <ClientMessage
        tone="error"
        message={pageError || "Không tìm thấy khách sạn này."}
      />
    );
  }

  const heroImages = hotelDetail.images.length
    ? hotelDetail.images
    : hotelDetail.room_types.flatMap((roomType) => roomType.images);
  const selectedRoom = availability.find(
    (item) => item.room_type.id === bookingRoomTypeId,
  );

  return (
    <div className="space-y-8">
      {pageError ? <ClientMessage tone="error" message={pageError} /> : null}

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <ClientPanel className="overflow-hidden p-0">
          <div className="grid gap-3 p-3 md:grid-cols-[2fr_1fr]">
            <div className="min-h-[420px] overflow-hidden rounded-[28px]">
              <img
                src={
                  heroImages[0]?.url ||
                  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80"
                }
                alt={hotelDetail.hotel.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="grid gap-3">
              {heroImages.slice(1, 3).map((image) => (
                <div key={image.id} className="overflow-hidden rounded-[24px]">
                  <img
                    src={image.url}
                    alt={hotelDetail.hotel.name}
                    className="h-full min-h-[204px] w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </ClientPanel>

        <ClientPanel className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Hotel Detail
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">
              {hotelDetail.hotel.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {hotelDetail.avg_rating.toFixed(1)} / 5
              </span>
              <span>{hotelDetail.review_count} đánh giá công khai</span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <p className="flex items-start gap-3">
              <MapPin size={17} className="mt-0.5 text-amber-700" />
              <span>
                {hotelDetail.hotel.address}
                <br />
                {[hotelDetail.hotel.district, hotelDetail.hotel.city]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </p>
            <p className="flex items-center gap-3">
              <Mail size={17} className="text-amber-700" />
              {hotelDetail.hotel.contact_email || "Chưa cập nhật email"}
            </p>
            <p className="flex items-center gap-3">
              <Phone size={17} className="text-amber-700" />
              {hotelDetail.hotel.contact_phone || "Chưa cập nhật số điện thoại"}
            </p>
          </div>

          <div className="rounded-[28px] bg-slate-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
              Mô tả
            </p>
            <p className="mt-3 text-sm leading-7 text-white/80">
              {hotelDetail.hotel.description || "Khách sạn chưa có mô tả chi tiết."}
            </p>
          </div>
        </ClientPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <ClientSection
            eyebrow="Amenities"
            title="Tiện ích nổi bật"
            description="Tiện ích khách sạn và hạng phòng được lấy từ backend hiện tại."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {hotelDetail.amenities.map((amenity) => (
                <ClientPanel key={amenity.id} className="py-4">
                  <p className="font-medium text-slate-900">{amenity.name}</p>
                </ClientPanel>
              ))}
            </div>
          </ClientSection>

          <ClientSection
            eyebrow="Room Types"
            title="Các hạng phòng có thể đặt"
            description="Bạn có thể kiểm tra số phòng trống thực tế theo ngày ở cột bên phải."
          >
            <div className="space-y-4">
              {hotelDetail.room_types.map((roomType) => (
                <ClientPanel key={roomType.id} className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-900">
                        {roomType.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {roomType.description || "Hạng phòng phù hợp cho kỳ nghỉ thoải mái."}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.24em] text-amber-700">
                        Giá từ
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        {formatCurrency(roomType.base_price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Tối đa {roomType.max_occupancy} khách
                    </span>
                    {roomType.bed_type ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {roomType.bed_type}
                      </span>
                    ) : null}
                    {roomType.size_sqm ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {roomType.size_sqm} m²
                      </span>
                    ) : null}
                    {roomType.total_rooms ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        {roomType.total_rooms} phòng cùng hạng
                      </span>
                    ) : null}
                  </div>

                  {roomType.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {roomType.amenities.map((amenity) => (
                        <span
                          key={amenity.id}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {amenity.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </ClientPanel>
              ))}
            </div>
          </ClientSection>

          <ClientSection
            eyebrow="Guest Reviews"
            title="Cảm nhận từ khách đã lưu trú"
            description={`Điểm sạch sẽ ${hotelDetail.rating_breakdown.cleanliness.toFixed(1)}, dịch vụ ${hotelDetail.rating_breakdown.service.toFixed(1)}, vị trí ${hotelDetail.rating_breakdown.location.toFixed(1)}.`}
          >
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <ClientPanel>
                  <p className="text-sm text-slate-600">
                    Chưa có review công khai cho khách sạn này.
                  </p>
                </ClientPanel>
              ) : (
                reviews.map((review) => (
                  <ClientPanel key={review.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {review.user.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                      <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                        {review.rating_overall}/5
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {review.comment || "Khách này chưa để lại bình luận chi tiết."}
                    </p>
                  </ClientPanel>
                ))
              )}
            </div>
          </ClientSection>
        </div>

        <div className="space-y-5 xl:sticky xl:top-28 xl:h-fit">
          <ClientPanel className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Kiểm tra phòng trống
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Tạo booking ngay từ đây
              </h2>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <CalendarRange size={16} />
                Check-in
              </span>
              <input
                type="date"
                min={getTomorrow()}
                value={availabilityForm.check_in}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({
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
                min={availabilityForm.check_in || getDateAfter(2)}
                value={availabilityForm.check_out}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({
                    ...current,
                    check_out: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Users size={16} />
                Số khách
              </span>
              <input
                type="number"
                min="1"
                value={availabilityForm.guests}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({
                    ...current,
                    guests: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleCheckAvailability()}
              disabled={checkingAvailability}
              className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingAvailability ? "Đang kiểm tra..." : "Kiểm tra phòng trống"}
            </button>

            {actionMessage ? (
              <ClientMessage tone="info" message={actionMessage} />
            ) : null}

            <div className="space-y-3">
              {availability.map((item) => {
                const nights = getNightCount(
                  availabilityForm.check_in,
                  availabilityForm.check_out,
                );
                const isSelected = bookingRoomTypeId === item.room_type.id;

                return (
                  <button
                    key={item.room_type.id}
                    type="button"
                    onClick={() => setBookingRoomTypeId(item.room_type.id)}
                    className={`w-full rounded-[24px] border p-4 text-left transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:border-amber-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.room_type.name}</p>
                        <p
                          className={`mt-1 text-sm ${
                            isSelected ? "text-white/80" : "text-slate-500"
                          }`}
                        >
                          Còn {item.available_rooms} phòng, tối đa{" "}
                          {item.room_type.max_occupancy} khách
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(item.price)}
                        </p>
                        <p
                          className={`text-xs ${
                            isSelected ? "text-white/70" : "text-slate-500"
                          }`}
                        >
                          mỗi đêm
                        </p>
                      </div>
                    </div>
                    <p
                      className={`mt-3 text-xs ${
                        isSelected ? "text-white/70" : "text-slate-500"
                      }`}
                    >
                      Tổng dự kiến {formatCurrency(item.price * nights)}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void handleCreateBooking()}
              disabled={!selectedRoom || selectedRoom.available_rooms === 0 || submittingBooking}
              className="w-full rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingBooking ? "Đang tạo booking..." : "Đặt hạng phòng đã chọn"}
            </button>

            {!isAuthenticated ? (
              <p className="text-xs leading-5 text-slate-500">
                Khi bấm đặt phòng, hệ thống sẽ đưa bạn tới trang đăng nhập trước
                nếu chưa có phiên đăng nhập.
              </p>
            ) : null}

            {selectedRoom ? (
              <div className="rounded-[24px] bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Tóm tắt lựa chọn</p>
                <p className="mt-2">{selectedRoom.room_type.name}</p>
                <p className="mt-1">
                  {formatDate(availabilityForm.check_in)} -{" "}
                  {formatDate(availabilityForm.check_out)}
                </p>
                <p className="mt-1">
                  {getNightCount(
                    availabilityForm.check_in,
                    availabilityForm.check_out,
                  )}{" "}
                  đêm, {availabilityForm.guests} khách
                </p>
                <p className="mt-2 text-base font-semibold">
                  {formatCurrency(
                    selectedRoom.price *
                      getNightCount(
                        availabilityForm.check_in,
                        availabilityForm.check_out,
                      ),
                  )}
                </p>
              </div>
            ) : null}
          </ClientPanel>

          <ClientPanel>
            <p className="text-sm leading-6 text-slate-600">
              Muốn xem thêm lựa chọn?
            </p>
            <Link
              to="/hotels"
              className="mt-3 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              Quay lại danh sách khách sạn
            </Link>
          </ClientPanel>
        </div>
      </section>
    </div>
  );
};

export default HotelDetailPage;
