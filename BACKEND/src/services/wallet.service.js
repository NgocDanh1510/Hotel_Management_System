const {
  Booking,
  Hotel,
  PartnerWallet,
  PartnerWalletTransaction,
  Payment,
  User,
  WithdrawalRequest,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

const COMMISSION_RATE = 0.1;

class WalletService {
  async getPartnerWallet(partnerId) {
    const wallet = await this._getOrCreateWallet(partnerId);
    const transactions = await PartnerWalletTransaction.findAll({
      where: { wallet_id: wallet.id },
      order: [["created_at", "DESC"]],
      limit: 10,
    });

    return {
      wallet: this._serializeWallet(wallet),
      recent_transactions: transactions.map((item) =>
        this._serializeTransaction(item),
      ),
    };
  }

  async listPartnerTransactions(partnerId, query = {}) {
    const wallet = await this._getOrCreateWallet(partnerId);
    const offsetNum = Math.max(0, parseInt(query.offset, 10) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));

    const { count, rows } = await PartnerWalletTransaction.findAndCountAll({
      where: { wallet_id: wallet.id },
      order: [["created_at", "DESC"]],
      offset: offsetNum,
      limit: limitNum,
    });

    return {
      transactions: rows.map((item) => this._serializeTransaction(item)),
      meta: {
        total: count,
        offset: offsetNum,
        limit: limitNum,
        has_next: offsetNum + limitNum < count,
      },
    };
  }

  async creditPartnerPendingForPayment(payment, bookingInput, transaction) {
    const booking = await this._loadBookingWithHotel(
      bookingInput || payment.Booking || payment.booking_id,
      transaction,
    );

    if (!booking?.Hotel?.owner_id) {
      const error = new Error("Booking hotel owner not found");
      error.statusCode = 404;
      throw error;
    }

    const idempotencyKey = `booking:${booking.id}:payment:${payment.id}:pending_credit`;
    const existing = await PartnerWalletTransaction.findOne({
      where: { idempotency_key: idempotencyKey },
      transaction,
    });

    if (existing) {
      return existing;
    }

    const grossCents = this._toCents(booking.total_price || payment.amount);
    const commissionCents = Math.round(grossCents * COMMISSION_RATE);
    const partnerCents = grossCents - commissionCents;
    const wallet = await this._getOrCreateWallet(booking.Hotel.owner_id, transaction);

    await wallet.update(
      {
        pending_balance: this._money(
          this._toCents(wallet.pending_balance) + partnerCents,
        ),
        total_earned: this._money(
          this._toCents(wallet.total_earned) + partnerCents,
        ),
      },
      { transaction },
    );

    return PartnerWalletTransaction.create(
      {
        wallet_id: wallet.id,
        partner_id: wallet.partner_id,
        booking_id: booking.id,
        payment_id: payment.id,
        type: "pending_credit",
        balance_type: "pending",
        amount: this._money(partnerCents),
        gross_amount: this._money(grossCents),
        commission_amount: this._money(commissionCents),
        idempotency_key: idempotencyKey,
        note: "PayOS payment success credited to pending balance",
      },
      { transaction },
    );
  }

  async releaseBookingEarnings(bookingId, transaction) {
    const idempotencyKey = `booking:${bookingId}:release_available`;
    const existing = await PartnerWalletTransaction.findOne({
      where: { idempotency_key: idempotencyKey },
      transaction,
    });

    if (existing) {
      return existing;
    }

    const credit = await PartnerWalletTransaction.findOne({
      where: { booking_id: bookingId, type: "pending_credit" },
      order: [["created_at", "ASC"]],
      transaction,
    });

    if (!credit) {
      return null;
    }

    const wallet = await this._getWalletByIdForUpdate(credit.wallet_id, transaction);
    const amountCents = this._toCents(credit.amount);

    await wallet.update(
      {
        pending_balance: this._money(
          this._toCents(wallet.pending_balance) - amountCents,
        ),
        available_balance: this._money(
          this._toCents(wallet.available_balance) + amountCents,
        ),
      },
      { transaction },
    );

    return PartnerWalletTransaction.create(
      {
        wallet_id: wallet.id,
        partner_id: wallet.partner_id,
        booking_id: bookingId,
        payment_id: credit.payment_id,
        type: "release_available",
        balance_type: "available",
        amount: credit.amount,
        idempotency_key: idempotencyKey,
        note: "Booking checked out; pending balance released to available",
      },
      { transaction },
    );
  }

  async reversePartnerEarningsForRefund(refundPayment, transaction) {
    const credit = await PartnerWalletTransaction.findOne({
      where: {
        booking_id: refundPayment.booking_id,
        type: "pending_credit",
      },
      transaction,
    });

    if (!credit) {
      return null;
    }

    const idempotencyKey = `payment:${refundPayment.id}:refund_reversal`;
    const existing = await PartnerWalletTransaction.findOne({
      where: { idempotency_key: idempotencyKey },
      transaction,
    });

    if (existing) {
      return existing;
    }

    const existingReversals = await PartnerWalletTransaction.findAll({
      where: {
        booking_id: refundPayment.booking_id,
        type: "refund_reversal",
      },
      attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
      raw: true,
      transaction,
    });

    const creditCents = this._toCents(credit.amount);
    const reversedCents = this._toCents(existingReversals[0]?.total || 0);
    const remainingCents = Math.max(0, creditCents - reversedCents);
    const refundGrossCents = this._toCents(refundPayment.amount);
    const refundCommissionCents = Math.round(refundGrossCents * COMMISSION_RATE);
    const requestedReverseCents = refundGrossCents - refundCommissionCents;
    const reverseCents = Math.min(remainingCents, requestedReverseCents);

    if (reverseCents <= 0) {
      return null;
    }

    const released = await PartnerWalletTransaction.findOne({
      where: {
        booking_id: refundPayment.booking_id,
        type: "release_available",
      },
      transaction,
    });

    const wallet = await this._getWalletByIdForUpdate(credit.wallet_id, transaction);
    const sourceBalance = released ? "available_balance" : "pending_balance";

    await wallet.update(
      {
        [sourceBalance]: this._money(
          this._toCents(wallet[sourceBalance]) - reverseCents,
        ),
        total_earned: this._money(
          this._toCents(wallet.total_earned) - reverseCents,
        ),
      },
      { transaction },
    );

    return PartnerWalletTransaction.create(
      {
        wallet_id: wallet.id,
        partner_id: wallet.partner_id,
        booking_id: refundPayment.booking_id,
        payment_id: refundPayment.id,
        type: "refund_reversal",
        balance_type: released ? "available" : "pending",
        amount: this._money(reverseCents),
        gross_amount: this._money(refundGrossCents),
        commission_amount: this._money(refundCommissionCents),
        idempotency_key: idempotencyKey,
        note: "Refund reversed partner revenue",
      },
      { transaction },
    );
  }

  async createWithdrawalRequest(partnerId, data) {
    const amountCents = this._toCents(data.amount);

    if (amountCents <= 0) {
      const error = new Error("Withdrawal amount must be positive");
      error.statusCode = 400;
      throw error;
    }

    const transaction = await sequelize.transaction();
    try {
      const wallet = await this._getOrCreateWallet(partnerId, transaction);

      if (this._toCents(wallet.available_balance) < amountCents) {
        const error = new Error("Insufficient available balance");
        error.statusCode = 400;
        throw error;
      }

      const withdrawal = await WithdrawalRequest.create(
        {
          partner_id: partnerId,
          wallet_id: wallet.id,
          amount: this._money(amountCents),
          bank_name: data.bank_name,
          bank_account_number: data.bank_account_number,
          bank_account_name: data.bank_account_name,
          bank_bin: data.bank_bin || null,
        },
        { transaction },
      );

      await wallet.update(
        {
          available_balance: this._money(
            this._toCents(wallet.available_balance) - amountCents,
          ),
          withdrawal_pending_balance: this._money(
            this._toCents(wallet.withdrawal_pending_balance) + amountCents,
          ),
        },
        { transaction },
      );

      await PartnerWalletTransaction.create(
        {
          wallet_id: wallet.id,
          partner_id: partnerId,
          withdrawal_request_id: withdrawal.id,
          type: "withdrawal_hold",
          balance_type: "withdrawal_pending",
          amount: this._money(amountCents),
          idempotency_key: `withdrawal:${withdrawal.id}:hold`,
          note: "Withdrawal request created; available balance held",
        },
        { transaction },
      );

      await transaction.commit();
      return this._serializeWithdrawal(withdrawal);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async listPartnerWithdrawals(partnerId, query = {}) {
    return this._listWithdrawals({ partner_id: partnerId }, query);
  }

  async listAllWithdrawals(query = {}) {
    return this._listWithdrawals({}, query);
  }

  async processWithdrawal(withdrawalId, data, adminUser) {
    const transaction = await sequelize.transaction();

    try {
      const withdrawal = await WithdrawalRequest.findByPk(withdrawalId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!withdrawal) {
        const error = new Error("Withdrawal request not found");
        error.statusCode = 404;
        throw error;
      }

      if (withdrawal.status !== "pending") {
        const error = new Error("Only pending withdrawal requests can be processed");
        error.statusCode = 400;
        throw error;
      }

      const wallet = await this._getWalletByIdForUpdate(
        withdrawal.wallet_id,
        transaction,
      );
      const amountCents = this._toCents(withdrawal.amount);
      const nextStatus = data.status;

      if (nextStatus === "paid") {
        await wallet.update(
          {
            withdrawal_pending_balance: this._money(
              this._toCents(wallet.withdrawal_pending_balance) - amountCents,
            ),
            total_withdrawn: this._money(
              this._toCents(wallet.total_withdrawn) + amountCents,
            ),
          },
          { transaction },
        );

        await PartnerWalletTransaction.create(
          {
            wallet_id: wallet.id,
            partner_id: wallet.partner_id,
            withdrawal_request_id: withdrawal.id,
            type: "withdrawal_paid",
            balance_type: "withdrawal_pending",
            amount: withdrawal.amount,
            idempotency_key: `withdrawal:${withdrawal.id}:paid`,
            note: data.admin_note || "Withdrawal marked as paid by admin",
          },
          { transaction },
        );
      } else {
        await wallet.update(
          {
            withdrawal_pending_balance: this._money(
              this._toCents(wallet.withdrawal_pending_balance) - amountCents,
            ),
            available_balance: this._money(
              this._toCents(wallet.available_balance) + amountCents,
            ),
          },
          { transaction },
        );

        await PartnerWalletTransaction.create(
          {
            wallet_id: wallet.id,
            partner_id: wallet.partner_id,
            withdrawal_request_id: withdrawal.id,
            type: "withdrawal_rejected",
            balance_type: "available",
            amount: withdrawal.amount,
            idempotency_key: `withdrawal:${withdrawal.id}:rejected`,
            note: data.admin_note || "Withdrawal rejected; hold released",
          },
          { transaction },
        );
      }

      await withdrawal.update(
        {
          status: nextStatus,
          admin_id: adminUser.user_id,
          admin_note: data.admin_note || null,
          transfer_reference: data.transfer_reference || null,
          processed_at: new Date(),
        },
        { transaction },
      );

      await transaction.commit();
      return this._serializeWithdrawal(withdrawal);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async _listWithdrawals(whereBase, query = {}) {
    const offsetNum = Math.max(0, parseInt(query.offset, 10) || 0);
    const limitNum = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const where = { ...whereBase };

    if (query.status) {
      where.status = query.status;
    }

    if (query.q) {
      where[Op.or] = [
        { bank_account_name: { [Op.like]: `%${query.q}%` } },
        { bank_account_number: { [Op.like]: `%${query.q}%` } },
        { transfer_reference: { [Op.like]: `%${query.q}%` } },
      ];
    }

    const { count, rows } = await WithdrawalRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: "partner", attributes: ["id", "name", "email"] },
        { model: User, as: "admin", attributes: ["id", "name", "email"] },
      ],
      order: [["created_at", "DESC"]],
      offset: offsetNum,
      limit: limitNum,
      distinct: true,
    });

    return {
      withdrawals: rows.map((item) => this._serializeWithdrawal(item)),
      meta: {
        total: count,
        offset: offsetNum,
        limit: limitNum,
        has_next: offsetNum + limitNum < count,
      },
    };
  }

  async _loadBookingWithHotel(bookingInput, transaction) {
    if (bookingInput && typeof bookingInput === "object" && bookingInput.Hotel) {
      return bookingInput;
    }

    const bookingId =
      bookingInput && typeof bookingInput === "object"
        ? bookingInput.id
        : bookingInput;

    return Booking.findByPk(bookingId, {
      include: [{ model: Hotel, attributes: ["id", "owner_id"] }],
      transaction,
    });
  }

  async _getOrCreateWallet(partnerId, transaction = null) {
    const [wallet] = await PartnerWallet.findOrCreate({
      where: { partner_id: partnerId },
      defaults: {
        partner_id: partnerId,
        pending_balance: 0,
        available_balance: 0,
        withdrawal_pending_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      },
      transaction,
    });

    if (!transaction) {
      return wallet;
    }

    return this._getWalletByIdForUpdate(wallet.id, transaction);
  }

  async _getWalletByIdForUpdate(walletId, transaction) {
    return PartnerWallet.findByPk(walletId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  _serializeWallet(wallet) {
    return {
      id: wallet.id,
      partner_id: wallet.partner_id,
      pending_balance: this._number(wallet.pending_balance),
      available_balance: this._number(wallet.available_balance),
      withdrawal_pending_balance: this._number(wallet.withdrawal_pending_balance),
      total_earned: this._number(wallet.total_earned),
      total_withdrawn: this._number(wallet.total_withdrawn),
      created_at: wallet.created_at,
      updated_at: wallet.updated_at,
    };
  }

  _serializeTransaction(transaction) {
    return {
      id: transaction.id,
      wallet_id: transaction.wallet_id,
      partner_id: transaction.partner_id,
      booking_id: transaction.booking_id,
      payment_id: transaction.payment_id,
      withdrawal_request_id: transaction.withdrawal_request_id,
      type: transaction.type,
      balance_type: transaction.balance_type,
      amount: this._number(transaction.amount),
      gross_amount:
        transaction.gross_amount === null
          ? null
          : this._number(transaction.gross_amount),
      commission_amount:
        transaction.commission_amount === null
          ? null
          : this._number(transaction.commission_amount),
      note: transaction.note,
      created_at: transaction.created_at,
    };
  }

  _serializeWithdrawal(withdrawal) {
    const plain = withdrawal.get ? withdrawal.get({ plain: true }) : withdrawal;

    return {
      id: plain.id,
      partner_id: plain.partner_id,
      wallet_id: plain.wallet_id,
      amount: this._number(plain.amount),
      bank_name: plain.bank_name,
      bank_account_number: plain.bank_account_number,
      bank_account_name: plain.bank_account_name,
      bank_bin: plain.bank_bin,
      status: plain.status,
      admin_id: plain.admin_id,
      admin_note: plain.admin_note,
      transfer_reference: plain.transfer_reference,
      processed_at: plain.processed_at,
      created_at: plain.created_at,
      updated_at: plain.updated_at,
      partner: plain.partner || null,
      admin: plain.admin || null,
    };
  }

  _toCents(value) {
    return Math.round((Number(value) || 0) * 100);
  }

  _money(cents) {
    return (cents / 100).toFixed(2);
  }

  _number(value) {
    return Number(value || 0);
  }
}

module.exports = new WalletService();
