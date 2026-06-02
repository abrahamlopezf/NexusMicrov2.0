'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Cambiar el tipo de columna
    await queryInterface.changeColumn('payments', 'account_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // 2. Agregar foreign key
    await queryInterface.addConstraint('payments', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'payments_account_id_fkey',
      references: {
        table: 'accounts',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface) {
    // Eliminar constraint
    await queryInterface.removeConstraint(
      'payments',
      'payments_account_id_fkey'
    );
  }
};