const walletService = require("../../services/wallet.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const getWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getPartnerWallet(req.user.user_id);

    return sendSuccess(res, {
      message: "Partner wallet retrieved successfully",
      data: wallet,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner get wallet error:", error);
    next(error);
  }
};

const listTransactions = async (req, res, next) => {
  try {
    const result = await walletService.listPartnerTransactions(
      req.user.user_id,
      req.query,
    );

    return sendSuccess(res, {
      message: "Partner wallet transactions retrieved successfully",
      data: result.transactions,
      meta: result.meta,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner list wallet transactions error:", error);
    next(error);
  }
};

module.exports = {
  getWallet,
  listTransactions,
};
