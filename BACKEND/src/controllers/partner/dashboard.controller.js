const partnerDashboardService = require("../../services/partner/dashboard.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await partnerDashboardService.getDashboard(req.user);

    return sendSuccess(res, {
      message: "Dashboard retrieved successfully",
      data: dashboard,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner dashboard error:", error);
    next(error);
  }
};

module.exports = {
  getDashboard,
};
