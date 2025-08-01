module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hotels', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(220),
        unique: true,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      star_rating: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true
      },
      contact_email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      avg_rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0
      },
      review_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    await queryInterface.addIndex('hotels', ['slug'], { unique: true });
    await queryInterface.addIndex('hotels', ['city']);
    await queryInterface.addIndex('hotels', ['country']);
    await queryInterface.addIndex('hotels', ['owner_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('hotels');
  }
};
