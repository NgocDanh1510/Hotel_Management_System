module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("partner_wallet_transactions", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
      partner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "bookings",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      payment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "payments",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      withdrawal_request_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "withdrawal_requests",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      type: {
        type: Sequelize.ENUM(
          "pending_credit",
          "release_available",
          "refund_reversal",
          "withdrawal_hold",
          "withdrawal_paid",
          "withdrawal_rejected",
        ),
        allowNull: false,
      },
      balance_type: {
        type: Sequelize.ENUM("pending", "available", "withdrawal_pending"),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      gross_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      commission_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      idempotency_key: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      note: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex("partner_wallet_transactions", ["wallet_id"]);
    await queryInterface.addIndex("partner_wallet_transactions", ["partner_id"]);
    await queryInterface.addIndex("partner_wallet_transactions", ["booking_id"]);
    await queryInterface.addIndex("partner_wallet_transactions", ["payment_id"]);
    await queryInterface.addIndex("partner_wallet_transactions", ["type"]);
    await queryInterface.addIndex("partner_wallet_transactions", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("partner_wallet_transactions");
  },
};
