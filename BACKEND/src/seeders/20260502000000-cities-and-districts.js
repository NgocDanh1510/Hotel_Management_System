'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Handle Cities
    // Get existing cities to avoid duplicates
    const [existingCities] = await queryInterface.sequelize.query(
      'SELECT id, code FROM cities'
    );
    const existingCityCodes = existingCities.map(c => c.code);
    const cityCodeToId = Object.fromEntries(existingCities.map(c => [c.code, c.id]));

    const cityData = [
      { code: 'HCM', name: 'Hồ Chí Minh' },
      { code: 'HN', name: 'Hà Nội' },
      { code: 'DN', name: 'Đà Nẵng' },
      { code: 'CT', name: 'Cần Thơ' },
    ];

    const citiesToInsert = [];
    for (const city of cityData) {
      if (!existingCityCodes.includes(city.code)) {
        const id = uuidv4();
        citiesToInsert.push({
          id,
          code: city.code,
          name: city.name,
          created_at: now,
          updated_at: now,
        });
        cityCodeToId[city.code] = id;
      }
    }

    if (citiesToInsert.length > 0) {
      await queryInterface.bulkInsert('cities', citiesToInsert, {});
    }

    // 2. Handle Districts
    // Get existing districts to avoid duplicates
    const [existingDistricts] = await queryInterface.sequelize.query(
      'SELECT code FROM districts'
    );
    const existingDistrictCodes = existingDistricts.map(d => d.code);

    const districtData = [
      // Ho Chi Minh City
      { cityCode: 'HCM', code: 'HCM-Q1', name: 'Quận 1' },
      { cityCode: 'HCM', code: 'HCM-Q2', name: 'Quận 2' },
      { cityCode: 'HCM', code: 'HCM-Q3', name: 'Quận 3' },
      { cityCode: 'HCM', code: 'HCM-Q7', name: 'Quận 7' },
      { cityCode: 'HCM', code: 'HCM-TB', name: 'Tân Bình' },
      
      // Ha Noi
      { cityCode: 'HN', code: 'HN-HK', name: 'Hoàn Kiếm' },
      { cityCode: 'HN', code: 'HN-DD', name: 'Đống Đa' },
      { cityCode: 'HN', code: 'HN-BD', name: 'Ba Đình' },
      { cityCode: 'HN', code: 'HN-CG', name: 'Cầu Giấy' },
      
      // Da Nang
      { cityCode: 'DN', code: 'DN-HC', name: 'Hải Châu' },
      { cityCode: 'DN', code: 'DN-ST', name: 'Sơn Trà' },
      { cityCode: 'DN', code: 'DN-NHS', name: 'Ngũ Hành Sơn' },

      // Can Tho
      { cityCode: 'CT', code: 'CT-NK', name: 'Ninh Kiều' },
      { cityCode: 'CT', code: 'CT-CR', name: 'Cái Răng' },
      { cityCode: 'CT', code: 'CT-BT', name: 'Bình Thủy' },
    ];

    const districtsToInsert = [];
    for (const district of districtData) {
      if (!existingDistrictCodes.includes(district.code)) {
        const cityId = cityCodeToId[district.cityCode];
        if (cityId) {
          districtsToInsert.push({
            id: uuidv4(),
            city_id: cityId,
            code: district.code,
            name: district.name,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    if (districtsToInsert.length > 0) {
      await queryInterface.bulkInsert('districts', districtsToInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    // In down, we might want to only delete what we inserted, but usually bulkDelete is fine for seeders
    // unless we have real data mixed in.
    await queryInterface.bulkDelete('districts', null, {});
    await queryInterface.bulkDelete('cities', null, {});
  }
};

