import { useEffect, useMemo, useState, type FormEvent } from "react";
import { adminService } from "@/api/adminService";
import locationService from "@/api/locationService";
import type {
  AdminAmenityOption,
  AdminCityOption,
  AdminDistrictOption,
  AdminHotelListItem,
  AdminRoomTypeListItem,
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
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { PaginationMeta } from "@/types/common";
import type { UsersListItem } from "@/types/user";

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
  owner_id: "",
  amenity_ids: [] as string[],
  status: "pending" as const,
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

const AdminHotelsPage = () => {
  const [hotels, setHotels] = useState<AdminHotelListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const [userSearchInput, setUserSearchInput] = useState("");
  const debouncedUserSearch = useDebouncedValue(userSearchInput, 350);

  const [filters, setFilters] = useState({
    status: "",
    is_active: "",
    sort: "created_at",
    page: 1,
    limit: 10,
  });

  const [cities, setCities] = useState<AdminCityOption[]>([]);
  const [districts, setDistricts] = useState<AdminDistrictOption[]>([]);
  const [editDistricts, setEditDistricts] = useState<AdminDistrictOption[]>([]);
  const [amenities, setAmenities] = useState<AdminAmenityOption[]>([]);
  const [ownerResults, setOwnerResults] = useState<UsersListItem[]>([]);

  const [selectedHotel, setSelectedHotel] = useState<AdminHotelListItem | null>(
    null,
  );
  const [roomTypes, setRoomTypes] = useState<AdminRoomTypeListItem[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [roomTypesOpen, setRoomTypesOpen] = useState(false);
  const [roomTypeCreateOpen, setRoomTypeCreateOpen] = useState(false);

  const [selectedOwnerLabel, setSelectedOwnerLabel] = useState("");
  const [createHotelForm, setCreateHotelForm] = useState(emptyCreateHotelForm);
  const [createHotelCityId, setCreateHotelCityId] = useState("");
  const [editHotelForm, setEditHotelForm] = useState({
    id: "",
    name: "",
    description: "",
    address: "",
    district_id: "",
    star_rating: 1,
    contact_email: "",
    contact_phone: "",
    status: "pending" as "pending" | "approved" | "rejected",
    is_active: true,
  });
  const [editCityId, setEditCityId] = useState("");
  const [roomTypeForm, setRoomTypeForm] = useState(emptyRoomTypeForm);

  const hotelQuery = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status:
        filters.status === ""
          ? undefined
          : (filters.status as "pending" | "approved" | "rejected"),
      is_active:
        filters.is_active === ""
          ? undefined
          : filters.is_active === "true",
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
        const response = await adminService.getAdminHotels(hotelQuery);
        setHotels(response.data);
        setMeta(response.meta);
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được danh sách hotel."));
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
          adminService.getAmenities(),
        ]);
        setCities(citiesResponse.data);
        setAmenities(amenitiesResponse.data);
      } catch (error) {
        setPageError(
          getErrorMessage(error, "Không tải được danh mục thành phố/tiện ích."),
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
    if (!debouncedUserSearch.trim()) {
      setOwnerResults([]);
      return;
    }

    const fetchOwners = async () => {
      try {
        const response = await adminService.getUsers({
          q: debouncedUserSearch,
          page: 1,
          limit: 5,
        });
        setOwnerResults(response.data);
      } catch (error) {
        setOwnerResults([]);
        setPageError(getErrorMessage(error, "Không tìm được owner phù hợp."));
      }
    };

    void fetchOwners();
  }, [debouncedUserSearch]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const resetMessages = () => {
    setPageError("");
    setPageSuccess("");
  };

  const reloadHotels = async () => {
    const response = await adminService.getAdminHotels(hotelQuery);
    setHotels(response.data);
    setMeta(response.meta);
  };

  const handleOpenCreate = () => {
    resetMessages();
    setCreateHotelForm(emptyCreateHotelForm);
    setCreateHotelCityId("");
    setSelectedOwnerLabel("");
    setUserSearchInput("");
    setOwnerResults([]);
    setCreateOpen(true);
  };

  const handleCreateHotel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.createHotel(createHotelForm);
      setCreateOpen(false);
      setCreateHotelForm(emptyCreateHotelForm);
      setPageSuccess("Đã tạo hotel mới.");
      await reloadHotels();
    } catch (error) {
      setPageError(getErrorMessage(error, "Tạo hotel thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = async (hotel: AdminHotelListItem) => {
    resetMessages();
    const matchedCity = cities.find((city) => city.name === hotel.city);

    setSelectedHotel(hotel);
    setEditHotelForm({
      id: hotel.id,
      name: hotel.name,
      description: hotel.description || "",
      address: hotel.address || "",
      district_id: hotel.district_id,
      star_rating: hotel.star_rating,
      contact_email: hotel.contact_email || "",
      contact_phone: hotel.contact_phone || "",
      status: hotel.status,
      is_active: hotel.is_active,
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

  const handleUpdateHotel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.updateHotel(editHotelForm.id, {
        name: editHotelForm.name,
        description: editHotelForm.description,
        address: editHotelForm.address,
        district_id: editHotelForm.district_id,
        star_rating: editHotelForm.star_rating,
        contact_email: editHotelForm.contact_email,
        contact_phone: editHotelForm.contact_phone,
        status: editHotelForm.status,
        is_active: editHotelForm.is_active,
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

  const handleDeleteHotel = async (hotel: AdminHotelListItem) => {
    const confirmed = window.confirm(`Xóa hotel ${hotel.name}?`);
    if (!confirmed) return;

    try {
      resetMessages();
      await adminService.deleteHotel(hotel.id);
      setPageSuccess("Đã xóa hotel.");
      await reloadHotels();
    } catch (error) {
      setPageError(getErrorMessage(error, "Xóa hotel thất bại."));
    }
  };

  const handleOpenRoomTypes = async (hotel: AdminHotelListItem) => {
    try {
      resetMessages();
      setSelectedHotel(hotel);
      const response = await adminService.getRoomTypes(hotel.id, {
        offset: 0,
        limit: 20,
        sort: "created_at_desc",
      });
      setRoomTypes(response.data);
      setRoomTypesOpen(true);
    } catch (error) {
      setPageError(getErrorMessage(error, "Không tải được room types."));
    }
  };

  const handleCreateRoomType = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!selectedHotel) return;

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.createRoomType(selectedHotel.id, {
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
      await handleOpenRoomTypes(selectedHotel);
    } catch (error) {
      setPageError(getErrorMessage(error, "Tạo room type thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Hotel Management"
        description="Tập trung vào tạo, sửa, xóa hotel và tạo room type để test backend."
        action={<AdminButton onClick={handleOpenCreate}>Tạo hotel</AdminButton>}
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}
      {pageSuccess ? (
        <AdminMessage tone="success" message={pageSuccess} />
      ) : null}

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
          value={filters.is_active}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              is_active: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Tất cả active state</option>
          <option value="true">active</option>
          <option value="false">inactive</option>
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

      <AdminPanel title="Danh sách hotels">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : hotels.length === 0 ? (
          <AdminEmptyState message="Không có hotel nào khớp bộ lọc." />
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
                          {hotel.star_rating} sao -{" "}
                          {hotel.avg_rating ?? 0}/{5} ({hotel.review_count ?? 0}{" "}
                          review)
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
                          <AdminButton onClick={() => handleOpenRoomTypes(hotel)}>
                            Room types
                          </AdminButton>
                          <AdminButton
                            variant="secondary"
                            onClick={() => void handleOpenEdit(hotel)}
                          >
                            Sửa
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            onClick={() => void handleDeleteHotel(hotel)}
                          >
                            Xóa
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
        description="Form đủ để test backend: owner, địa chỉ, tiện ích và trạng thái."
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

          <div className="space-y-2">
            <input
              className={AdminInputClassName}
              placeholder="Tìm owner theo tên hoặc email"
              value={userSearchInput}
              onChange={(event) => setUserSearchInput(event.target.value)}
            />
            {selectedOwnerLabel ? (
              <p className="text-sm text-emerald-600">
                Đã chọn owner: {selectedOwnerLabel}
              </p>
            ) : null}
            {ownerResults.length > 0 ? (
              <div className="rounded-2xl border border-slate-200">
                {ownerResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="flex w-full items-start justify-between border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                    onClick={() => {
                      setCreateHotelForm((current) => ({
                        ...current,
                        owner_id: user.id,
                      }));
                      setSelectedOwnerLabel(`${user.name} - ${user.email}`);
                      setOwnerResults([]);
                      setUserSearchInput("");
                    }}
                  >
                    <span>
                      <span className="block font-medium text-slate-900">
                        {user.name}
                      </span>
                      <span className="text-sm text-slate-500">
                        {user.email}
                      </span>
                    </span>
                    <span className="text-xs text-slate-400">
                      {user.roles.map((role) => role.name).join(", ")}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

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
            <AdminButton
              type="submit"
              disabled={submitting || !createHotelForm.owner_id}
            >
              {submitting ? "Đang tạo..." : "Tạo hotel"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={editOpen}
        title="Cập nhật hotel"
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
            <select
              className={AdminInputClassName}
              value={editHotelForm.status}
              onChange={(event) =>
                setEditHotelForm((current) => ({
                  ...current,
                  status: event.target.value as
                    | "pending"
                    | "approved"
                    | "rejected",
                }))
              }
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={editHotelForm.is_active}
              onChange={(event) =>
                setEditHotelForm((current) => ({
                  ...current,
                  is_active: event.target.checked,
                }))
              }
            />
            Hotel đang active
          </label>

          <div className="flex flex-wrap justify-end gap-3">
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
        open={roomTypesOpen}
        title={`Room types - ${selectedHotel?.name || ""}`}
        description="Xem nhanh room type hiện có và tạo thêm khi cần test."
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
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Occupancy</th>
                    <th className="px-3 py-3 font-medium">Rooms</th>
                    <th className="px-3 py-3 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.map((roomType) => (
                    <tr key={roomType.id} className="border-b border-slate-100">
                      <td className="px-3 py-4">
                        <p className="font-medium text-slate-900">
                          {roomType.name}
                        </p>
                        <p className="text-slate-500">
                          {roomType.bed_type || "--"}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {roomType.max_occupancy} khách
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {roomType.available_rooms_count ?? "--"}/
                        {roomType.total_rooms}
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {formatCurrency(roomType.base_price, roomType.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </>
  );
};

export default AdminHotelsPage;
