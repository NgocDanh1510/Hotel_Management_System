"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE bookings
      MODIFY COLUMN status ENUM(
        'pending',
        'confirmed',
        'checked_in',
        'checked_out',
        'cancelled',
        'cancellation_pending',
        'no_show'
      ) NOT NULL DEFAULT 'pending';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE bookings
      SET status = 'cancelled'
      WHERE status = 'no_show';
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE bookings
      MODIFY COLUMN status ENUM(
        'pending',
        'confirmed',
        'checked_in',
        'checked_out',
        'cancelled',
        'cancellation_pending'
      ) NOT NULL DEFAULT 'pending';
    `);
  },
};
