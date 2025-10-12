const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Review extends Model {}

  Review.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    booking_id: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    hotel_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    rating_overall: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating_cleanliness: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rating_service: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rating_location: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Review;
};
