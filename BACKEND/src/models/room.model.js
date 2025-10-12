const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Room extends Model {}

  Room.init({
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
    room_type_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    room_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'maintenance'),
      defaultValue: 'available'
    }
  }, {
    sequelize,
    modelName: 'Room',
    tableName: 'rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['hotel_id', 'room_number']
      }
    ]
  });

  return Room;
};
