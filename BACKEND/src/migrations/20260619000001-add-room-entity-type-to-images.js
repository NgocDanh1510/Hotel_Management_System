module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("images", "entity_type", {
      type: Sequelize.ENUM("hotel", "room_type", "room"),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("images", "entity_type", {
      type: Sequelize.ENUM("hotel", "room_type"),
      allowNull: false,
    });
  },
};
