'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('sale_items');

    if (!table.client_garment_id) {
      await queryInterface.addColumn('sale_items', 'client_garment_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'client_garments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!table.measurement_id) {
      await queryInterface.addColumn('sale_items', 'measurement_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'garment_measurements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!table.garment_snapshot) {
      await queryInterface.addColumn('sale_items', 'garment_snapshot', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }

    if (!table.measurement_snapshot) {
      await queryInterface.addColumn('sale_items', 'measurement_snapshot', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }

    const indexes = await queryInterface.showIndex('sale_items');
    const indexNames = indexes.map(index => index.name);

    if (!indexNames.includes('idx_sale_items_client_garment_id')) {
      await queryInterface.addIndex('sale_items', ['client_garment_id'], {
        name: 'idx_sale_items_client_garment_id'
      });
    }

    if (!indexNames.includes('idx_sale_items_measurement_id')) {
      await queryInterface.addIndex('sale_items', ['measurement_id'], {
        name: 'idx_sale_items_measurement_id'
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('sale_items');
    const indexNames = indexes.map(index => index.name);

    if (indexNames.includes('idx_sale_items_measurement_id')) {
      await queryInterface.removeIndex('sale_items', 'idx_sale_items_measurement_id');
    }

    if (indexNames.includes('idx_sale_items_client_garment_id')) {
      await queryInterface.removeIndex('sale_items', 'idx_sale_items_client_garment_id');
    }

    const table = await queryInterface.describeTable('sale_items');

    if (table.measurement_snapshot) {
      await queryInterface.removeColumn('sale_items', 'measurement_snapshot');
    }

    if (table.garment_snapshot) {
      await queryInterface.removeColumn('sale_items', 'garment_snapshot');
    }

    if (table.measurement_id) {
      await queryInterface.removeColumn('sale_items', 'measurement_id');
    }

    if (table.client_garment_id) {
      await queryInterface.removeColumn('sale_items', 'client_garment_id');
    }
  }
};