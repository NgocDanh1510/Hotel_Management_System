const { sequelize } = require('../config/db');

// Import models
const User = require('./user.model');
const Hotel = require('./hotel.model');
const RoomType = require('./room_type.model');
const Room = require('./room.model');
const Booking = require('./booking.model');
const Payment = require('./payment.model');
const Review = require('./review.model');
const Amenity = require('./amenity.model');
const Image = require('./image.model');

// Define Relationships

// 1. User (1) - Hotel (N)
User.hasMany(Hotel, { foreignKey: 'owner_id', as: 'hotels' });
Hotel.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// 2. Hotel (1) - RoomType (N)
Hotel.hasMany(RoomType, { foreignKey: 'hotel_id', as: 'room_types' });
RoomType.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

// 3. RoomType (1) - Room (N)
RoomType.hasMany(Room, { foreignKey: 'room_type_id', as: 'rooms' });
Room.belongsTo(RoomType, { foreignKey: 'room_type_id', as: 'room_type' });

// 4. Hotel (1) - Room (N) (Shortcut query)
Hotel.hasMany(Room, { foreignKey: 'hotel_id', as: 'rooms' });
Room.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

// 5. User (1) - Booking (N)
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 6. Room (1) - Booking (N)
Room.hasMany(Booking, { foreignKey: 'room_id', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

// 7. Booking (1) - Payment (N)
Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// 8. Booking (1) - Review (0..1)
Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// User (1) - Review (N)
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Hotel (1) - Review (N)
Hotel.hasMany(Review, { foreignKey: 'hotel_id', as: 'reviews' });
Review.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

// 9. Hotel (N) - Amenity (N)
Hotel.belongsToMany(Amenity, { 
  through: 'hotel_amenities', 
  foreignKey: 'hotel_id', 
  otherKey: 'amenity_id',
  timestamps: false,
  as: 'amenities'
});
Amenity.belongsToMany(Hotel, { 
  through: 'hotel_amenities', 
  foreignKey: 'amenity_id', 
  otherKey: 'hotel_id',
  timestamps: false,
  as: 'hotels'
});

// 10. RoomType (N) - Amenity (N)
RoomType.belongsToMany(Amenity, { 
  through: 'room_type_amenities', 
  foreignKey: 'room_type_id', 
  otherKey: 'amenity_id',
  timestamps: false,
  as: 'amenities'
});
Amenity.belongsToMany(RoomType, { 
  through: 'room_type_amenities', 
  foreignKey: 'amenity_id', 
  otherKey: 'room_type_id',
  timestamps: false,
  as: 'room_types'
});

// 11. Polymorphic Associations (Images)
Hotel.hasMany(Image, {
  foreignKey: 'entity_id',
  constraints: false,
  scope: {
    entity_type: 'hotel'
  },
  as: 'images'
});

RoomType.hasMany(Image, {
  foreignKey: 'entity_id',
  constraints: false,
  scope: {
    entity_type: 'room_type'
  },
  as: 'images'
});

Image.belongsTo(Hotel, { foreignKey: 'entity_id', constraints: false });
Image.belongsTo(RoomType, { foreignKey: 'entity_id', constraints: false });

module.exports = {
  sequelize,
  User,
  Hotel,
  RoomType,
  Room,
  Booking,
  Payment,
  Review,
  Amenity,
  Image,
};
