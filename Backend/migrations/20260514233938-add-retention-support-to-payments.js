'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('payments', 'status', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'COMPLETED'
    });

    await queryInterface.addColumn('payments', 'affects_balance', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('payments', 'affects_cash', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('payments', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('sales', 'retained_amount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('payments', ['status']);
    await queryInterface.removeIndex('payments', ['type']);

    await queryInterface.removeColumn('sales', 'retained_amount');
    await queryInterface.removeColumn('payments', 'metadata');
    await queryInterface.removeColumn('payments', 'affects_cash');
    await queryInterface.removeColumn('payments', 'affects_balance');
    await queryInterface.removeColumn('payments', 'status');
  }
};