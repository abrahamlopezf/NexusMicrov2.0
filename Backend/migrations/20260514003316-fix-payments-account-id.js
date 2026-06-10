'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Cambiar el tipo de columna
    try {
      await queryInterface.changeColumn('payments', 'account_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } catch (error) {
      console.log('La columna account_id no pudo ser modificada o ya está bien.');
    }
    // No agregamos constraint aquí porque ya existe y en PostgreSQL falla la transacción
  },

  async down(queryInterface) {
    // Eliminar constraint
    await queryInterface.removeConstraint(
      'payments',
      'payments_account_id_fkey'
    );
  }
};