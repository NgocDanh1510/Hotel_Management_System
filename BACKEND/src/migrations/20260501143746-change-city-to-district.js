"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("hotels", "city");
    await queryInterface.removeColumn("hotels", "country");

    await queryInterface.addColumn("hotels", "district_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "districts",
        key: "id",
      },
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("hotels", ["district_id"]);
  },

  async down(queryInterface, Sequelize) {
    // rollback: xoá district_id
    await queryInterface.removeColumn("hotels", "district_id");

    // add lại city như cũ
    await queryInterface.addColumn("hotels", "city", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("hotels", "country", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addIndex("hotels", ["city"]);
  },
};
