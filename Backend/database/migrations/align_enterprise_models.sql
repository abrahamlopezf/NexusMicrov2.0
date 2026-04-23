-- ==============================================================================
-- SCRIPT DE MIGRACIÓN EMPRESARIAL PARA POSTGRESQL (HEKKA ERP)
-- Ejecutar directamente en la Base de Datos para alinear con Modelos Sequelize
-- ==============================================================================

-- 1. AÑADIR COLUMNA `updated_at` (Requerida por timestamps: true de Sequelize)
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product_materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. AÑADIR COLUMNA `deleted_at` (Requerida por paranoid: true para Soft-Deletes)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- 3. AUMENTAR PRECISIÓN DE INVENTARIO PARA CORTES MICROMÉTRICOS (Telas/Hilos)
ALTER TABLE materials ALTER COLUMN current_stock TYPE DECIMAL(10,4);
ALTER TABLE materials ALTER COLUMN min_stock TYPE DECIMAL(10,4);
ALTER TABLE product_materials ALTER COLUMN quantity TYPE DECIMAL(10,4);
ALTER TABLE inventory_movements ALTER COLUMN quantity TYPE DECIMAL(10,4);
ALTER TABLE purchase_items ALTER COLUMN quantity TYPE DECIMAL(10,4);

-- 4. BLINDAR COLUMNAS FINANCIERAS PARA MONTOS MAYORES A $99,999.00
ALTER TABLE accounts ALTER COLUMN balance TYPE DECIMAL(12,2);
ALTER TABLE financial_movements ALTER COLUMN amount TYPE DECIMAL(12,2);
ALTER TABLE payments ALTER COLUMN amount TYPE DECIMAL(12,2);

ALTER TABLE sales ALTER COLUMN total TYPE DECIMAL(12,2);
ALTER TABLE sales ALTER COLUMN paid_amount TYPE DECIMAL(12,2);
ALTER TABLE sales ALTER COLUMN balance TYPE DECIMAL(12,2);
ALTER TABLE sale_items ALTER COLUMN unit_price TYPE DECIMAL(12,2);
ALTER TABLE sale_items ALTER COLUMN total TYPE DECIMAL(12,2);

ALTER TABLE quotes ALTER COLUMN subtotal TYPE DECIMAL(12,2);
ALTER TABLE quotes ALTER COLUMN discount TYPE DECIMAL(12,2);
ALTER TABLE quotes ALTER COLUMN total TYPE DECIMAL(12,2);
ALTER TABLE quote_items ALTER COLUMN unit_price TYPE DECIMAL(12,2);
ALTER TABLE quote_items ALTER COLUMN total TYPE DECIMAL(12,2);

ALTER TABLE purchase_orders ALTER COLUMN total TYPE DECIMAL(12,2);
ALTER TABLE purchase_items ALTER COLUMN unit_cost TYPE DECIMAL(12,2);
ALTER TABLE purchase_items ALTER COLUMN total TYPE DECIMAL(12,2);

-- ==============================================================================
-- NOTA: Los checks matemáticos (ej. min: 0) ahora se validan en la capa de 
-- aplicación (Sequelize) antes del INSERT. Si deseas validacion estricta en DB, 
-- descomenta y ejecuta lo siguiente (Opcional pero recomendado para consistencia):
--
-- ALTER TABLE accounts ADD CONSTRAINT check_account_balance CHECK (balance >= 0);
-- ALTER TABLE product_materials ADD CONSTRAINT check_bom_qty CHECK (quantity >= 0);
-- ==============================================================================
