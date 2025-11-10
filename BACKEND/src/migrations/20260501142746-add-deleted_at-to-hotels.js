"use strict";

/** @type {import('sequelize-cli').Migration} */
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("hotels", "deleted_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("hotels", "deleted_at");
  },
};
