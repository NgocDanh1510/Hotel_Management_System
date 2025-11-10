const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class District extends Model {}

  District.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      city_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "District",
      tableName: "districts",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return District;
};
