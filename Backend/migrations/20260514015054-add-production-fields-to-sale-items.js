'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {

  async up(queryInterface, Sequelize) {

    // ═════════════════════════════════════════════════════════════
    // GARMENT TYPE
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addColumn('sale_items', 'garment_type', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // ═════════════════════════════════════════════════════════════
    // PRODUCTION STATUS
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addColumn('sale_items', 'production_status', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'PENDING'
    });

    // ═════════════════════════════════════════════════════════════
    // DELIVERY STATUS
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addColumn('sale_items', 'delivery_status', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'PENDING'
    });

    // ═════════════════════════════════════════════════════════════
    // DELIVERY DATE
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addColumn('sale_items', 'delivered_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // ═════════════════════════════════════════════════════════════
    // INDEXES
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addIndex('sale_items', ['garment_type']);
    await queryInterface.addIndex('sale_items', ['production_status']);
    await queryInterface.addIndex('sale_items', ['delivery_status']);
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeIndex('sale_items', ['garment_type']);
    await queryInterface.removeIndex('sale_items', ['production_status']);
    await queryInterface.removeIndex('sale_items', ['delivery_status']);

    await queryInterface.removeColumn('sale_items', 'garment_type');
    await queryInterface.removeColumn('sale_items', 'production_status');
    await queryInterface.removeColumn('sale_items', 'delivery_status');
    await queryInterface.removeColumn('sale_items', 'delivered_at');
  }

};