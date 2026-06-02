'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tablesRaw = await queryInterface.showAllTables();
    const tables = tablesRaw.map(t => typeof t === 'string' ? t : t.tableName);

    const lotsTable = await queryInterface.describeTable('material_lots');

    if (!lotsTable.lot_origin) {
      await queryInterface.addColumn('material_lots', 'lot_origin', {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: 'MANUAL'
      });
    }

    if (!lotsTable.origin_sale_id) {
      await queryInterface.addColumn('material_lots', 'origin_sale_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'sales',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!lotsTable.origin_sale_item_id) {
      await queryInterface.addColumn('material_lots', 'origin_sale_item_id', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'sale_items',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!lotsTable.origin_movement_id) {
      await queryInterface.addColumn('material_lots', 'origin_movement_id', {
        type: Sequelize.BIGINT,
        allowNull: true
      });
    }

    if (!tables.includes('sale_material_requirements')) {
      await queryInterface.createTable('sale_material_requirements', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },

        sale_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'sales',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },

        sale_item_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'sale_items',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },

        material_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'materials',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },

        material_lot_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'material_lots',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },

        source: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'MANUAL_EXTRA'
        },

        quantity_per_unit: {
          type: Sequelize.DECIMAL(12, 4),
          allowNull: true
        },

        item_quantity: {
          type: Sequelize.DECIMAL(12, 4),
          allowNull: true
        },

        estimated_quantity: {
          type: Sequelize.DECIMAL(12, 4),
          allowNull: false
        },

        margin_percentage: {
          type: Sequelize.DECIMAL(6, 2),
          allowNull: false,
          defaultValue: 0
        },

        planned_quantity: {
          type: Sequelize.DECIMAL(12, 4),
          allowNull: false
        },

        estimated_waste: {
          type: Sequelize.DECIMAL(12, 4),
          allowNull: false,
          defaultValue: 0
        },

        unit: {
          type: Sequelize.STRING(50),
          allowNull: true
        },

        status: {
          type: Sequelize.STRING(40),
          allowNull: false,
          defaultValue: 'PLANNED'
        },

        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },

        metadata: {
          type: Sequelize.JSONB,
          allowNull: true
        },

        created_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },

        updated_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },

        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },

        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },

        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      });

      await queryInterface.addIndex('sale_material_requirements', ['sale_id'], {
        name: 'idx_sale_material_requirements_sale_id'
      });

      await queryInterface.addIndex('sale_material_requirements', ['sale_item_id'], {
        name: 'idx_sale_material_requirements_sale_item_id'
      });

      await queryInterface.addIndex('sale_material_requirements', ['material_id'], {
        name: 'idx_sale_material_requirements_material_id'
      });

      await queryInterface.addIndex('sale_material_requirements', ['material_lot_id'], {
        name: 'idx_sale_material_requirements_material_lot_id'
      });

      await queryInterface.addIndex('sale_material_requirements', ['source'], {
        name: 'idx_sale_material_requirements_source'
      });

      await queryInterface.addIndex('sale_material_requirements', ['status'], {
        name: 'idx_sale_material_requirements_status'
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE material_lots ml
      SET lot_origin = 'REUSABLE'
      FROM inventory_movements im
      WHERE im.material_lot_id = ml.id
      AND im.type = 'ENTRADA_REUTILIZABLE';
    `);

    await queryInterface.sequelize.query(`
      UPDATE material_lots ml
      SET lot_origin = 'PURCHASE'
      FROM inventory_movements im
      WHERE im.material_lot_id = ml.id
      AND im.type = 'ENTRADA_COMPRA'
      AND ml.lot_origin = 'MANUAL';
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sale_material_requirements');

    const lotsTable = await queryInterface.describeTable('material_lots');

    if (lotsTable.origin_movement_id) {
      await queryInterface.removeColumn('material_lots', 'origin_movement_id');
    }

    if (lotsTable.origin_sale_item_id) {
      await queryInterface.removeColumn('material_lots', 'origin_sale_item_id');
    }

    if (lotsTable.origin_sale_id) {
      await queryInterface.removeColumn('material_lots', 'origin_sale_id');
    }

    if (lotsTable.lot_origin) {
      await queryInterface.removeColumn('material_lots', 'lot_origin');
    }
  }
};