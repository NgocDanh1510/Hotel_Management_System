const locationService = require("../services/location.service");

const listCities = async (req, res, next) => {
  try {
    const cities = await locationService.getCities();
    return sendSuccess(res, {
      statusCode: 200,
      message: "Get cities successfully",
      data: cities,
    });
  } catch (error) {
    next(error);
  }
};

const listDistricts = async (req, res, next) => {
  try {
    const { city_id } = req.query;
    const districts = await locationService.getDistricts(city_id);
    return sendSuccess(res, {
      statusCode: 200,
      message: "Get districts successfully",
      data: districts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCities,
  listDistricts,
};
