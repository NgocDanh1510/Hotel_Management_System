module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      hotel_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'hotels',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      room_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'rooms',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      room_type_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'room_types',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      check_in: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      check_out: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      guests_count: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'cancellation_pending'),
        defaultValue: 'pending'
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      price_per_night: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      special_requests: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('bookings', ['user_id']);
    await queryInterface.addIndex('bookings', ['hotel_id']);
    await queryInterface.addIndex('bookings', ['status']);
    await queryInterface.addIndex('bookings', ['check_in']);
    await queryInterface.addIndex('bookings', ['check_out']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bookings');
  }
};
