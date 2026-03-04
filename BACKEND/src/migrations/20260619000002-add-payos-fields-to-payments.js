module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("payments", "gateway", {
      type: Sequelize.ENUM("vnpay", "momo", "stripe", "payos"),
      allowNull: false,
    });

    await queryInterface.addColumn("payments", "payos_order_code", {
      type: Sequelize.BIGINT,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn("payments", "payos_payment_link_id", {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn("payments", "payos_checkout_url", {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn("payments", "payos_qr_code", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("payments", "expires_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex("payments", ["payos_order_code"]);
    await queryInterface.addIndex("payments", ["payos_payment_link_id"]);
    await queryInterface.addIndex("payments", ["expires_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("payments", ["expires_at"]);
    await queryInterface.removeIndex("payments", ["payos_payment_link_id"]);
    await queryInterface.removeIndex("payments", ["payos_order_code"]);

    await queryInterface.removeColumn("payments", "expires_at");
    await queryInterface.removeColumn("payments", "payos_qr_code");
    await queryInterface.removeColumn("payments", "payos_checkout_url");
    await queryInterface.removeColumn("payments", "payos_payment_link_id");
    await queryInterface.removeColumn("payments", "payos_order_code");

    await queryInterface.changeColumn("payments", "gateway", {
      type: Sequelize.ENUM("vnpay", "momo", "stripe"),
      allowNull: false,
    });
  },
};
