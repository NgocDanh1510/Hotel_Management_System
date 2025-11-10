"use strict";

/** @type {import('sequelize-cli').Migration} */
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("districts", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      code: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      city_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "cities",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("districts");
  },
};
