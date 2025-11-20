'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Get roles and district
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('hotel_staff', 'guest');`
    );
    const staffRole = roles.find(r => r.name === 'hotel_staff');
    const guestRole = roles.find(r => r.name === 'guest');

    const [districts] = await queryInterface.sequelize.query(
      `SELECT id FROM districts LIMIT 1;`
    );
    const districtId = districts[0] ? districts[0].id : null;

    if (!districtId) {
      console.warn("No district found. Please run the cities and districts seeder first.");
      return;
    }

    // Cleanup first to avoid validation errors on rerun
    await queryInterface.bulkDelete('bookings', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('room_type_amenities', null, {});
    await queryInterface.bulkDelete('room_types', null, {});
    await queryInterface.bulkDelete('hotel_amenities', null, {});
    await queryInterface.bulkDelete('hotels', null, {});
    await queryInterface.bulkDelete('amenities', null, {});
    
    const [usersToDelete] = await queryInterface.sequelize.query(`SELECT id FROM users WHERE email IN ('manager@example.com', 'guest@example.com')`);
    const userIds = usersToDelete.map(u => u.id);
    if(userIds.length > 0) {
      await queryInterface.bulkDelete('user_roles', { user_id: userIds }, {});
      await queryInterface.bulkDelete('users', { id: userIds }, {});
    }

    // 2. Create Users
    const staffId = uuidv4();
    const guestId = uuidv4();

    const users = [
      {
        id: staffId,
        name: 'Hotel Manager',
        email: 'manager@example.com',
        password_hash: passwordHash,
        phone: '0901234567',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: guestId,
        name: 'Guest User',
        email: 'guest@example.com',
        password_hash: passwordHash,
        phone: '0987654321',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];
    await queryInterface.bulkInsert('users', users, {});

    // 3. User Roles
    if (staffRole && guestRole) {
      await queryInterface.bulkInsert('user_roles', [
        { user_id: staffId, role_id: staffRole.id, created_at: now },
        { user_id: guestId, role_id: guestRole.id, created_at: now }
      ], { ignoreDuplicates: true });
    }

    // 4. Create Amenities
    const amenity1 = uuidv4();
    const amenity2 = uuidv4();
    const amenity3 = uuidv4();
    const amenity4 = uuidv4();
    const amenity5 = uuidv4();

    const amenities = [
      { id: amenity1, name: 'Free WiFi', icon: 'wifi', created_at: now, updated_at: now },
      { id: amenity2, name: 'Swimming Pool', icon: 'pool', created_at: now, updated_at: now },
      { id: amenity3, name: 'Spa & Wellness', icon: 'spa', created_at: now, updated_at: now },
      { id: amenity4, name: 'Gym', icon: 'gym', created_at: now, updated_at: now },
      { id: amenity5, name: 'Breakfast Included', icon: 'breakfast', created_at: now, updated_at: now },
    ];
    await queryInterface.bulkInsert('amenities', amenities, {});

    // 5. Create Hotel
    const hotelId = uuidv4();
    const hotels = [
      {
        id: hotelId,
        owner_id: staffId,
        name: 'Grand Horizon Hotel',
        slug: 'grand-horizon-hotel',
        description: 'A luxurious 5-star hotel offering breathtaking city views, premium amenities, and world-class service.',
        address: '123 Main Street',
        district_id: districtId,
        star_rating: 5,
        contact_email: 'contact@grandhorizon.com',
        contact_phone: '0281234567',
        is_active: true,
        status: 'approved',
        avg_rating: 4.8,
        review_count: 120,
        created_at: now,
        updated_at: now
      }
    ];
    await queryInterface.bulkInsert('hotels', hotels, {});

    // 6. Hotel Amenities
    const hotelAmenities = [
      { hotel_id: hotelId, amenity_id: amenity1, created_at: now },
      { hotel_id: hotelId, amenity_id: amenity2, created_at: now },
      { hotel_id: hotelId, amenity_id: amenity3, created_at: now },
      { hotel_id: hotelId, amenity_id: amenity4, created_at: now },
    ];
    await queryInterface.bulkInsert('hotel_amenities', hotelAmenities, {});

    // 7. Create Room Types
    const roomType1 = uuidv4();
    const roomType2 = uuidv4();

    const roomTypes = [
      {
        id: roomType1,
        hotel_id: hotelId,
        name: 'Deluxe City View',
        description: 'Spacious deluxe room with stunning views of the city skyline.',
        base_price: 1500000,
        currency: 'VND',
        max_occupancy: 2,
        total_rooms: 5,
        bed_type: 'King Bed',
        size_sqm: 35,
        created_at: now,
        updated_at: now
      },
      {
        id: roomType2,
        hotel_id: hotelId,
        name: 'Executive Suite',
        description: 'Premium suite with a separate living area, perfect for luxury seekers.',
        base_price: 3000000,
        currency: 'VND',
        max_occupancy: 4,
        total_rooms: 2,
        bed_type: '2 Queen Beds',
        size_sqm: 60,
        created_at: now,
        updated_at: now
      }
    ];
    await queryInterface.bulkInsert('room_types', roomTypes, {});

    // 8. Room Type Amenities
    const rtAmenities = [
      { room_type_id: roomType1, amenity_id: amenity1, created_at: now },
      { room_type_id: roomType1, amenity_id: amenity5, created_at: now },
      { room_type_id: roomType2, amenity_id: amenity1, created_at: now },
      { room_type_id: roomType2, amenity_id: amenity5, created_at: now },
    ];
    await queryInterface.bulkInsert('room_type_amenities', rtAmenities, {});

    // 9. Create Rooms
    const roomId1 = uuidv4();
    const roomId2 = uuidv4();
    const roomId3 = uuidv4();

    const rooms = [
      { id: roomId1, hotel_id: hotelId, room_type_id: roomType1, room_number: '101', floor: 1, status: 'available', created_at: now, updated_at: now },
      { id: roomId2, hotel_id: hotelId, room_type_id: roomType1, room_number: '102', floor: 1, status: 'available', created_at: now, updated_at: now },
      { id: roomId3, hotel_id: hotelId, room_type_id: roomType2, room_number: '201', floor: 2, status: 'available', created_at: now, updated_at: now },
    ];
    await queryInterface.bulkInsert('rooms', rooms, {});

    // 10. Create Bookings
    const bookingId = uuidv4();
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 3);

    const bookings = [
      {
        id: bookingId,
        user_id: guestId,
        hotel_id: hotelId,
        room_id: roomId1,
        room_type_id: roomType1,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0],
        guests_count: 2,
        status: 'pending',
        total_price: 3000000,
        price_per_night: 1500000,
        special_requests: 'High floor if possible',
        created_at: now,
        updated_at: now
      }
    ];
    await queryInterface.bulkInsert('bookings', bookings, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('bookings', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('room_type_amenities', null, {});
    await queryInterface.bulkDelete('room_types', null, {});
    await queryInterface.bulkDelete('hotel_amenities', null, {});
    await queryInterface.bulkDelete('hotels', null, {});
    await queryInterface.bulkDelete('amenities', null, {});
    await queryInterface.bulkDelete('user_roles', null, {});
    // Don't delete all users, only delete by email if we want to be safe, but this is a seeder, maybe clean all.
    const [users] = await queryInterface.sequelize.query(`SELECT id FROM users WHERE email IN ('manager@example.com', 'guest@example.com')`);
    const userIds = users.map(u => u.id);
    if(userIds.length > 0) {
      await queryInterface.bulkDelete('users', { id: userIds }, {});
    }
  }
};
