'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tablesRaw = await queryInterface.showAllTables();
        const tables = tablesRaw.map((t) => (typeof t === 'string' ? t : t.tableName));

        // =====================================================
        // SUPPLIERS
        // =====================================================
        if (!tables.includes('suppliers')) {
            await queryInterface.createTable('suppliers', {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },

                name: {
                    type: Sequelize.STRING(180),
                    allowNull: false
                },

                business_name: {
                    type: Sequelize.STRING(180),
                    allowNull: true
                },

                rfc: {
                    type: Sequelize.STRING(20),
                    allowNull: true
                },

                supplier_type: {
                    type: Sequelize.STRING(40),
                    allowNull: false,
                    defaultValue: 'MATERIAL_SUPPLIER'
                },

                phone: {
                    type: Sequelize.STRING(30),
                    allowNull: true
                },

                email: {
                    type: Sequelize.STRING(150),
                    allowNull: true
                },

                address: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },

                contact_name: {
                    type: Sequelize.STRING(150),
                    allowNull: true
                },

                payment_terms: {
                    type: Sequelize.STRING(80),
                    allowNull: true
                },

                notes: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },

                status: {
                    type: Sequelize.STRING(30),
                    allowNull: false,
                    defaultValue: 'ACTIVE'
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
        } else {
            const suppliersTable = await queryInterface.describeTable('suppliers');

            const addColumnIfMissing = async (name, definition) => {
                if (!suppliersTable[name]) {
                    await queryInterface.addColumn('suppliers', name, definition);
                }
            };

            await addColumnIfMissing('business_name', {
                type: Sequelize.STRING(180),
                allowNull: true
            });

            await addColumnIfMissing('rfc', {
                type: Sequelize.STRING(20),
                allowNull: true
            });

            await addColumnIfMissing('supplier_type', {
                type: Sequelize.STRING(40),
                allowNull: false,
                defaultValue: 'MATERIAL_SUPPLIER'
            });

            await addColumnIfMissing('contact_name', {
                type: Sequelize.STRING(150),
                allowNull: true
            });

            await addColumnIfMissing('payment_terms', {
                type: Sequelize.STRING(80),
                allowNull: true
            });

            await addColumnIfMissing('notes', {
                type: Sequelize.TEXT,
                allowNull: true
            });

            await addColumnIfMissing('status', {
                type: Sequelize.STRING(30),
                allowNull: false,
                defaultValue: 'ACTIVE'
            });

            await addColumnIfMissing('created_by', {
                type: Sequelize.INTEGER,
                allowNull: true
            });

            await addColumnIfMissing('updated_by', {
                type: Sequelize.INTEGER,
                allowNull: true
            });

            await addColumnIfMissing('deleted_at', {
                type: Sequelize.DATE,
                allowNull: true
            });
        }

        // =====================================================
        // PURCHASES
        // =====================================================
        if (!tables.includes('purchases')) {
            await queryInterface.createTable('purchases', {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },

                purchase_number: {
                    type: Sequelize.STRING(80),
                    allowNull: false,
                    unique: true
                },

                supplier_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'suppliers',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },

                purchase_type: {
                    type: Sequelize.STRING(40),
                    allowNull: false,
                    defaultValue: 'MATERIAL_PURCHASE'
                },

                status: {
                    type: Sequelize.STRING(40),
                    allowNull: false,
                    defaultValue: 'RECEIVED'
                },

                purchase_date: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },

                subtotal: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                tax: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                discount: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                total: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                reference: {
                    type: Sequelize.STRING(120),
                    allowNull: true
                },

                notes: {
                    type: Sequelize.TEXT,
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
        }

        // =====================================================
        // PURCHASE ITEMS
        // =====================================================
        if (!tables.includes('purchase_items')) {
            await queryInterface.createTable('purchase_items', {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },

                purchase_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'purchases',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },

                material_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'materials',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
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

                inventory_movement_id: {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                    references: {
                        model: 'inventory_movements',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },

                quantity: {
                    type: Sequelize.DECIMAL(12, 4),
                    allowNull: false
                },

                unit_cost: {
                    type: Sequelize.DECIMAL(12, 4),
                    allowNull: false
                },

                subtotal: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                tax: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                discount: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                total: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                scope_type: {
                    type: Sequelize.STRING(40),
                    allowNull: false,
                    defaultValue: 'GENERAL'
                },

                sale_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'sales',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
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

                notes: {
                    type: Sequelize.TEXT,
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
        } else {
            const purchaseItemsTable = await queryInterface.describeTable('purchase_items');

            const addColumnIfMissing = async (name, definition) => {
                if (!purchaseItemsTable[name]) {
                    await queryInterface.addColumn('purchase_items', name, definition);
                }
            };

            await addColumnIfMissing('purchase_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'purchases',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            });

            await addColumnIfMissing('material_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'materials',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            });

            await addColumnIfMissing('quantity', {
                type: Sequelize.DECIMAL(12, 4),
                allowNull: true
            });

            await addColumnIfMissing('unit_cost', {
                type: Sequelize.DECIMAL(12, 4),
                allowNull: true
            });

            await addColumnIfMissing('subtotal', {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0
            });

            await addColumnIfMissing('total', {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0
            });

            await addColumnIfMissing('material_lot_id', {
                type: Sequelize.INTEGER,
                allowNull: true
            });

            await addColumnIfMissing('inventory_movement_id', {
                type: Sequelize.BIGINT,
                allowNull: true
            });

            await addColumnIfMissing('scope_type', {
                type: Sequelize.STRING(40),
                allowNull: false,
                defaultValue: 'GENERAL'
            });

            await addColumnIfMissing('sale_id', {
                type: Sequelize.INTEGER,
                allowNull: true
            });

            await addColumnIfMissing('sale_item_id', {
                type: Sequelize.BIGINT,
                allowNull: true
            });

            await addColumnIfMissing('tax', {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0
            });

            await addColumnIfMissing('discount', {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0
            });

            await addColumnIfMissing('notes', {
                type: Sequelize.TEXT,
                allowNull: true
            });

            await addColumnIfMissing('created_by', {
                type: Sequelize.INTEGER,
                allowNull: true
            });

            await addColumnIfMissing('updated_by', {
                type: Sequelize.INTEGER,
                allowNull: true
            });

            await addColumnIfMissing('deleted_at', {
                type: Sequelize.DATE,
                allowNull: true
            });
        }

        // =====================================================
        // EXTERNAL SERVICE ORDERS
        // =====================================================
        if (!tables.includes('external_service_orders')) {
            await queryInterface.createTable('external_service_orders', {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },

                service_number: {
                    type: Sequelize.STRING(80),
                    allowNull: false,
                    unique: true
                },

                supplier_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'suppliers',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
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

                work_order_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'work_orders',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },

                service_type: {
                    type: Sequelize.STRING(80),
                    allowNull: false
                },

                description: {
                    type: Sequelize.TEXT,
                    allowNull: false
                },

                quantity: {
                    type: Sequelize.DECIMAL(12, 4),
                    allowNull: false,
                    defaultValue: 1
                },

                unit_cost: {
                    type: Sequelize.DECIMAL(12, 4),
                    allowNull: false,
                    defaultValue: 0
                },

                subtotal: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                tax: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                discount: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                total_cost: {
                    type: Sequelize.DECIMAL(12, 2),
                    allowNull: false,
                    defaultValue: 0
                },

                status: {
                    type: Sequelize.STRING(40),
                    allowNull: false,
                    defaultValue: 'PENDING'
                },

                sent_at: {
                    type: Sequelize.DATE,
                    allowNull: true
                },

                expected_return_at: {
                    type: Sequelize.DATE,
                    allowNull: true
                },

                received_at: {
                    type: Sequelize.DATE,
                    allowNull: true
                },

                cancelled_at: {
                    type: Sequelize.DATE,
                    allowNull: true
                },

                cancellation_reason: {
                    type: Sequelize.TEXT,
                    allowNull: true
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
        }

        const indexes = {
            suppliers: await queryInterface.showIndex('suppliers'),
            purchases: await queryInterface.showIndex('purchases'),
            purchase_items: await queryInterface.showIndex('purchase_items'),
            external_service_orders: await queryInterface.showIndex('external_service_orders')
        };

        const indexNames = (tableName) => indexes[tableName].map((i) => i.name);

        if (!indexNames('suppliers').includes('idx_suppliers_supplier_type')) {
            await queryInterface.addIndex('suppliers', ['supplier_type'], {
                name: 'idx_suppliers_supplier_type'
            });
        }

        if (!indexNames('suppliers').includes('idx_suppliers_status')) {
            await queryInterface.addIndex('suppliers', ['status'], {
                name: 'idx_suppliers_status'
            });
        }

        if (!indexNames('purchases').includes('idx_purchases_supplier_id')) {
            await queryInterface.addIndex('purchases', ['supplier_id'], {
                name: 'idx_purchases_supplier_id'
            });
        }

        if (!indexNames('purchases').includes('idx_purchases_status')) {
            await queryInterface.addIndex('purchases', ['status'], {
                name: 'idx_purchases_status'
            });
        }

        if (!indexNames('purchase_items').includes('idx_purchase_items_purchase_id')) {
            await queryInterface.addIndex('purchase_items', ['purchase_id'], {
                name: 'idx_purchase_items_purchase_id'
            });
        }

        if (!indexNames('purchase_items').includes('idx_purchase_items_material_id')) {
            await queryInterface.addIndex('purchase_items', ['material_id'], {
                name: 'idx_purchase_items_material_id'
            });
        }

        if (
            !indexNames('external_service_orders').includes(
                'idx_external_service_orders_supplier_id'
            )
        ) {
            await queryInterface.addIndex('external_service_orders', ['supplier_id'], {
                name: 'idx_external_service_orders_supplier_id'
            });
        }

        if (
            !indexNames('external_service_orders').includes('idx_external_service_orders_sale_id')
        ) {
            await queryInterface.addIndex('external_service_orders', ['sale_id'], {
                name: 'idx_external_service_orders_sale_id'
            });
        }

        if (
            !indexNames('external_service_orders').includes(
                'idx_external_service_orders_sale_item_id'
            )
        ) {
            await queryInterface.addIndex('external_service_orders', ['sale_item_id'], {
                name: 'idx_external_service_orders_sale_item_id'
            });
        }

        if (!indexNames('external_service_orders').includes('idx_external_service_orders_status')) {
            await queryInterface.addIndex('external_service_orders', ['status'], {
                name: 'idx_external_service_orders_status'
            });
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable('external_service_orders');
        await queryInterface.dropTable('purchase_items');
        await queryInterface.dropTable('purchases');
    }
};
