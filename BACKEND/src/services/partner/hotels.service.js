const { Hotel, Amenity } = require("../../models");
const { Op } = require("sequelize");
const adminHotelService = require("../admin/hotels.service");

class PartnerHotelService {
  async createHotel(data, user) {
    const { name, slug, amenity_ids, ...otherData } = data;
    const finalSlug = slug || (await adminHotelService.getUniqueSlug(name));

    const hotel = await Hotel.create({
      name,
      owner_id: user.user_id,
      slug: finalSlug,
      status: "pending",
      is_active: true,
      ...otherData,
    });

    if (amenity_ids && amenity_ids.length > 0) {
      const amenities = await Amenity.findAll({
        where: { id: amenity_ids },
        attributes: ["id", "name"],
      });

      if (amenities.length !== amenity_ids.length) {
        const error = new Error("One or more amenities do not exist");
        error.statusCode = 400;
        throw error;
      }

      await hotel.addAmenities(amenities);
    }

    return hotel.toJSON();
  }

  async listHotels(query, user) {
    return adminHotelService.listHotels({
      ...query,
      owner_id: user.user_id,
    });
  }

  async updateHotel(hotelId, data, user) {
    return adminHotelService.updateHotel(
      hotelId,
      data,
      user.user_id,
      ["hotel.manage_own"],
    );
  }

  async submitForReview(hotelId, user) {
    const hotel = await Hotel.findByPk(hotelId);

    if (!hotel || hotel.deleted_at) {
      const error = new Error("Hotel not found");
      error.statusCode = 404;
      throw error;
    }

    if (hotel.owner_id !== user.user_id) {
      const error = new Error("You do not have permission to manage this hotel");
      error.statusCode = 403;
      throw error;
    }

    if (hotel.status === "approved") {
      const error = new Error("Approved hotel does not need to be submitted again");
      error.statusCode = 400;
      throw error;
    }

    await hotel.update({ status: "pending" });

    return hotel.toJSON();
  }
}

module.exports = new PartnerHotelService();
