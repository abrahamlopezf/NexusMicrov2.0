'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('sale_material_requirements');

    const addColumnIfMissing = async (name, definition) => {
      if (!table[name]) {
        await queryInterface.addColumn('sale_material_requirements', name, definition);
      }
    };

    await addColumnIfMissing('consumed_quantity', {
      type: Sequelize.DECIMAL(12, 4),
      allowNull: true
    });

    await addColumnIfMissing('consumed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await addColumnIfMissing('consumed_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await addColumnIfMissing('consumption_metadata', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('sale_material_requirements', 'consumption_metadata');
    await queryInterface.removeColumn('sale_material_requirements', 'consumed_by');
    await queryInterface.removeColumn('sale_material_requirements', 'consumed_at');
    await queryInterface.removeColumn('sale_material_requirements', 'consumed_quantity');
  }
};