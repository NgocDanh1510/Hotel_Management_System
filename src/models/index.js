const sequelize = require("../config/database");

// Import models
const User = require("./user.model")(sequelize);
const Role = require("./role.model")(sequelize);
const Permission = require("./permission.model")(sequelize);
const UserRole = require("./userRole.model")(sequelize);
const RolePermission = require("./rolePermission.model")(sequelize);
const RefreshToken = require("./refreshToken.model")(sequelize);
const Hotel = require("./hotel.model")(sequelize);
const Amenity = require("./amenity.model")(sequelize);
const HotelAmenity = require("./hotelAmenity.model")(sequelize);
const RoomType = require("./roomType.model")(sequelize);
const RoomTypeAmenity = require("./roomTypeAmenity.model")(sequelize);
const Room = require("./room.model")(sequelize);
const Booking = require("./booking.model")(sequelize);
const Payment = require("./payment.model")(sequelize);
const Review = require("./review.model")(sequelize);
const Image = require("./image.model")(sequelize);

// === ASSOCIATIONS ===

// User
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "user_id",
  otherKey: "role_id",
});

User.hasMany(RefreshToken, { foreignKey: "user_id" });
User.hasMany(Booking, { foreignKey: "user_id" });
User.hasMany(Review, { foreignKey: "user_id" });

// Role
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "role_id",
  otherKey: "permission_id",
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permission_id",
  otherKey: "role_id",
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "role_id",
  otherKey: "user_id",
});

// Hotel
Hotel.belongsTo(User, { as: "owner", foreignKey: "owner_id" });
Hotel.hasMany(RoomType, { foreignKey: "hotel_id" });
Hotel.hasMany(Room, { foreignKey: "hotel_id" });
Hotel.hasMany(Booking, { foreignKey: "hotel_id" });
Hotel.hasMany(Review, { foreignKey: "hotel_id" });
Hotel.belongsToMany(Amenity, { through: HotelAmenity, foreignKey: "hotel_id" });
Hotel.hasMany(Image, {
  foreignKey: "entity_id",
  constraints: false,
  scope: { entity_type: "hotel" },
});

// RoomType
RoomType.belongsTo(Hotel, { foreignKey: "hotel_id" });
RoomType.hasMany(Room, { foreignKey: "room_type_id" });
RoomType.belongsToMany(Amenity, {
  through: RoomTypeAmenity,
  foreignKey: "room_type_id",
});
RoomType.hasMany(Image, {
  foreignKey: "entity_id",
  constraints: false,
  scope: { entity_type: "room_type" },
});

// Room
Room.belongsTo(Hotel, { foreignKey: "hotel_id" });
Room.belongsTo(RoomType, { foreignKey: "room_type_id" });
Room.hasMany(Booking, { foreignKey: "room_id" });

// Booking
Booking.belongsTo(User, { foreignKey: "user_id" });
Booking.belongsTo(Hotel, { foreignKey: "hotel_id" });
Booking.belongsTo(Room, { foreignKey: "room_id" });
Booking.belongsTo(RoomType, { foreignKey: "room_type_id" });
Booking.hasMany(Payment, { foreignKey: "booking_id" });
Booking.hasOne(Review, { foreignKey: "booking_id" });

// Payment
Payment.belongsTo(Booking, { foreignKey: "booking_id" });
Payment.belongsTo(User, { foreignKey: "user_id" });

// Review
Review.belongsTo(Booking, { foreignKey: "booking_id" });
Review.belongsTo(User, { foreignKey: "user_id" });
Review.belongsTo(Hotel, { foreignKey: "hotel_id" });

// Export everything
module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  RefreshToken,
  Hotel,
  Amenity,
  HotelAmenity,
  RoomType,
  RoomTypeAmenity,
  Room,
  Booking,
  Payment,
  Review,
  Image,
};
