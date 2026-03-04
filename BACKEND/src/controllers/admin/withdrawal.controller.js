const walletService = require("../../services/wallet.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const listWithdrawals = async (req, res, next) => {
  try {
    const result = await walletService.listAllWithdrawals(req.query);

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
    console.error("Admin list withdrawals error:", error);
    next(error);
  }
};

const processWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await walletService.processWithdrawal(
      req.params.id,
      req.body,
      req.user,
    );

    return sendSuccess(res, {
      message: `Withdrawal request marked as ${withdrawal.status}`,
      data: withdrawal,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    console.error("Admin process withdrawal error:", error);
    next(error);
  }
};

module.exports = {
  listWithdrawals,
  processWithdrawal,
};
