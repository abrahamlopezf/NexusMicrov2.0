'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    // ═════════════════════════════════════════════════════════════
    // ADD sale_item_id
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addColumn('work_orders', 'sale_item_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'sale_items',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // ═════════════════════════════════════════════════════════════
    // INDEX
    // ═════════════════════════════════════════════════════════════
    await queryInterface.addIndex('work_orders', ['sale_item_id']);
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeIndex('work_orders', ['sale_item_id']);

    await queryInterface.removeColumn('work_orders', 'sale_item_id');
  }
};