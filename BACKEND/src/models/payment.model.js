const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Payment extends Model {}

  Payment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    booking_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    gateway: {
      type: DataTypes.ENUM('vnpay', 'momo', 'stripe', 'payos'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    type: {
      type: DataTypes.ENUM('full_payment', 'deposit', 'refund'),
      defaultValue: 'full_payment'
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    payos_order_code: {
      type: DataTypes.BIGINT,
      unique: true,
      allowNull: true
    },
    payos_payment_link_id: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true
    },
    payos_checkout_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    payos_qr_code: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Payment;
};
