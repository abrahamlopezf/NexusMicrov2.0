'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('materials', 'reserved_stock', {
        type: Sequelize.DECIMAL(12, 4),
        defaultValue: 0,
        allowNull: false
      });
    } catch (error) {
      console.log('La columna reserved_stock ya existe, omitiendo...');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('materials', 'reserved_stock');
  }
};
