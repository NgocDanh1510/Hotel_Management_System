const { City, District } = require("../models");

class LocationService {
  async getCities() {
    return await City.findAll({
      order: [["name", "ASC"]],
    });
  }

  async getDistricts(cityId) {
    const where = {};
    if (cityId) where.city_id = cityId;
    return await District.findAll({
      where,
      order: [["name", "ASC"]],
    });
  }
}

module.exports = new LocationService();
