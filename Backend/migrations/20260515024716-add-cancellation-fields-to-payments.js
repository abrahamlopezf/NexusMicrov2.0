'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payments', 'cancelled_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('payments', 'cancellation_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addIndex('payments', ['cancelled_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('payments', ['cancelled_at']);
    await queryInterface.removeColumn('payments', 'cancellation_reason');
    await queryInterface.removeColumn('payments', 'cancelled_at');
  }
};