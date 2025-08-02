const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RoomType extends Model {}

  RoomType.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    hotel_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    base_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'VND'
    },
    max_occupancy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_rooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    bed_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    size_sqm: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'RoomType',
    tableName: 'room_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['hotel_id', 'name']
      }
    ]
  });

  return RoomType;
};
