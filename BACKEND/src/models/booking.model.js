const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Booking extends Model {}

  Booking.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    hotel_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    room_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    room_type_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    check_in: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    check_out: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    guests_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'cancellation_pending'),
      defaultValue: 'pending'
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    price_per_night: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    special_requests: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Booking;
};
