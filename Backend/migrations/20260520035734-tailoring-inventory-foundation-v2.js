'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const rawTables = await queryInterface.showAllTables();
    const tables = rawTables.map(t => typeof t === 'string' ? t : t.tableName);

    if (!tables.includes('material_categories')) {
      await queryInterface.createTable('material_categories', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(120), allowNull: false },
        code: { type: Sequelize.STRING(20), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      });

      await queryInterface.addIndex('material_categories', ['code'], {
        unique: true,
        name: 'idx_material_categories_code_unique'
      });
    }

    if (!tables.includes('material_subcategories')) {
      await queryInterface.createTable('material_subcategories', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        category_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'material_categories', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        name: { type: Sequelize.STRING(120), allowNull: false },
        code: { type: Sequelize.STRING(20), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      });

      await queryInterface.addIndex('material_subcategories', ['category_id', 'code'], {
        unique: true,
        name: 'idx_material_subcategories_category_code_unique'
      });
    }

    const materialsTable = await queryInterface.describeTable('materials');

    const materialColumns = {
      sku: { type: Sequelize.STRING(80), allowNull: true },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'material_categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      subcategory_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'material_subcategories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      color: { type: Sequelize.STRING(80), allowNull: true },
      size: { type: Sequelize.STRING(80), allowNull: true },
      brand: { type: Sequelize.STRING(120), allowNull: true },
      inventory_type: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'CONSUMABLE' },
      tracking_method: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'STOCK' },
      affects_product_cost: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      costing_method: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'LAST_COST' },
      cost_updated_at: { type: Sequelize.DATE, allowNull: true },
      status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'ACTIVE' },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    };

    for (const [column, definition] of Object.entries(materialColumns)) {
      if (!materialsTable[column]) {
        await queryInterface.addColumn('materials', column, definition);
      }
    }

    const materialIndexes = await queryInterface.showIndex('materials');
    const materialIndexNames = materialIndexes.map(i => i.name);

    if (!materialIndexNames.includes('idx_materials_sku_unique')) {
      await queryInterface.addIndex('materials', ['sku'], {
        unique: true,
        name: 'idx_materials_sku_unique'
      });
    }

    if (!materialIndexNames.includes('idx_materials_category_id')) {
      await queryInterface.addIndex('materials', ['category_id'], {
        name: 'idx_materials_category_id'
      });
    }

    if (!materialIndexNames.includes('idx_materials_subcategory_id')) {
      await queryInterface.addIndex('materials', ['subcategory_id'], {
        name: 'idx_materials_subcategory_id'
      });
    }

    if (!tables.includes('material_cost_history')) {
      await queryInterface.createTable('material_cost_history', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        material_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'materials', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        previous_cost: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
        new_cost: { type: Sequelize.DECIMAL(12, 4), allowNull: false },
        reason: { type: Sequelize.TEXT, allowNull: true },
        source: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'MANUAL' },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      });

      await queryInterface.addIndex('material_cost_history', ['material_id'], {
        name: 'idx_material_cost_history_material_id'
      });
    }

    if (!tables.includes('material_lots')) {
      await queryInterface.createTable('material_lots', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        material_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'materials', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        lot_code: { type: Sequelize.STRING(100), allowNull: false },
        stock_quantity: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 0 },
        unit_cost: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
        scope_type: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'GENERAL' },
        sale_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'sales', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        sale_item_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: { model: 'sale_items', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'ACTIVE' },
        notes: { type: Sequelize.TEXT, allowNull: true },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        updated_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      });

      await queryInterface.addIndex('material_lots', ['material_id'], {
        name: 'idx_material_lots_material_id'
      });

      await queryInterface.addIndex('material_lots', ['scope_type', 'sale_id', 'sale_item_id'], {
        name: 'idx_material_lots_scope'
      });

      await queryInterface.addIndex('material_lots', ['lot_code'], {
        unique: true,
        name: 'idx_material_lots_lot_code_unique'
      });
    }

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'ENTRADA_REUTILIZABLE'
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'enum_inventory_movements_type'
          )
        ) THEN
          ALTER TYPE enum_inventory_movements_type ADD VALUE 'ENTRADA_REUTILIZABLE';
        END IF;
      END
      $$;
    `);

    const movementsTable = await queryInterface.describeTable('inventory_movements');

    const movementColumns = {
      material_lot_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'material_lots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      previous_stock: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
      new_stock: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
      previous_lot_stock: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
      new_lot_stock: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
      unit_cost: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
      total_cost: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'ACTIVE' },
      cancelled_at: { type: Sequelize.DATE, allowNull: true },
      cancellation_reason: { type: Sequelize.TEXT, allowNull: true },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      metadata: { type: Sequelize.JSONB, allowNull: true }
    };

    for (const [column, definition] of Object.entries(movementColumns)) {
      if (!movementsTable[column]) {
        await queryInterface.addColumn('inventory_movements', column, definition);
      }
    }

    const movementIndexes = await queryInterface.showIndex('inventory_movements');
    const movementIndexNames = movementIndexes.map(i => i.name);

    if (!movementIndexNames.includes('idx_inventory_movements_material_lot_id')) {
      await queryInterface.addIndex('inventory_movements', ['material_lot_id'], {
        name: 'idx_inventory_movements_material_lot_id'
      });
    }

    if (!movementIndexNames.includes('idx_inventory_movements_status')) {
      await queryInterface.addIndex('inventory_movements', ['status'], {
        name: 'idx_inventory_movements_status'
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('material_lots');
    await queryInterface.dropTable('material_cost_history');
    await queryInterface.dropTable('material_subcategories');
    await queryInterface.dropTable('material_categories');

    // No se eliminan valores agregados al ENUM de PostgreSQL.
  }
};