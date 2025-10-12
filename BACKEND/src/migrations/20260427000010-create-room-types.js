module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('room_types', {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      base_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'VND'
      },
      max_occupancy: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      total_rooms: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      bed_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      size_sqm: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true
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

    await queryInterface.addIndex('room_types', ['hotel_id', 'name'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('room_types');
  }
};
