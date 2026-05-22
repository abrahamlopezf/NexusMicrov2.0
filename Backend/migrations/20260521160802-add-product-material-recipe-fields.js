'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('product_materials');

        if (table.material_id) {
            await queryInterface.changeColumn('product_materials', 'material_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'materials',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
        }

        if (!table.required_category_id) {
            await queryInterface.addColumn('product_materials', 'required_category_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'material_categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
        }

        if (!table.required_subcategory_id) {
            await queryInterface.addColumn('product_materials', 'required_subcategory_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'material_subcategories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
        }

        if (!table.material_role) {
            await queryInterface.addColumn('product_materials', 'material_role', {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'SUPPLY'
            });
        }

        if (!table.is_required) {
            await queryInterface.addColumn('product_materials', 'is_required', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            });
        }

        if (!table.is_selectable) {
            await queryInterface.addColumn('product_materials', 'is_selectable', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            });
        }

        if (!table.auto_add) {
            await queryInterface.addColumn('product_materials', 'auto_add', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            });
        }

        if (!table.active) {
            await queryInterface.addColumn('product_materials', 'active', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            });
        }

        if (!table.notes) {
            await queryInterface.addColumn('product_materials', 'notes', {
                type: Sequelize.TEXT,
                allowNull: true
            });
        }

        const indexes = await queryInterface.showIndex('product_materials');
        const names = indexes.map((i) => i.name);

        if (!names.includes('idx_product_materials_required_category')) {
            await queryInterface.addIndex('product_materials', ['required_category_id'], {
                name: 'idx_product_materials_required_category'
            });
        }

        if (!names.includes('idx_product_materials_required_subcategory')) {
            await queryInterface.addIndex('product_materials', ['required_subcategory_id'], {
                name: 'idx_product_materials_required_subcategory'
            });
        }

        if (!names.includes('idx_product_materials_role')) {
            await queryInterface.addIndex('product_materials', ['material_role'], {
                name: 'idx_product_materials_role'
            });
        }

        if (!names.includes('idx_product_materials_active')) {
            await queryInterface.addIndex('product_materials', ['active'], {
                name: 'idx_product_materials_active'
            });
        }

        await queryInterface.sequelize.query(`
        UPDATE product_materials
        SET
          material_role = COALESCE(material_role, 'SUPPLY'),
          is_required = true,
          is_selectable = false,
          auto_add = true,
          active = true
        WHERE material_role IS NULL
          OR active IS NULL;
      `);
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('product_materials');

        if (table.notes) await queryInterface.removeColumn('product_materials', 'notes');
        if (table.active) await queryInterface.removeColumn('product_materials', 'active');
        if (table.auto_add) await queryInterface.removeColumn('product_materials', 'auto_add');
        if (table.is_selectable)
            await queryInterface.removeColumn('product_materials', 'is_selectable');
        if (table.is_required)
            await queryInterface.removeColumn('product_materials', 'is_required');
        if (table.material_role)
            await queryInterface.removeColumn('product_materials', 'material_role');
        if (table.required_subcategory_id)
            await queryInterface.removeColumn('product_materials', 'required_subcategory_id');
        if (table.required_category_id)
            await queryInterface.removeColumn('product_materials', 'required_category_id');
    }
};
