'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('clients');

    if (table.loyalty_points) {
      await queryInterface.removeColumn('clients', 'loyalty_points');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('clients');

    if (!table.loyalty_points) {
      await queryInterface.addColumn('clients', 'loyalty_points', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
  }
};