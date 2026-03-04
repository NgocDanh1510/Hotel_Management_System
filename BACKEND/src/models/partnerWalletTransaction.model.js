const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class PartnerWalletTransaction extends Model {}

  PartnerWalletTransaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      wallet_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      partner_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      booking_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      payment_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      withdrawal_request_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM(
          "pending_credit",
          "release_available",
          "refund_reversal",
          "withdrawal_hold",
          "withdrawal_paid",
          "withdrawal_rejected",
        ),
        allowNull: false,
      },
      balance_type: {
        type: DataTypes.ENUM("pending", "available", "withdrawal_pending"),
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      gross_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      commission_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      idempotency_key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PartnerWalletTransaction",
      tableName: "partner_wallet_transactions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return PartnerWalletTransaction;
};
