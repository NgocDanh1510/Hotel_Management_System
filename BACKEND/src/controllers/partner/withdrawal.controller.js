const walletService = require("../../services/wallet.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const listWithdrawals = async (req, res, next) => {
  try {
    const result = await walletService.listPartnerWithdrawals(
      req.user.user_id,
      req.query,
    );

    return sendSuccess(res, {
      message: "Withdrawal requests retrieved successfully",
      data: result.withdrawals,
      meta: result.meta,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner list withdrawals error:", error);
    next(error);
  }
};

const createWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await walletService.createWithdrawalRequest(
      req.user.user_id,
      req.body,
    );

    return sendSuccess(res, {
      statusCode: 201,
      message: "Withdrawal request created successfully",
      data: withdrawal,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Partner create withdrawal error:", error);
    next(error);
  }
};

module.exports = {
  listWithdrawals,
  createWithdrawal,
};
