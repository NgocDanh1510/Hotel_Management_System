const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class WithdrawalRequest extends Model {}

  WithdrawalRequest.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      partner_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      wallet_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      bank_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      bank_account_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      bank_account_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      bank_bin: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "paid", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      admin_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      admin_note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      transfer_reference: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "WithdrawalRequest",
      tableName: "withdrawal_requests",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return WithdrawalRequest;
};
