const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RoomTypeAmenity extends Model {}

  RoomTypeAmenity.init({
    room_type_id: {
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
    modelName: 'RoomTypeAmenity',
    tableName: 'room_type_amenities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return RoomTypeAmenity;
};
