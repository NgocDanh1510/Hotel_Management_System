module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      booking_id: {
        type: Sequelize.UUID,
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
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      gateway: {
        type: Sequelize.ENUM('vnpay', 'momo', 'stripe'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      type: {
        type: Sequelize.ENUM('full_payment', 'deposit', 'refund'),
        defaultValue: 'full_payment'
      },
      transaction_id: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: true
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      note: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('payments', ['booking_id']);
    await queryInterface.addIndex('payments', ['user_id']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['transaction_id']);
    await queryInterface.addIndex('payments', ['paid_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};
