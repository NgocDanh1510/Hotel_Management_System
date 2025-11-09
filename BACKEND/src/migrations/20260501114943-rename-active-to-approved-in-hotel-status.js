"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Update data cũ
    await queryInterface.sequelize.query(`
      UPDATE hotels
      SET status = 'approved'
      WHERE status = 'active'
    `);

    // 2. Đổi ENUM
    await queryInterface.changeColumn("hotels", "status", {
      type: Sequelize.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    });
  },

  async down(queryInterface, Sequelize) {
    // rollback

    await queryInterface.sequelize.query(`
      UPDATE hotels
      SET status = 'active'
      WHERE status = 'approved'
    `);

    await queryInterface.changeColumn("hotels", "status", {
      type: Sequelize.ENUM("pending", "active", "rejected"),
      defaultValue: "pending",
    });
  },
};
