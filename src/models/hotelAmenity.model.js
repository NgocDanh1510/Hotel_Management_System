const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class HotelAmenity extends Model {}

  HotelAmenity.init({
    hotel_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    amenity_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    modelName: 'HotelAmenity',
    tableName: 'hotel_amenities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return HotelAmenity;
};
