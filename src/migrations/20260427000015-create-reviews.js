module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reviews', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      booking_id: {
        type: Sequelize.UUID,
        unique: true,
        allowNull: true,
        references: {
          model: 'bookings',
          key: 'id'
        },
        onDelete: 'SET NULL'
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
        onDelete: 'CASCADE'
      },
      rating_overall: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      rating_cleanliness: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rating_service: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rating_location: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addIndex('reviews', ['booking_id'], { unique: true });
    await queryInterface.addIndex('reviews', ['hotel_id']);
    await queryInterface.addIndex('reviews', ['user_id']);
    await queryInterface.addIndex('reviews', ['is_published']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reviews');
  }
};
