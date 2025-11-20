'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Create Cities
    const hcmCityId = uuidv4();
    const hnCityId = uuidv4();
    const dnCityId = uuidv4();
    const ctCityId = uuidv4();

    const cities = [
      {
        id: hcmCityId,
        code: 'HCM',
        name: 'Hồ Chí Minh',
        created_at: now,
        updated_at: now,
      },
      {
        id: hnCityId,
        code: 'HN',
        name: 'Hà Nội',
        created_at: now,
        updated_at: now,
      },
      {
        id: dnCityId,
        code: 'DN',
        name: 'Đà Nẵng',
        created_at: now,
        updated_at: now,
      },
      {
        id: ctCityId,
        code: 'CT',
        name: 'Cần Thơ',
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('cities', cities, {});

    // 2. Create Districts
    const districts = [
      // Ho Chi Minh City
      { id: uuidv4(), city_id: hcmCityId, code: 'HCM-Q1', name: 'Quận 1', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: hcmCityId, code: 'HCM-Q2', name: 'Quận 2', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: hcmCityId, code: 'HCM-Q3', name: 'Quận 3', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: hcmCityId, code: 'HCM-Q7', name: 'Quận 7', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: hcmCityId, code: 'HCM-TB', name: 'Tân Bình', created_at: now, updated_at: now },
      
      // Ha Noi
      { id: uuidv4(), city_id: hnCityId, code: 'HN-HK', name: 'Hoàn Kiếm', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: hnCityId, code: 'HN-DD', name: 'Đống Đa', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: hnCityId, code: 'HN-BD', name: 'Ba Đình', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: hnCityId, code: 'HN-CG', name: 'Cầu Giấy', created_at: now, updated_at: now },
      
      // Da Nang
      { id: uuidv4(), city_id: dnCityId, code: 'DN-HC', name: 'Hải Châu', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: dnCityId, code: 'DN-ST', name: 'Sơn Trà', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: dnCityId, code: 'DN-NHS', name: 'Ngũ Hành Sơn', created_at: now, updated_at: now },

      // Can Tho
      { id: uuidv4(), city_id: ctCityId, code: 'CT-NK', name: 'Ninh Kiều', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: ctCityId, code: 'CT-CR', name: 'Cái Răng', created_at: now, updated_at: now },
      { id: uuidv4(), city_id: ctCityId, code: 'CT-BT', name: 'Bình Thủy', created_at: now, updated_at: now },
    ];

    await queryInterface.bulkInsert('districts', districts, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('districts', null, {});
    await queryInterface.bulkDelete('cities', null, {});
  }
};
