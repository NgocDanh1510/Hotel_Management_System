'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const slugify = require('slugify');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Clean up existing data to start fresh (Optional, but recommended for "clean data")
    console.log('Cleaning up existing data...');
    await queryInterface.bulkDelete('reviews', null, {});
    await queryInterface.bulkDelete('images', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('room_type_amenities', null, {});
    await queryInterface.bulkDelete('room_types', null, {});
    await queryInterface.bulkDelete('hotel_amenities', null, {});
    await queryInterface.bulkDelete('hotels', null, {});
    await queryInterface.bulkDelete('amenities', null, {});
    
    // Clean up fake users
    const [fakeUsers] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email LIKE '%@example.com';`
    );
    const fakeUserIds = fakeUsers.map(u => u.id);
    if (fakeUserIds.length > 0) {
      await queryInterface.bulkDelete('user_roles', { user_id: fakeUserIds }, {});
      await queryInterface.bulkDelete('users', { id: fakeUserIds }, {});
    }
    console.log('Cleanup done.');

    // 2. Get roles
    console.log('Fetching roles...');
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name IN ('admin', 'hotel_staff', 'guest');`
    );
    const adminRole = roles.find(r => r.name === 'admin');
    const partnerRole = roles.find(r => r.name === 'hotel_staff');
    const guestRole = roles.find(r => r.name === 'guest');
    console.log(`Roles found: Admin(${!!adminRole}), Partner(${!!partnerRole}), Guest(${!!guestRole})`);

    // 3. Get districts for mapping
    console.log('Fetching districts...');
    const [districts] = await queryInterface.sequelize.query(
      `SELECT d.id, d.name, c.name as city_name FROM districts d JOIN cities c ON d.city_id = c.id;`
    );
    console.log(`Found ${districts.length} districts.`);

    const getDistrictId = (cityName, districtName) => {
      const d = districts.find(d => d.city_name === cityName && d.name === districtName);
      return d ? d.id : districts[0].id;
    };

    // 4. Create Amenities
    console.log('Creating amenities...');
    const amenityData = [
      { name: 'Free WiFi', icon: 'wifi' },
      { name: 'Swimming Pool', icon: 'pool' },
      { name: 'Spa & Massage', icon: 'spa' },
      { name: 'Fitness Center', icon: 'fitness' },
      { name: 'Restaurant', icon: 'restaurant' },
      { name: 'Bar', icon: 'bar' },
      { name: 'Parking', icon: 'parking' },
      { name: '24-hour Front Desk', icon: 'reception' },
      { name: 'Air Conditioning', icon: 'ac' },
      { name: 'Breakfast Included', icon: 'breakfast' },
      { name: 'Airport Shuttle', icon: 'shuttle' },
      { name: 'Bathtub', icon: 'bathtub' },
    ];

    const amenities = amenityData.map(a => ({
      id: uuidv4(),
      name: a.name,
      icon: a.icon,
      created_at: now,
      updated_at: now
    }));
    await queryInterface.bulkInsert('amenities', amenities, {});
    console.log('Amenities created.');

    // 5. Create Partners (Owners)
    console.log('Creating partners...');
    const partners = [
      { id: uuidv4(), name: 'Nguyen Van A', email: 'partner.a@example.com' },
      { id: uuidv4(), name: 'Tran Thi B', email: 'partner.b@example.com' },
      { id: uuidv4(), name: 'Le Van C', email: 'partner.c@example.com' },
    ].map(u => ({
      ...u,
      password_hash: passwordHash,
      phone: '090000000' + Math.floor(Math.random() * 10),
      is_active: true,
      created_at: now,
      updated_at: now
    }));
    await queryInterface.bulkInsert('users', partners, {});

    const partnerRoles = partners.map(p => ({
      user_id: p.id,
      role_id: partnerRole.id,
      created_at: now
    }));
    await queryInterface.bulkInsert('user_roles', partnerRoles, {});

    // 6. Create Hotels with Images
    const hotelDefinitions = [
      {
        name: 'InterContinental Danang Sun Peninsula Resort',
        city: 'Đà Nẵng',
        district: 'Sơn Trà',
        address: 'Thọ Quang, Sơn Trà',
        star_rating: 5,
        description: 'Enjoy the best of Vietnam’s iconic architecture and warm hospitality at this award-winning luxury resort.',
        image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1000&auto=format&fit=crop',
        owner_index: 0
      },
      {
        name: 'The Reverie Saigon',
        city: 'Hồ Chí Minh',
        district: 'Quận 1',
        address: '22-36 Nguyen Hue Boulevard',
        star_rating: 5,
        description: 'A member of The Leading Hotels of the World, The Reverie Saigon is the most dazzling hotel in Ho Chi Minh City.',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000&auto=format&fit=crop',
        owner_index: 1
      },
      {
        name: 'Sofitel Legend Metropole Hanoi',
        city: 'Hà Nội',
        district: 'Hoàn Kiếm',
        address: '15 Ngo Quyen Street',
        star_rating: 5,
        description: 'A historic luxury landmark since 1901, Sofitel Legend Metropole Hanoi offers elegant colonial style.',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
        owner_index: 2
      },
      {
        name: 'Muong Thanh Luxury Can Tho',
        city: 'Cần Thơ',
        district: 'Ninh Kiều',
        address: 'Area E1, Cai Khe River Islet',
        star_rating: 4,
        description: 'The first five-star hotel in the Mekong Delta, offering views of the Hau River and the Can Tho Bridge.',
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop',
        owner_index: 0
      },
      {
        name: 'Hilton Da Nang',
        city: 'Đà Nẵng',
        district: 'Hải Châu',
        address: '50 Bach Dang Street',
        star_rating: 4.5,
        description: 'Located on the Han River, Hilton Da Nang is close to the Dragon Bridge and local markets.',
        image: 'https://images.unsplash.com/photo-1551882547-ff43c61f3c33?q=80&w=1000&auto=format&fit=crop',
        owner_index: 1
      },
      {
        name: 'Park Hyatt Saigon',
        city: 'Hồ Chí Minh',
        district: 'Quận 1',
        address: '2 Lam Son Square',
        star_rating: 5,
        description: 'A French colonial-style hotel in the heart of Ho Chi Minh City, overlooking the Opera House.',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000&auto=format&fit=crop',
        owner_index: 2
      }
    ];

    const hotels = hotelDefinitions.map(hd => ({
      id: uuidv4(),
      owner_id: partners[hd.owner_index].id,
      name: hd.name,
      slug: slugify(hd.name, { lower: true }),
      description: hd.description,
      address: hd.address,
      district_id: getDistrictId(hd.city, hd.district),
      star_rating: hd.star_rating,
      contact_email: `contact@${slugify(hd.name, { lower: true })}.com`,
      contact_phone: '028' + Math.floor(10000000 + Math.random() * 90000000),
      is_active: true,
      status: 'approved',
      avg_rating: 4 + Math.random(),
      review_count: Math.floor(Math.random() * 200),
      created_at: now,
      updated_at: now
    }));
    await queryInterface.bulkInsert('hotels', hotels, {});
    console.log('Hotels created.');

    // 7. Hotel Images
    console.log('Creating hotel images...');
    const hotelImages = hotels.map((h, i) => ({
      id: uuidv4(),
      entity_type: 'hotel',
      entity_id: h.id,
      url: hotelDefinitions[i].image,
      public_id: 'fake_public_id_' + i,
      sort_order: 0,
      is_primary: true,
      created_at: now,
      updated_at: now
    }));
    await queryInterface.bulkInsert('images', hotelImages, {});

    // 8. Hotel Amenities (Randomly assign 5-8 amenities per hotel)
    const hotelAmenities = [];
    hotels.forEach(h => {
      const shuffled = [...amenities].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 5 + Math.floor(Math.random() * 4));
      selected.forEach(a => {
        hotelAmenities.push({
          hotel_id: h.id,
          amenity_id: a.id,
          created_at: now
        });
      });
    });
    await queryInterface.bulkInsert('hotel_amenities', hotelAmenities, {});

    // 9. Room Types
    const roomTypeDefinitions = [
      { name: 'Deluxe Suite', price: 2500000, occupancy: 2, beds: '1 King Bed', size: 45, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Executive Room', price: 1800000, occupancy: 2, beds: '2 Twin Beds', size: 35, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Family Studio', price: 3500000, occupancy: 4, beds: '2 Queen Beds', size: 60, image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Penthouse', price: 12000000, occupancy: 6, beds: '3 King Beds', size: 150, image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=1000&auto=format&fit=crop' }
    ];

    const roomTypes = [];
    const roomTypeImages = [];

    hotels.forEach(h => {
      // Each hotel gets 2-3 room types
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const rtd = roomTypeDefinitions[i];
        const rtId = uuidv4();
        roomTypes.push({
          id: rtId,
          hotel_id: h.id,
          name: rtd.name,
          description: `A beautiful and spacious ${rtd.name.toLowerCase()} designed for maximum comfort.`,
          base_price: rtd.price,
          currency: 'VND',
          max_occupancy: rtd.occupancy,
          total_rooms: 5 + Math.floor(Math.random() * 10),
          bed_type: rtd.beds,
          size_sqm: rtd.size,
          created_at: now,
          updated_at: now
        });

        roomTypeImages.push({
          id: uuidv4(),
          entity_type: 'room_type',
          entity_id: rtId,
          url: rtd.image,
          public_id: 'fake_room_public_id_' + uuidv4(),
          sort_order: 0,
          is_primary: true,
          created_at: now,
          updated_at: now
        });
      }
    });
    await queryInterface.bulkInsert('room_types', roomTypes, {});
    await queryInterface.bulkInsert('images', roomTypeImages, {});
    console.log('Room types and images created.');

    // 10. Rooms (Create 3 actual room instances for each room type)
    console.log('Creating room instances...');
    const rooms = [];
    hotels.forEach(h => {
      let roomCounter = 1;
      const hotelRoomTypes = roomTypes.filter(rt => rt.hotel_id === h.id);
      hotelRoomTypes.forEach(rt => {
        for (let i = 1; i <= 3; i++) {
          rooms.push({
            id: uuidv4(),
            hotel_id: h.id,
            room_type_id: rt.id,
            room_number: `${100 * i + roomCounter}`,
            floor: i,
            status: 'available',
            created_at: now,
            updated_at: now
          });
        }
        roomCounter++;
      });
    });
    await queryInterface.bulkInsert('rooms', rooms, {});
    console.log('Room instances created.');

    // 11. Fake Reviews
    console.log('Creating reviews...');
    const reviewers = [
      { id: uuidv4(), name: 'John Doe', email: 'john@example.com' },
      { id: uuidv4(), name: 'Maria Garcia', email: 'maria@example.com' },
      { id: uuidv4(), name: 'Alex Wong', email: 'alex@example.com' },
    ].map(u => ({
      ...u,
      password_hash: passwordHash,
      phone: '091' + Math.floor(10000000 + Math.random() * 90000000),
      is_active: true,
      created_at: now,
      updated_at: now
    }));
    await queryInterface.bulkInsert('users', reviewers, {});

    const reviewerRoles = reviewers.map(r => ({
      user_id: r.id,
      role_id: guestRole.id,
      created_at: now
    }));
    await queryInterface.bulkInsert('user_roles', reviewerRoles, {});

    const comments = [
      'Amazing experience, the view was breathtaking!',
      'Great service and very friendly staff. Will come back.',
      'The room was clean and spacious. Highly recommend.',
      'A bit expensive but worth every penny.',
      'The swimming pool was fantastic.',
      'Good location, close to everything.'
    ];

    const reviews = [];
    hotels.forEach(h => {
      reviewers.forEach(r => {
        if (Math.random() > 0.3) { // 70% chance to have a review
          reviews.push({
            id: uuidv4(),
            user_id: r.id,
            hotel_id: h.id,
            rating_overall: 4 + Math.floor(Math.random() * 2), // 4 or 5
            rating_cleanliness: 4 + Math.floor(Math.random() * 2),
            rating_service: 4 + Math.floor(Math.random() * 2),
            rating_location: 4 + Math.floor(Math.random() * 2),
            comment: comments[Math.floor(Math.random() * comments.length)],
            is_published: true,
            created_at: now,
            updated_at: now
          });
        }
      });
    });
    await queryInterface.bulkInsert('reviews', reviews, {});

    console.log('Seeding completed successfully!');
  },

  async down(queryInterface, Sequelize) {
    // Reverse seeding
    await queryInterface.bulkDelete('reviews', null, {});
    await queryInterface.bulkDelete('images', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('room_type_amenities', null, {});
    await queryInterface.bulkDelete('room_types', null, {});
    await queryInterface.bulkDelete('hotel_amenities', null, {});
    await queryInterface.bulkDelete('hotels', null, {});
    await queryInterface.bulkDelete('amenities', null, {});
    
    const [fakeUsers] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email LIKE '%@example.com';`
    );
    const fakeUserIds = fakeUsers.map(u => u.id);
    if (fakeUserIds.length > 0) {
      await queryInterface.bulkDelete('user_roles', { user_id: fakeUserIds }, {});
      await queryInterface.bulkDelete('users', { id: fakeUserIds }, {});
    }
  }
};
