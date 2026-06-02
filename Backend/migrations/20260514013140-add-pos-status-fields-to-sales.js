'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    // ═════════════════════════════════════════════════════════════
    // FINANCIAL STATUS
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addColumn('sales', 'financial_status', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'PENDING'
    });

    // ═════════════════════════════════════════════════════════════
    // PRODUCTION STATUS
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addColumn('sales', 'production_status', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'PENDING'
    });

    // ═════════════════════════════════════════════════════════════
    // DELIVERY STATUS
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addColumn('sales', 'delivery_status', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'PENDING'
    });

    // ═════════════════════════════════════════════════════════════
    // FULFILLMENT STATUS
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addColumn('sales', 'fulfillment_status', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'QUEUED'
    });

    // ═════════════════════════════════════════════════════════════
    // INDEXES
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addIndex('sales', ['financial_status']);
    await queryInterface.addIndex('sales', ['production_status']);
    await queryInterface.addIndex('sales', ['delivery_status']);
    await queryInterface.addIndex('sales', ['fulfillment_status']);
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeIndex('sales', ['financial_status']);
    await queryInterface.removeIndex('sales', ['production_status']);
    await queryInterface.removeIndex('sales', ['delivery_status']);
    await queryInterface.removeIndex('sales', ['fulfillment_status']);

    await queryInterface.removeColumn('sales', 'financial_status');
    await queryInterface.removeColumn('sales', 'production_status');
    await queryInterface.removeColumn('sales', 'delivery_status');
    await queryInterface.removeColumn('sales', 'fulfillment_status');
  }
};