'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('payments');

    if (!table.received_amount) {
      await queryInterface.addColumn('payments', 'received_amount', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      });
    }

    if (!table.change_amount) {
      await queryInterface.addColumn('payments', 'change_amount', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('payments');

    if (table.change_amount) {
      await queryInterface.removeColumn('payments', 'change_amount');
    }

    if (table.received_amount) {
      await queryInterface.removeColumn('payments', 'received_amount');
    }
  }
};