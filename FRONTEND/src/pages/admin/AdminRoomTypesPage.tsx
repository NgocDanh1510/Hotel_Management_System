import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminService } from "@/api/adminService";
import type {
  AdminRoomTypeListItem,
  HotelImageItem,
  HotelImageUploadPayload,
} from "@/features/admin/types";
import {
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

const defaultMeta: PaginationMeta = {
  total: 0,
  offset: 0,
  limit: 10,
  has_next: false,
};

const emptyRoomTypeForm = {
  hotel_id: "",
  name: "",
  description: "",
  base_price: 0,
  currency: "VND",
  max_occupancy: 2,
  total_rooms: 1,
  bed_type: "",
  size_sqm: 0,
};

const AdminRoomTypesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hotelId = searchParams.get("hotelId") || "";
  const [roomTypes, setRoomTypes] = useState<AdminRoomTypeListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 450);
  const [filters, setFilters] = useState({
    sort: "created_at_desc",
    page: 1,
    limit: 10,
  });

  const [selectedRoomType, setSelectedRoomType] =
    useState<AdminRoomTypeListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [imageManagerOpen, setImageManagerOpen] = useState(false);
  const [roomTypeImages, setRoomTypeImages] = useState<HotelImageItem[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [createForm, setCreateForm] = useState(emptyRoomTypeForm);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    description: "",
    base_price: 0,
    currency: "VND",
    max_occupancy: 2,
    total_rooms: 1,
    bed_type: "",
    size_sqm: 0,
  });

  const query = useMemo(
    () => ({
      hotelId: hotelId || undefined,
      q: debouncedSearch || undefined,
      sort: filters.sort,
      offset: getOffsetFromPage(filters.page, filters.limit),
      limit: filters.limit,
    }),
    [debouncedSearch, filters, hotelId],
  );

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        setLoading(true);
        setPageError("");
        const response = await adminService.getRoomTypeList(query);
        setRoomTypes(response.data);
        setMeta(response.meta);
      } catch (error) {
        setPageError(getErrorMessage(error, "Không tải được room types."));
      } finally {
        setLoading(false);
      }
    };

    void fetchRoomTypes();
  }, [query]);

  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch, hotelId]);

  const resetMessages = () => {
    setPageError("");
    setPageSuccess("");
  };

  const reloadRoomTypes = async () => {
    const response = await adminService.getRoomTypeList(query);
    setRoomTypes(response.data);
    setMeta(response.meta);
  };

  const selectedHotelName = roomTypes.find((roomType) => roomType.Hotel?.name)
    ?.Hotel?.name;

  const openCreate = () => {
    resetMessages();
    setCreateForm({ ...emptyRoomTypeForm, hotel_id: hotelId });
    setCreateOpen(true);
  };

  const openEdit = (roomType: AdminRoomTypeListItem) => {
    resetMessages();
    setSelectedRoomType(roomType);
    setEditForm({
      id: roomType.id,
      name: roomType.name,
      description: roomType.description || "",
      base_price: roomType.base_price,
      currency: roomType.currency,
      max_occupancy: roomType.max_occupancy,
      total_rooms: roomType.total_rooms,
      bed_type: roomType.bed_type || "",
      size_sqm: roomType.size_sqm || 0,
    });
    setEditOpen(true);
  };

  const loadRoomTypeImages = async (roomTypeId: string) => {
    try {
      setImagesLoading(true);
      const response = await adminService.getRoomTypeImages(roomTypeId);
      setRoomTypeImages(response.data);
    } catch (error) {
      setRoomTypeImages([]);
      setPageError(getErrorMessage(error, "Không tải được ảnh room type."));
    } finally {
      setImagesLoading(false);
    }
  };

  const openImageManager = async (roomType: AdminRoomTypeListItem) => {
    resetMessages();
    setSelectedRoomType(roomType);
    setRoomTypeImages([]);
    setImageManagerOpen(true);
    await loadRoomTypeImages(roomType.id);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.createRoomTypeWithHotel({
        hotel_id: createForm.hotel_id,
        name: createForm.name,
        description: createForm.description || undefined,
        base_price: createForm.base_price,
        currency: createForm.currency,
        max_occupancy: createForm.max_occupancy,
        total_rooms: createForm.total_rooms,
        bed_type: createForm.bed_type || undefined,
        size_sqm: createForm.size_sqm || undefined,
      });
      setCreateOpen(false);
      setPageSuccess("Đã tạo room type.");
      await reloadRoomTypes();
    } catch (error) {
      setPageError(getErrorMessage(error, "Tạo room type thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.updateRoomType(editForm.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        base_price: editForm.base_price,
        currency: editForm.currency,
        max_occupancy: editForm.max_occupancy,
        total_rooms: editForm.total_rooms,
        bed_type: editForm.bed_type || undefined,
        size_sqm: editForm.size_sqm || undefined,
      });
      setEditOpen(false);
      setPageSuccess("Đã cập nhật room type.");
      await reloadRoomTypes();
    } catch (error) {
      setPageError(getErrorMessage(error, "Cập nhật room type thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roomType: AdminRoomTypeListItem) => {
    const confirmed = window.confirm(`Xóa room type ${roomType.name}?`);
    if (!confirmed) return;

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.deleteRoomType(roomType.id);
      setPageSuccess("Đã xóa room type.");
      await reloadRoomTypes();
    } catch (error) {
      setPageError(getErrorMessage(error, "Xóa room type thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImage = async (payload: HotelImageUploadPayload) => {
    if (!selectedRoomType) return;

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.addRoomTypeImage(selectedRoomType.id, payload);
      setPageSuccess("Đã thêm ảnh room type.");
      await loadRoomTypeImages(selectedRoomType.id);
    } catch (error) {
      setPageError(getErrorMessage(error, "Thêm ảnh room type thất bại."));
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (image: HotelImageItem) => {
    if (!selectedRoomType) return;

    const confirmed = window.confirm(`Xóa ảnh ${image.public_id}?`);
    if (!confirmed) return;

    try {
      setSubmitting(true);
      resetMessages();
      await adminService.deleteRoomTypeImage(selectedRoomType.id, image.id);
      setPageSuccess("Đã xóa ảnh room type.");
      await loadRoomTypeImages(selectedRoomType.id);
    } catch (error) {
      setPageError(getErrorMessage(error, "Xóa ảnh room type thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const goToRooms = (roomType: AdminRoomTypeListItem) => {
    const targetHotelId = roomType.hotel_id || roomType.Hotel?.id || hotelId;
    const params = new URLSearchParams({ roomTypeId: roomType.id });
    if (targetHotelId) params.set("hotelId", targetHotelId);
    navigate(`/admin/rooms?${params.toString()}`);
  };

  return (
    <>
      <AdminPageHeader
        title="Room Type Management"
        description={
          hotelId
            ? `Đang lọc room type theo hotel ${selectedHotelName || hotelId}.`
            : "Quản lý danh sách room type của tất cả khách sạn."
        }
        action={
          <div className="flex flex-wrap gap-2">
            {hotelId ? (
              <AdminButton
                variant="secondary"
                onClick={() => navigate("/admin/room-types")}
              >
                Bỏ lọc hotel
              </AdminButton>
            ) : null}
            <AdminButton onClick={openCreate}>Tạo room type</AdminButton>
          </div>
        }
      />

      {pageError ? <AdminMessage tone="error" message={pageError} /> : null}
      {pageSuccess ? <AdminMessage tone="success" message={pageSuccess} /> : null}

      <AdminToolbar>
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className={`${AdminInputClassName} md:max-w-xs`}
          placeholder="Tìm theo tên room type"
        />
        <select
          className={`${AdminInputClassName} md:max-w-[220px]`}
          value={filters.sort}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              sort: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="created_at_desc">Mới tạo</option>
          <option value="created_at">Cũ nhất</option>
          <option value="base_price">Giá tăng dần</option>
          <option value="base_price_desc">Giá giảm dần</option>
          <option value="max_occupancy">Sức chứa tăng dần</option>
          <option value="max_occupancy_desc">Sức chứa giảm dần</option>
        </select>
      </AdminToolbar>

      <AdminPanel title="Danh sách room types">
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : roomTypes.length === 0 ? (
          <AdminEmptyState message="Không có room type nào khớp bộ lọc." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-3 font-medium">Room Type</th>
                    <th className="px-3 py-3 font-medium">Hotel</th>
                    <th className="px-3 py-3 font-medium">Occupancy</th>
                    <th className="px-3 py-3 font-medium">Rooms</th>
                    <th className="px-3 py-3 font-medium">Price</th>
                    <th className="px-3 py-3 font-medium">Created</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.map((roomType) => (
                    <tr
                      key={roomType.id}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-4 align-top">
                        <p className="font-medium text-slate-900">
                          {roomType.name}
                        </p>
                        <p className="text-slate-500">
                          {roomType.bed_type || "--"}
                        </p>
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        {roomType.Hotel?.name || "--"}
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        {roomType.max_occupancy} khách
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        {roomType.available_rooms_count ?? 0}/
                        {roomType.total_rooms}
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        {formatCurrency(
                          roomType.base_price,
                          roomType.currency,
                        )}
                      </td>
                      <td className="px-3 py-4 align-top text-slate-500">
                        {formatDateTime(roomType.created_at)}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <AdminButton
                            variant="secondary"
                            onClick={() => goToRooms(roomType)}
                          >
                            Rooms
                          </AdminButton>
                          <AdminButton
                            variant="secondary"
                            onClick={() => openEdit(roomType)}
                          >
                            Sửa
                          </AdminButton>
                          <AdminButton
                            variant="ghost"
                            onClick={() => void openImageManager(roomType)}
                          >
                            Ảnh
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            disabled={submitting}
                            onClick={() => void handleDelete(roomType)}
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
        title="Tạo room type"
        onClose={() => setCreateOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <input
            required
            className={AdminInputClassName}
            placeholder="Hotel ID"
            value={createForm.hotel_id}
            readOnly={Boolean(hotelId)}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                hotel_id: event.target.value,
              }))
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              className={AdminInputClassName}
              placeholder="Tên room type"
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Loại giường"
              value={createForm.bed_type}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  bed_type: event.target.value,
                }))
              }
            />
          </div>
          <textarea
            className={AdminInputClassName}
            placeholder="Mô tả"
            value={createForm.description}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          <RoomTypeInputs form={createForm} setForm={setCreateForm} />
          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton variant="secondary" onClick={() => setCreateOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang tạo..." : "Tạo room type"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={editOpen}
        title={`Cập nhật room type - ${selectedRoomType?.name || ""}`}
        onClose={() => setEditOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleEdit}>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              className={AdminInputClassName}
              placeholder="Tên room type"
              value={editForm.name}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <input
              className={AdminInputClassName}
              placeholder="Loại giường"
              value={editForm.bed_type}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  bed_type: event.target.value,
                }))
              }
            />
          </div>
          <textarea
            className={AdminInputClassName}
            placeholder="Mô tả"
            value={editForm.description}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          <RoomTypeInputs form={editForm} setForm={setEditForm} />
          <div className="flex flex-wrap justify-end gap-3">
            <AdminButton variant="secondary" onClick={() => setEditOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu room type"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={imageManagerOpen}
        title={`Ảnh room type - ${selectedRoomType?.name || ""}`}
        description="Ảnh room type được quản lý riêng, không đi qua API cập nhật thông tin."
        onClose={() => setImageManagerOpen(false)}
      >
        <HotelImageManager
          images={roomTypeImages}
          loading={imagesLoading}
          submitting={submitting}
          emptyMessage="Room type này chưa có ảnh nào."
          onAdd={handleAddImage}
          onDelete={handleDeleteImage}
        />
      </AdminModal>
    </>
  );
};

type RoomTypeNumberForm = {
  base_price: number;
  currency: string;
  max_occupancy: number;
  total_rooms: number;
  size_sqm: number;
};

const RoomTypeInputs = <T extends RoomTypeNumberForm>({
  form,
  setForm,
}: {
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
}) => (
  <>
    <div className="grid gap-4 md:grid-cols-4">
      <input
        type="number"
        min={1}
        className={AdminInputClassName}
        placeholder="Giá"
        value={form.base_price}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            base_price: Number(event.target.value),
          }))
        }
      />
      <input
        className={AdminInputClassName}
        placeholder="Currency"
        value={form.currency}
        onChange={(event) =>
          setForm((current) => ({
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
        value={form.max_occupancy}
        onChange={(event) =>
          setForm((current) => ({
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
        value={form.total_rooms}
        onChange={(event) =>
          setForm((current) => ({
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
      value={form.size_sqm}
      onChange={(event) =>
        setForm((current) => ({
          ...current,
          size_sqm: Number(event.target.value),
        }))
      }
    />
  </>
);

export default AdminRoomTypesPage;
