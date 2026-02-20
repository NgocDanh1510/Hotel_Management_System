import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import locationService from "@/api/locationService";
import { partnerService } from "@/api/partnerService";
import type {
  AdminCityOption,
  AdminDistrictOption,
  HotelImageItem,
  HotelImageUploadPayload,
} from "@/features/admin/types";
import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminInputClassName,
  AdminMessage,
  AdminModal,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminToolbar,
} from "@/features/admin/components/AdminPrimitives";
import {
  formatCurrency,
  formatDateTime,
  getErrorMessage,
  getOffsetFromPage,
} from "@/features/admin/utils";
import HotelImageManager from "@/features/admin/components/HotelImageManager";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { PaginationMeta } from "@/types/common";
import type {
  PartnerAmenityOption,
  PartnerHotelListItem,
  PartnerRoomTypeListItem,
} from "@/types/partner";

const defaultMeta: PaginationMeta = {
  total: 0,
  offset: 0,
  limit: 10,
  has_next: false,
};

const emptyCreateHotelForm = {
  name: "",
  description: "",
  address: "",
  district_id: "",
  star_rating: 1,
  contact_email: "",
  contact_phone: "",
  amenity_ids: [] as string[],
  slug: "",
};

const emptyRoomTypeForm = {
  name: "",
  description: "",
  base_price: 0,
  currency: "VND",
  max_occupancy: 2,
  total_rooms: 1,
  bed_type: "",
  size_sqm: 0,
};

const PartnerHotelsPage = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<PartnerHotelListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const [filters, setFilters] = useState({
    status: "",
    sort: "created_at",
    page: 1,
    limit: 10,
  });

  const [cities, setCities] = useState<AdminCityOption[]>([]);
  const [districts, setDistricts] = useState<AdminDistrictOption[]>([]);
  const [editDistricts, setEditDistricts] = useState<AdminDistrictOption[]>([]);
  const [amenities, setAmenities] = useState<PartnerAmenityOption[]>([]);
  const [roomTypes, setRoomTypes] = useState<PartnerRoomTypeListItem[]>([]);
  const [hotelImages, setHotelImages] = useState<HotelImageItem[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<PartnerHotelListItem | null>(
    null,
  );
  const [selectedRoomType, setSelectedRoomType] =
    useState<PartnerRoomTypeListItem | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [imageManagerOpen, setImageManagerOpen] = useState(false);
  const [roomTypesOpen, setRoomTypesOpen] = useState(false);
  const [roomTypeCreateOpen, setRoomTypeCreateOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [roomTypeAmenitiesOpen, setRoomTypeAmenitiesOpen] = useState(false);

  const [createHotelCityId, setCreateHotelCityId] = useState("");
  const [editCityId, setEditCityId] = useState("");
  const [createHotelForm, setCreateHotelForm] = useState(emptyCreateHotelForm);
  const [editHotelForm, setEditHotelForm] = useState({
    id: "",
    name: "",
    description: "",
    address: "",
    district_id: "",
    star_rating: 1,
    contact_email: "",
    contact_phone: "",
    slug: "",
  });
  const [roomTypeForm, setRoomTypeForm] = useState(emptyRoomTypeForm);
  const [priceForm, setPriceForm] = useState({
    id: "",
    name: "",
    base_price: 0,
    currency: "VND",
  });
  const [roomTypeAmenityIds, setRoomTypeAmenityIds] = useState<string[]>([]);

  const hotelQuery = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status:
        filters.status === ""
          ? undefined
          : (filters.status as "pending" | "approved" | "rejected"),
      sort: filters.sort,
      offset: getOffsetFromPage(filters.page, filters.limit),
      limit: filters.limit,
    }),
    [debouncedSearch, filters],
  );

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        setPageError("");
        const response = await partnerService.getHotels(hotelQuery);
        setHotels(response.data);
        setMeta(response.meta);
      } catch (error) {
        setPageError(
          getErrorMessage(error, "Không tải được danh sách hotel của partner."),
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchHotels();
  }, [hotelQuery]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [citiesResponse, amenitiesResponse] = await Promise.all([
          locationService.getCities(),
          partnerService.getAmenities(),
        ]);
        setCities(citiesResponse.data);
        setAmenities(amenitiesResponse.data);
      } catch (error) {
        setPageError(
          getErrorMessage(
            error,
            "Không tải được danh sách tỉnh/thành hoặc tiện ích.",
          ),
        );
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!createHotelCityId) {
      setDistricts([]);
      return;
    }

    const fetchDistricts = async () => {
      try {
        const response = await locationService.getDistricts(createHotelCityId);
        setDistricts(response.data);
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được quận/huyện."));
      }
    };

    void fetchDistricts();
  }, [createHotelCityId]);

  useEffect(() => {
    if (!editCityId) {
      setEditDistricts([]);
      return;
    }

    const fetchDistricts = async () => {
      try {
        const response = await locationService.getDistricts(editCityId);
        setEditDistricts(response.data);
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được quận/huyện."));
      }
    };

    void fetchDistricts();
  }, [editCityId]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const resetMessages = () => {
    setPageError("");
    setPageSuccess("");
  };

  const reloadHotels = async () => {
    const response = await partnerService.getHotels(hotelQuery);
    setHotels(response.data);
    setMeta(response.meta);
  };

  const loadHotelImages = async (hotelId: string) => {
    try {
      setImagesLoading(true);
      const response = await partnerService.getHotelImages(hotelId);
      setHotelImages(response.data);
    } catch (error) {
      setHotelImages([]);
      setPageError(getErrorMessage(error, "Không tải được danh sách ảnh."));
    } finally {
      setImagesLoading(false);
    }
  };

  const openCreate = () => {
    resetMessages();
    setCreateHotelForm(emptyCreateHotelForm);
    setCreateHotelCityId("");
    setCreateOpen(true);
  };

  const handleCreateHotel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      resetMessages();
      await partnerService.createHotel({
        ...createHotelForm,
        description: createHotelForm.description || undefined,
        address: createHotelForm.address || undefined,
        contact_email: createHotelForm.contact_email || undefined,
        contact_phone: createHotelForm.contact_phone || undefined,
        slug: createHotelForm.slug || undefined,
      });
      setCreateOpen(false);
      setCreateHotelForm(emptyCreateHotelForm);
      setPageSuccess("Đã tạo hotel mới. Hotel được gửi ở trạng thái pending.");
      await reloadHotels();
    } catch (error) {
      setPageError(getErrorMessage(error, "Tạo hotel thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = async (hotel: PartnerHotelListItem) => {
    resetMessages();
    setSelectedHotel(hotel);
    const matchedCity = cities.find((city) => city.name === hotel.city);

    setEditHotelForm({
      id: hotel.id,
      name: hotel.name,
      description: hotel.description || "",
      address: hotel.address || "",
      district_id: hotel.district_id,
      star_rating: hotel.star_rating,
      contact_email: hotel.contact_email || "",
      contact_phone: hotel.contact_phone || "",
      slug: hotel.slug || "",
    });
    setEditCityId(matchedCity?.id || "");

    if (matchedCity?.id) {
      try {
        const response = await locationService.getDistricts(matchedCity.id);
        setEditDistricts(response.data);
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được quận/huyện."));
      }
    }

    setEditOpen(true);
  };

  const openImageManager = async (hotel: PartnerHotelListItem) => {
    resetMessages();
    setSelectedHotel(hotel);
    setHotelImages([]);
    setImageManagerOpen(true);
    await loadHotelImages(hotel.id);
  };

  const handleAddHotelImage = async (payload: HotelImageUploadPayload) => {
    if (!selectedHotel) return;

    try {
      setSubmitting(true);
      resetMessages();
      await partnerService.addHotelImage(selectedHotel.id, payload);
      setPageSuccess("Đã thêm ảnh hotel.");
      await loadHotelImages(selectedHotel.id);
    } catch (error) {
      setPageError(getErrorMessage(error, "Thêm ảnh hotel thất bại."));
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHotelImage = async (image: HotelImageItem) => {
    if (!selectedHotel) return;

    const confirmed = window.confirm(`Xóa ảnh ${image.public_id}?`);
    if (!confirmed) return;

    try {
      setSubmitting(true);
      resetMessages();
      await partnerService.deleteHotelImage(selectedHotel.id, image.id);
      setPageSuccess("Đã xóa ảnh hotel.");
      await loadHotelImages(selectedHotel.id);
    } catch (error) {
      setPageError(getErrorMessage(error, "Xóa ảnh hotel thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateHotel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      resetMessages();
      await partnerService.updateHotel(editHotelForm.id, {
        name: editHotelForm.name,
        description: editHotelForm.description || undefined,
        address: editHotelForm.address || undefined,
        district_id: editHotelForm.district_id,
        star_rating: editHotelForm.star_rating,
        contact_email: editHotelForm.contact_email || undefined,
        contact_phone: editHotelForm.contact_phone || undefined,
        slug: editHotelForm.slug || undefined,
      });
      setEditOpen(false);
      setPageSuccess("Đã cập nhật hotel.");
      await reloadHotels();
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật hotel thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async (hotel: PartnerHotelListItem) => {
    try {
      resetMessages();
      await partnerService.submitHotelForReview(hotel.id);
      setPageSuccess(`Đã gửi ${hotel.name} sang trạng thái chờ duyệt.`);
      await reloadHotels();
    } catch (error) {
      setPageError(getErrorMessage(error, "Gửi hotel đi duyệt thất bại."));
    }
  };

  const openRoomTypes = async (hotel: PartnerHotelListItem) => {
    try {
      resetMessages();
      setSelectedHotel(hotel);
      const response = await partnerService.getRoomTypes(hotel.id, {
        offset: 0,
        limit: 20,
        sort: "created_at_desc",
      });
      setRoomTypes(response.data);
      setRoomTypesOpen(true);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được room type."));
    }
  };

  const handleCreateRoomType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedHotel) return;

    try {
      setSubmitting(true);
      resetMessages();
      await partnerService.createRoomType(selectedHotel.id, {
        name: roomTypeForm.name,
        description: roomTypeForm.description || undefined,
        base_price: roomTypeForm.base_price,
        currency: roomTypeForm.currency,
        max_occupancy: roomTypeForm.max_occupancy,
        total_rooms: roomTypeForm.total_rooms,
        bed_type: roomTypeForm.bed_type || undefined,
        size_sqm: roomTypeForm.size_sqm || undefined,
      });
      setRoomTypeCreateOpen(false);
      setRoomTypeForm(emptyRoomTypeForm);
      setPageSuccess("Đã tạo room type.");
      await openRoomTypes(selectedHotel);
    } catch (error) {
      setPageError(getErrorMessage(error, "Tạo room type thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const openPriceModal = (roomType: PartnerRoomTypeListItem) => {
    setSelectedRoomType(roomType);
    setPriceForm({
      id: roomType.id,
      name: roomType.name,
      base_price: roomType.base_price,
      currency: roomType.currency,
    });
    setPriceOpen(true);
  };

  const handleUpdatePrice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedHotel) return;

    try {
      setSubmitting(true);
      resetMessages();
      await partnerService.updateRoomTypePrice(priceForm.id, {
        base_price: priceForm.base_price,
        currency: priceForm.currency,
      });
      setPriceOpen(false);
      setPageSuccess("Đã cập nhật giá room type.");
      await openRoomTypes(selectedHotel);
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật giá thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const openRoomTypeAmenities = (roomType: PartnerRoomTypeListItem) => {
    setSelectedRoomType(roomType);
    setRoomTypeAmenityIds(roomType.amenities.map((amenity) => amenity.id));
    setRoomTypeAmenitiesOpen(true);
  };

  const handleUpdateRoomTypeAmenities = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!selectedRoomType || !selectedHotel) return;

    try {
      setSubmitting(true);
      resetMessages();
      await partnerService.updateRoomTypeAmenities(
        selectedRoomType.id,
        roomTypeAmenityIds,
      );
      setRoomTypeAmenitiesOpen(false);
      setPageSuccess("Đã cập nhật tiện ích room type.");
      await openRoomTypes(selectedHotel);
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật tiện ích thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Partner Hotels"
        description="Tạo và cập nhật khách sạn của bạn, theo dõi trạng thái duyệt và quản lý room type."
        action={<AdminButton onClick={openCreate}>Tạo hotel</AdminButton>}
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}
      {pageSuccess ? <AdminMessage tone="success" message={pageSuccess} /> : null}

      <AdminToolbar>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className={`${AdminInputClassName} md:max-w-xs`}
          placeholder="Tìm theo tên hoặc slug"
        />

        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={filters.status}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Tất cả status</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>

        <select
          className={`${AdminInputClassName} md:max-w-[180px]`}
          value={filters.sort}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              sort: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="created_at">Mới nhất</option>
          <option value="name">Tên A-Z</option>
          <option value="star_rating">Nhiều sao hơn</option>
          <option value="total_bookings">Nhiều booking hơn</option>
        </select>
      </AdminToolbar>

      <AdminPanel title="Danh sách hotels của bạn">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : hotels.length === 0 ? (
          <AdminEmptyState message="Bạn chưa có hotel nào." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Hotel</th>
                    <th className="px-3 py-3 font-medium">Location</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Contact</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hotels.map((hotel) => (
                    <tr key={hotel.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 align-top">
                        <p className="font-medium text-slate-900">
                          {hotel.name}
                        </p>
                        <p className="text-slate-500">{hotel.slug}</p>
                        <p className="text-slate-400">
                          {hotel.star_rating} sao - {hotel.avg_rating ?? 0}/5 (
                          {hotel.review_count ?? 0} review)
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        <p>{hotel.address || "--"}</p>
                        <p>
                          {hotel.district || "--"}, {hotel.city || "--"}
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <AdminBadge label={hotel.status} />
                          <AdminBadge
                            label={hotel.is_active ? "active" : "inactive"}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        <p>{hotel.contact_phone || "--"}</p>
                        <p>{hotel.contact_email || "--"}</p>
                        <p className="text-slate-400">
                          {formatDateTime(hotel.created_at)}
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <AdminButton
                            onClick={() =>
                              navigate(
                                `/partner/room-types?hotelId=${encodeURIComponent(
                                  hotel.id,
                                )}`,
                              )
                            }
                          >
                            Room Type
                          </AdminButton>
                          <AdminButton
                            variant="ghost"
                            onClick={() => void openRoomTypes(hotel)}
                          >
                            Xem nhanh
                          </AdminButton>
                          <AdminButton
                            variant="secondary"
                            onClick={() => void openImageManager(hotel)}
                          >
                            Ảnh
                          </AdminButton>
                          <AdminButton
                            variant="secondary"
                            onClick={() => void openEdit(hotel)}
                          >
                            Sửa
                          </AdminButton>
                          <AdminButton
                            variant="ghost"
                            onClick={() => void handleSubmitForReview(hotel)}
                            disabled={hotel.status === "approved"}
                          >
                            Gửi duyệt
                          </AdminButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      <AdminModal
        open={createOpen}
        title="Tạo hotel mới"
        description="Hotel mới sẽ luôn ở trạng thái pending và thuộc về chính tài khoản partner hiện tại."
        onClose={() => setCreateOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleCreateHotel}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              className={AdminInputClassName}
              placeholder="Tên hotel"
              value={createHotelForm.name}
              onChange={(event) =>
                setCreateHotelForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Email liên hệ"
              type="email"
              value={createHotelForm.contact_email}
              onChange={(event) =>
                setCreateHotelForm((current) => ({
                  ...current,
                  contact_email: event.target.value,
                }))
              }
            />
          </div>

          <textarea
            className={AdminInputClassName}
            placeholder="Mô tả ngắn"
            value={createHotelForm.description}
            onChange={(event) =>
              setCreateHotelForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className={AdminInputClassName}
              placeholder="Địa chỉ"
              value={createHotelForm.address}
              onChange={(event) =>
                setCreateHotelForm((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Số điện thoại"
              value={createHotelForm.contact_phone}
              onChange={(event) =>
                setCreateHotelForm((current) => ({
                  ...current,
                  contact_phone: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <select
              required
              className={AdminInputClassName}
              value={createHotelCityId}
              onChange={(event) => {
                setCreateHotelCityId(event.target.value);
                setCreateHotelForm((current) => ({
                  ...current,
                  district_id: "",
                }));
              }}
            >
              <option value="">Chọn tỉnh/thành</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <select
              required
              className={AdminInputClassName}
              value={createHotelForm.district_id}
              onChange={(event) =>
                setCreateHotelForm((current) => ({
                  ...current,
                  district_id: event.target.value,
                }))
              }
            >
              <option value="">Chọn quận/huyện</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={5}
              className={AdminInputClassName}
              placeholder="Số sao"
              value={createHotelForm.star_rating}
              onChange={(event) =>
                setCreateHotelForm((current) => ({
                  ...current,
                  star_rating: Number(event.target.value),
                }))
              }
            />
          </div>

          <input
            className={AdminInputClassName}
            placeholder="Slug tùy chọn"
            value={createHotelForm.slug}
            onChange={(event) =>
              setCreateHotelForm((current) => ({
                ...current,
                slug: event.target.value,
              }))
            }
          />

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Amenities</p>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-slate-200 p-3">
              {amenities.map((amenity) => (
                <label
                  key={amenity.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={createHotelForm.amenity_ids.includes(amenity.id)}
                    onChange={() =>
                      setCreateHotelForm((current) => ({
                        ...current,
                        amenity_ids: current.amenity_ids.includes(amenity.id)
                          ? current.amenity_ids.filter((id) => id !== amenity.id)
                          : [...current.amenity_ids, amenity.id],
                      }))
                    }
                  />
                  {amenity.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton
              variant="secondary"
              onClick={() => setCreateOpen(false)}
            >
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang tạo..." : "Tạo hotel"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={editOpen}
        title="Cập nhật hotel"
        description="Partner chỉ chỉnh được thông tin hotel của chính mình; trạng thái duyệt do route riêng xử lý."
        onClose={() => setEditOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleUpdateHotel}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              className={AdminInputClassName}
              placeholder="Tên hotel"
              value={editHotelForm.name}
              onChange={(event) =>
                setEditHotelForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Email liên hệ"
              type="email"
              value={editHotelForm.contact_email}
              onChange={(event) =>
                setEditHotelForm((current) => ({
                  ...current,
                  contact_email: event.target.value,
                }))
              }
            />
          </div>

          <textarea
            className={AdminInputClassName}
            placeholder="Mô tả ngắn"
            value={editHotelForm.description}
            onChange={(event) =>
              setEditHotelForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className={AdminInputClassName}
              placeholder="Địa chỉ"
              value={editHotelForm.address}
              onChange={(event) =>
                setEditHotelForm((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Số điện thoại"
              value={editHotelForm.contact_phone}
              onChange={(event) =>
                setEditHotelForm((current) => ({
                  ...current,
                  contact_phone: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <select
              className={AdminInputClassName}
              value={editCityId}
              onChange={(event) => {
                setEditCityId(event.target.value);
                setEditHotelForm((current) => ({
                  ...current,
                  district_id: "",
                }));
              }}
            >
              <option value="">Chọn tỉnh/thành</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <select
              className={AdminInputClassName}
              value={editHotelForm.district_id}
              onChange={(event) =>
                setEditHotelForm((current) => ({
                  ...current,
                  district_id: event.target.value,
                }))
              }
            >
              <option value="">Chọn quận/huyện</option>
              {editDistricts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={5}
              className={AdminInputClassName}
              value={editHotelForm.star_rating}
              onChange={(event) =>
                setEditHotelForm((current) => ({
                  ...current,
                  star_rating: Number(event.target.value),
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Slug"
              value={editHotelForm.slug}
              onChange={(event) =>
                setEditHotelForm((current) => ({
                  ...current,
                  slug: event.target.value,
                }))
              }
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            {selectedHotel ? (
              <AdminButton
                variant="ghost"
                onClick={() => void openImageManager(selectedHotel)}
              >
                Chỉnh sửa ảnh
              </AdminButton>
            ) : null}
            <AdminButton variant="secondary" onClick={() => setEditOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={imageManagerOpen}
        title={`Chỉnh sửa ảnh - ${selectedHotel?.name || ""}`}
        description="Ảnh hotel được quản lý riêng, không đi qua API cập nhật thông tin hotel."
        onClose={() => setImageManagerOpen(false)}
      >
        <HotelImageManager
          images={hotelImages}
          loading={imagesLoading}
          submitting={submitting}
          onAdd={handleAddHotelImage}
          onDelete={handleDeleteHotelImage}
        />
      </AdminModal>

      <AdminModal
        open={roomTypesOpen}
        title={`Room types - ${selectedHotel?.name || ""}`}
        description="Tạo room type mới, cập nhật giá và thay tiện ích của từng loại phòng."
        onClose={() => setRoomTypesOpen(false)}
      >
        <div className="space-y-4">
          <div className="flex justify-end">
            <AdminButton onClick={() => setRoomTypeCreateOpen(true)}>
              Tạo room type
            </AdminButton>
          </div>

          {roomTypes.length === 0 ? (
            <AdminEmptyState message="Hotel này chưa có room type nào." />
          ) : (
            <div className="space-y-3">
              {roomTypes.map((roomType) => (
                <div
                  key={roomType.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {roomType.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {roomType.max_occupancy} khách - {roomType.total_rooms}{" "}
                        phòng
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {roomType.bed_type || "--"} /{" "}
                        {roomType.size_sqm ? `${roomType.size_sqm}m2` : "--"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {formatCurrency(roomType.base_price, roomType.currency)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {roomType.available_rooms_count ?? 0}/
                        {roomType.total_rooms} available
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {roomType.amenities.map((amenity) => (
                      <span
                        key={amenity.id}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                      >
                        {amenity.name}
                      </span>
                    ))}
                    {roomType.amenities.length === 0 ? (
                      <span className="text-xs text-slate-400">
                        Chưa có tiện ích.
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminButton
                      variant="secondary"
                      onClick={() => openPriceModal(roomType)}
                    >
                      Cập nhật giá
                    </AdminButton>
                    <AdminButton
                      variant="ghost"
                      onClick={() => openRoomTypeAmenities(roomType)}
                    >
                      Tiện ích
                    </AdminButton>
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                      {roomType.images.length} ảnh đã liên kết
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminModal>

      <AdminModal
        open={roomTypeCreateOpen}
        title="Tạo room type"
        onClose={() => setRoomTypeCreateOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleCreateRoomType}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              className={AdminInputClassName}
              placeholder="Tên room type"
              value={roomTypeForm.name}
              onChange={(event) =>
                setRoomTypeForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Loại giường"
              value={roomTypeForm.bed_type}
              onChange={(event) =>
                setRoomTypeForm((current) => ({
                  ...current,
                  bed_type: event.target.value,
                }))
              }
            />
          </div>

          <textarea
            className={AdminInputClassName}
            placeholder="Mô tả"
            value={roomTypeForm.description}
            onChange={(event) =>
              setRoomTypeForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />

          <div className="grid gap-4 md:grid-cols-4">
            <input
              type="number"
              min={1}
              className={AdminInputClassName}
              placeholder="Giá"
              value={roomTypeForm.base_price}
              onChange={(event) =>
                setRoomTypeForm((current) => ({
                  ...current,
                  base_price: Number(event.target.value),
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Currency"
              value={roomTypeForm.currency}
              onChange={(event) =>
                setRoomTypeForm((current) => ({
                  ...current,
                  currency: event.target.value.toUpperCase(),
                }))
              }
            />
            <input
              type="number"
              min={1}
              className={AdminInputClassName}
              placeholder="Max occupancy"
              value={roomTypeForm.max_occupancy}
              onChange={(event) =>
                setRoomTypeForm((current) => ({
                  ...current,
                  max_occupancy: Number(event.target.value),
                }))
              }
            />
            <input
              type="number"
              min={1}
              className={AdminInputClassName}
              placeholder="Total rooms"
              value={roomTypeForm.total_rooms}
              onChange={(event) =>
                setRoomTypeForm((current) => ({
                  ...current,
                  total_rooms: Number(event.target.value),
                }))
              }
            />
          </div>

          <input
            type="number"
            min={0}
            className={AdminInputClassName}
            placeholder="Diện tích m2"
            value={roomTypeForm.size_sqm}
            onChange={(event) =>
              setRoomTypeForm((current) => ({
                ...current,
                size_sqm: Number(event.target.value),
              }))
            }
          />

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton
              variant="secondary"
              onClick={() => setRoomTypeCreateOpen(false)}
            >
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang tạo..." : "Tạo room type"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={priceOpen}
        title={`Cập nhật giá - ${priceForm.name}`}
        onClose={() => setPriceOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleUpdatePrice}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="number"
              min={1}
              className={AdminInputClassName}
              value={priceForm.base_price}
              onChange={(event) =>
                setPriceForm((current) => ({
                  ...current,
                  base_price: Number(event.target.value),
                }))
              }
            />
            <input
              className={AdminInputClassName}
              value={priceForm.currency}
              onChange={(event) =>
                setPriceForm((current) => ({
                  ...current,
                  currency: event.target.value.toUpperCase(),
                }))
              }
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton variant="secondary" onClick={() => setPriceOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu giá"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={roomTypeAmenitiesOpen}
        title={`Tiện ích - ${selectedRoomType?.name || ""}`}
        onClose={() => setRoomTypeAmenitiesOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleUpdateRoomTypeAmenities}>
          <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-slate-200 p-3">
            {amenities.map((amenity) => (
              <label
                key={amenity.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={roomTypeAmenityIds.includes(amenity.id)}
                  onChange={() =>
                    setRoomTypeAmenityIds((current) =>
                      current.includes(amenity.id)
                        ? current.filter((id) => id !== amenity.id)
                        : [...current, amenity.id],
                    )
                  }
                />
                {amenity.name}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton
              variant="secondary"
              onClick={() => setRoomTypeAmenitiesOpen(false)}
            >
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu tiện ích"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  );
};

export default PartnerHotelsPage;
