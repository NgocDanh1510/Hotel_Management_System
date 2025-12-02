import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminService } from "@/api/adminService";
import locationService from "@/api/locationService";
import type { PaginationMeta } from "@/types/common";

export interface AdminHotel {
  id: string;
  name: string;
  address: string;
  description?: string;
  contact_phone: string;
  contact_email: string;
  star_rating: number;
  status: string;
  is_active: boolean;
  district_id: string;
  District?: {
    id: string;
    name: string;
    city_id: string;
    City?: {
      id: string;
      name: string;
    };
  };
  created_at: string;
}

export interface AdminRoomType {
  id: string;
  name: string;
  max_adult: number;
  max_child: number;
  price: number;
}

const AdminHotelsPage: React.FC = () => {
  // --- State ---
  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    has_next: false,
  });

  const [filters, setFilters] = useState({
    q: "",
    star: "",
    sort: "created_desc",
    page: 1,
    limit: 10,
  });

  const [amenities, setAmenities] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [editDistricts, setEditDistricts] = useState<any[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoomTypesModalOpen, setIsRoomTypesModalOpen] = useState(false);
  const [isCreateRoomTypeModalOpen, setIsCreateRoomTypeModalOpen] =
    useState(false);

  const [selectedHotel, setSelectedHotel] = useState<AdminHotel | null>(null);
  const [roomTypes, setRoomTypes] = useState<AdminRoomType[]>([]);

  const [createFormData, setCreateFormData] = useState({
    name: "",
    address: "",
    city_id: "",
    district_id: "",
    description: "",
    contact_phone: "",
    contact_email: "",
    star_rating: 1,
    amenity_ids: [] as string[],
    owner_id: "",
  });

  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [selectedOwnerName, setSelectedOwnerName] = useState("");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const [editFormData, setEditFormData] = useState({
    name: "",
    address: "",
    city_id: "",
    district_id: "",
    contact_phone: "",
    contact_email: "",
    star_rating: 1,
  });

  const [createRoomTypeData, setCreateRoomTypeData] = useState({
    name: "",
    max_adult: 1,
    max_child: 0,
    price: 0,
    amenity_ids: [] as string[],
  });

  const timerSearch = useRef<number | null>(null);
  const timerUserSearch = useRef<number | null>(null);

  // --- API Calls ---
  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        star: filters.star ? Number(filters.star) : undefined,
      };
      const response = await adminService.getAdminHotels(params);
      if (response.success || response.statusCode === 200) {
        setHotels(response.data);
        setMeta(
          response.meta || {
            total: response.data.length,
            page: 1,
            limit: 10,
            has_next: false,
          },
        );
      }
    } catch (error) {
      alert("Error fetching hotels");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  useEffect(() => {
    adminService
      .getAmenities()
      .then((res) => {
        if (res.success || res.statusCode === 200) {
          setAmenities(res.data);
        }
      })
      .catch((err) => console.log(err));

    locationService
      .getCities()
      .then((res) => {
        if (res.statusCode === 200) {
          setCities(res.data);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (createFormData.city_id) {
      locationService.getDistricts(createFormData.city_id).then((res) => {
        if (res.statusCode === 200) {
          setDistricts(res.data);
        }
      });
    } else {
      setDistricts([]);
    }
  }, [createFormData.city_id]);

  useEffect(() => {
    if (editFormData.city_id) {
      locationService.getDistricts(editFormData.city_id).then((res) => {
        if (res.statusCode === 200) {
          setEditDistricts(res.data);
        }
      });
    } else {
      setEditDistricts([]);
    }
  }, [editFormData.city_id]);

  // --- Handlers ---
  const handelOnSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (timerSearch.current) clearTimeout(timerSearch.current);
    timerSearch.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }));
    }, 1000);
  };

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminService.createHotel(createFormData);
      if (res.statusCode === 201 || res.success) {
        setIsCreateModalOpen(false);
        setCreateFormData({
          name: "",
          address: "",
          city_id: "",
          district_id: "",
          description: "",
          contact_phone: "",
          contact_email: "",
          star_rating: 1,
          amenity_ids: [],
          owner_id: "",
        });
        setSelectedOwnerName("");
        fetchHotels();
      } else {
        alert(res.message || "Failed to create hotel");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create hotel");
    }
  };

  const handleOpenEdit = (hotel: AdminHotel) => {
    setSelectedHotel(hotel);
    setEditFormData({
      name: hotel.name,
      address: hotel.address || "",
      city_id: hotel.District?.City?.id || "",
      district_id: hotel.district_id || "",
      contact_phone: hotel.contact_phone,
      contact_email: hotel.contact_email || "",
      star_rating: hotel.star_rating,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    try {
      const res = await adminService.updateHotel(
        selectedHotel.id,
        editFormData,
      );
      if (res.statusCode === 200 || res.success) {
        setIsEditModalOpen(false);
        fetchHotels();
      } else {
        alert(res.message || "Failed to update hotel");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update hotel");
    }
  };

  const handleDeleteHotel = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) return;
    try {
      const res = await adminService.deleteHotel(id);
      if (res.statusCode === 200 || res.success) {
        fetchHotels();
      } else {
        alert(res.message || "Failed to delete hotel");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete hotel");
    }
  };

  const handleViewRoomTypes = async (hotel: AdminHotel) => {
    setSelectedHotel(hotel);
    try {
      const res = await adminService.getRoomTypes(hotel.id);
      if (res.statusCode === 200 || res.success) {
        setRoomTypes(res.data);
        setIsRoomTypesModalOpen(true);
      }
    } catch (err: any) {
      alert("Error fetching room types");
    }
  };

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    try {
      const payload = {
        ...createRoomTypeData,
        max_adult: Number(createRoomTypeData.max_adult),
        max_child: Number(createRoomTypeData.max_child),
        price: Number(createRoomTypeData.price),
      };
      const res = await adminService.createRoomType(selectedHotel.id, payload);
      if (res.statusCode === 201 || res.success) {
        setIsCreateRoomTypeModalOpen(false);
        setCreateRoomTypeData({
          name: "",
          max_adult: 1,
          max_child: 0,
          price: 0,
          amenity_ids: [],
        });
        // Refresh room types
        handleViewRoomTypes(selectedHotel);
      } else {
        alert(res.message || "Failed to create room type");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create room type");
    }
  };

  const handleUserSearch = (q: string) => {
    setUserSearchQuery(q);
    if (timerUserSearch.current) clearTimeout(timerUserSearch.current);

    if (!q.trim()) {
      setUserSearchResults([]);
      return;
    }

    timerUserSearch.current = window.setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await adminService.getUsers({ q, limit: 5 });
        if (res.statusCode === 200) {
          setUserSearchResults(res.data);
        }
      } catch (err) {
        console.error("User search error:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 500);
  };

  const handleSelectOwner = (user: any) => {
    setCreateFormData((p) => ({ ...p, owner_id: user.id }));
    setSelectedOwnerName(`${user.name} (${user.email})`);
    setUserSearchResults([]);
    setUserSearchQuery("");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin: Manage Hotels</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded font-bold"
        >
          + Add New Hotel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-gray-100 p-4 rounded">
        <input
          type="text"
          placeholder="Search..."
          className="border p-2 rounded"
          onChange={handelOnSearch}
        />
        <select
          className="border p-2 rounded"
          value={filters.star}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, star: e.target.value, page: 1 }))
          }
        >
          <option value="">All Stars</option>
          <option value="1">1 Star</option>
          <option value="2">2 Stars</option>
          <option value="3">3 Stars</option>
          <option value="4">4 Stars</option>
          <option value="5">5 Stars</option>
        </select>
        <select
          className="border p-2 rounded"
          value={filters.sort}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }))
          }
        >
          <option value="created_desc">Newest</option>
          <option value="created_asc">Oldest</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Location</th>
              <th className="p-2">Star</th>
              <th className="p-2">Contact</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : hotels.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  No hotels found.
                </td>
              </tr>
            ) : (
              hotels.map((hotel) => (
                <tr key={hotel.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 font-medium">{hotel.name}</td>
                  <td className="p-2">
                    {hotel.address}
                    <p className="text-xs text-gray-500">
                      {hotel.District?.name}
                    </p>
                  </td>
                  <td className="p-2">{hotel.star_rating} ⭐</td>
                  <td className="p-2">
                    <p>{hotel.contact_phone}</p>
                    <p className="text-sm text-gray-500">
                      {hotel.contact_email}
                    </p>
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => handleViewRoomTypes(hotel)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Room Types
                    </button>
                    <button
                      onClick={() => handleOpenEdit(hotel)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteHotel(hotel.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center py-2">
        <p className="text-sm">Total: {meta.total}</p>
        <div className="space-x-2">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            className="border px-3 py-1 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>Page {filters.page}</span>
          <button
            disabled={!meta.has_next}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            className="border px-3 py-1 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals */}

      {/* Create Hotel */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Hotel</h2>
            <form onSubmit={handleCreateHotel} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">
                  Owner (User Manager)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border p-2 rounded mb-1"
                    placeholder="Search user by name/email..."
                    value={userSearchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                  />
                  {selectedOwnerName && (
                    <p className="text-xs text-green-600 font-bold mb-2">
                      Selected: {selectedOwnerName}
                    </p>
                  )}
                  {isSearchingUsers && (
                    <p className="text-xs text-gray-400">Searching...</p>
                  )}
                  {userSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                      {userSearchResults.map((u) => (
                        <div
                          key={u.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleSelectOwner(u)}
                        >
                          <p className="font-bold">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {!createFormData.owner_id && (
                  <p className="text-xs text-red-500 italic">
                    * Please search and select an owner
                  </p>
                )}
              </div>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Name"
                required
                value={createFormData.name}
                onChange={(e) =>
                  setCreateFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Address"
                required
                value={createFormData.address}
                onChange={(e) =>
                  setCreateFormData((p) => ({ ...p, address: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border p-2 rounded"
                  required
                  value={createFormData.city_id}
                  onChange={(e) =>
                    setCreateFormData((p) => ({
                      ...p,
                      city_id: e.target.value,
                      district_id: "",
                    }))
                  }
                >
                  <option value="">Select City</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  className="border p-2 rounded"
                  required
                  disabled={!createFormData.city_id}
                  value={createFormData.district_id}
                  onChange={(e) =>
                    setCreateFormData((p) => ({
                      ...p,
                      district_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className="w-full border p-2 rounded"
                placeholder="Description"
                value={createFormData.description}
                onChange={(e) =>
                  setCreateFormData((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
              />
              <input
                type="tel"
                className="w-full border p-2 rounded"
                placeholder="Phone"
                required
                value={createFormData.contact_phone}
                onChange={(e) =>
                  setCreateFormData((p) => ({
                    ...p,
                    contact_phone: e.target.value,
                  }))
                }
              />
              <input
                type="email"
                className="w-full border p-2 rounded"
                placeholder="Email"
                required
                value={createFormData.contact_email}
                onChange={(e) =>
                  setCreateFormData((p) => ({
                    ...p,
                    contact_email: e.target.value,
                  }))
                }
              />
              <div>
                <label className="block text-sm">Star Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full border p-2 rounded"
                  required
                  value={createFormData.star_rating}
                  onChange={(e) =>
                    setCreateFormData((p) => ({
                      ...p,
                      star_rating: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold">Amenities:</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-2 rounded">
                  {amenities.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-1 border p-1 rounded text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={createFormData.amenity_ids.includes(a.id)}
                        onChange={() => {
                          setCreateFormData((p) => ({
                            ...p,
                            amenity_ids: p.amenity_ids.includes(a.id)
                              ? p.amenity_ids.filter((id) => id !== a.id)
                              : [...p.amenity_ids, a.id],
                          }));
                        }}
                      />
                      {a.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded font-bold"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-gray-200 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hotel */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Hotel</h2>
            <form onSubmit={handleUpdateHotel} className="space-y-4">
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Name"
                required
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Address"
                required
                value={editFormData.address}
                onChange={(e) =>
                  setEditFormData((p) => ({ ...p, address: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border p-2 rounded"
                  required
                  value={editFormData.city_id}
                  onChange={(e) =>
                    setEditFormData((p) => ({
                      ...p,
                      city_id: e.target.value,
                      district_id: "",
                    }))
                  }
                >
                  <option value="">Select City</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  className="border p-2 rounded"
                  required
                  disabled={!editFormData.city_id}
                  value={editFormData.district_id}
                  onChange={(e) =>
                    setEditFormData((p) => ({
                      ...p,
                      district_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Select District</option>
                  {editDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="tel"
                className="w-full border p-2 rounded"
                placeholder="Phone"
                required
                value={editFormData.contact_phone}
                onChange={(e) =>
                  setEditFormData((p) => ({
                    ...p,
                    contact_phone: e.target.value,
                  }))
                }
              />
              <input
                type="email"
                className="w-full border p-2 rounded"
                placeholder="Email"
                required
                value={editFormData.contact_email}
                onChange={(e) =>
                  setEditFormData((p) => ({
                    ...p,
                    contact_email: e.target.value,
                  }))
                }
              />
              <div>
                <label className="block text-sm">Star Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full border p-2 rounded"
                  required
                  value={editFormData.star_rating}
                  onChange={(e) =>
                    setEditFormData((p) => ({
                      ...p,
                      star_rating: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 text-white py-2 rounded font-bold"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-200 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Types Modal */}
      {isRoomTypesModalOpen && selectedHotel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Room Types: {selectedHotel.name}
              </h2>
              <button
                onClick={() => setIsCreateRoomTypeModalOpen(true)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold"
              >
                + Add Room Type
              </button>
            </div>

            <div className="overflow-x-auto border rounded mb-4">
              <table className="w-full text-left">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Max Adult</th>
                    <th className="p-2">Max Child</th>
                    <th className="p-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center">
                        No room types found.
                      </td>
                    </tr>
                  ) : (
                    roomTypes.map((rt) => (
                      <tr key={rt.id} className="border-t">
                        <td className="p-2 font-medium">{rt.name}</td>
                        <td className="p-2">{rt.max_adult}</td>
                        <td className="p-2">{rt.max_child}</td>
                        <td className="p-2">
                          {rt?.price?.toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setIsRoomTypesModalOpen(false)}
              className="w-full bg-gray-200 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Room Type Modal */}
      {isCreateRoomTypeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Room Type</h2>
            <form onSubmit={handleCreateRoomType} className="space-y-4">
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Room Type Name (e.g. Suite)"
                required
                value={createRoomTypeData.name}
                onChange={(e) =>
                  setCreateRoomTypeData((p) => ({ ...p, name: e.target.value }))
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm">Max Adult</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border p-2 rounded"
                    required
                    value={createRoomTypeData.max_adult}
                    onChange={(e) =>
                      setCreateRoomTypeData((p) => ({
                        ...p,
                        max_adult: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm">Max Child</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border p-2 rounded"
                    required
                    value={createRoomTypeData.max_child}
                    onChange={(e) =>
                      setCreateRoomTypeData((p) => ({
                        ...p,
                        max_child: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm">Price (VND)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="w-full border p-2 rounded"
                  required
                  value={createRoomTypeData.price}
                  onChange={(e) =>
                    setCreateRoomTypeData((p) => ({
                      ...p,
                      price: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold">Amenities:</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-2 rounded">
                  {amenities.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-1 border p-1 rounded text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={createRoomTypeData.amenity_ids.includes(a.id)}
                        onChange={() => {
                          setCreateRoomTypeData((p) => ({
                            ...p,
                            amenity_ids: p.amenity_ids.includes(a.id)
                              ? p.amenity_ids.filter((id) => id !== a.id)
                              : [...p.amenity_ids, a.id],
                          }));
                        }}
                      />
                      {a.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded font-bold"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateRoomTypeModalOpen(false)}
                  className="flex-1 bg-gray-200 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHotelsPage;
