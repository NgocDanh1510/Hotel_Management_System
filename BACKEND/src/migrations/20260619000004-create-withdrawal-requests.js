module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("withdrawal_requests", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      partner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      wallet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "partner_wallets",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      bank_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      bank_account_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      bank_account_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      bank_bin: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("pending", "paid", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      admin_note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      transfer_reference: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("withdrawal_requests", ["partner_id"]);
    await queryInterface.addIndex("withdrawal_requests", ["wallet_id"]);
    await queryInterface.addIndex("withdrawal_requests", ["status"]);
    await queryInterface.addIndex("withdrawal_requests", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("withdrawal_requests");
  },
};
