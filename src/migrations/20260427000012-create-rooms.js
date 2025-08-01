module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rooms', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      hotel_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'hotels',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      room_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'room_types',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      room_number: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      floor: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('available', 'occupied', 'maintenance'),
        defaultValue: 'available'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('rooms', ['hotel_id', 'room_number'], { unique: true });
    await queryInterface.addIndex('rooms', ['status']);
    await queryInterface.addIndex('rooms', ['room_type_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rooms');
  }
};
