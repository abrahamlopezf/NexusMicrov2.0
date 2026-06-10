-- ==============================================================================
-- PATCH: Add missing columns to work_orders and production_tasks
-- These columns exist in the Sequelize models but were missing from the schema.
-- Execute directly in PostgreSQL:
--   psql -U user -d database -f patch_work_orders_production_tasks.sql
-- ==============================================================================

-- WORK_ORDERS: add notes, created_by, updated_by
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS created_by INT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS updated_by INT;

-- PRODUCTION_TASKS: add product_id, quantity, real_materials_used, started_at, duration, notes, created_by, updated_by
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS product_id INT REFERENCES products(id);
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS real_materials_used JSONB;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS duration INT;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS created_by INT;
ALTER TABLE production_tasks ADD COLUMN IF NOT EXISTS updated_by INT;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_production_tasks_product ON production_tasks(product_id);
CREATE INDEX IF NOT EXISTS idx_production_tasks_employee ON production_tasks(employee_id);

-- ==============================================================================
-- NOTE: After running this, restart the backend server.
-- ==============================================================================
