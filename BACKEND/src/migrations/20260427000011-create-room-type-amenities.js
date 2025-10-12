module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('room_type_amenities', {
      room_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'room_types',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      amenity_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'amenities',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('room_type_amenities');
  }
};
