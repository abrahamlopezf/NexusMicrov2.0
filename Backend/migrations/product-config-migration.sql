-- Migration Script: Product + BOM + Cost Configuration
-- Target: PostgreSQL

BEGIN;

-- 1. Create ProductCostConfig Table
CREATE TABLE IF NOT EXISTS product_cost_configs (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sewing_hours DECIMAL(10,2) DEFAULT 0,
    pattern_hours DECIMAL(10,2) DEFAULT 0,
    fixed_supply_cost DECIMAL(12,2) DEFAULT 0,
    operation_margin DECIMAL(5,4) NULL,
    profit_margin DECIMAL(5,4) NULL,
    allow_manual_price BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_by INTEGER NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Modify Product Table
ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL,
    ALTER COLUMN is_custom SET DEFAULT false;

-- Rename old columns to legacy instead of dropping them
ALTER TABLE products RENAME COLUMN hours_pattern TO legacy_hours_pattern;
ALTER TABLE products RENAME COLUMN hours_sewing TO legacy_hours_sewing;
ALTER TABLE products RENAME COLUMN fixed_supply_tier TO legacy_fixed_supply_tier;

-- 3. Modify ProductMaterials Table
ALTER TABLE product_materials
    ADD COLUMN IF NOT EXISTS waste_percentage DECIMAL(5,2) DEFAULT 0;

-- 4. Safe Data Migration
-- We copy the legacy hours into the new config table for existing products.
-- (Assumes 'SENCILLO' maps to 30 fixed cost for legacy).
INSERT INTO product_cost_configs (product_id, sewing_hours, pattern_hours, fixed_supply_cost, version)
SELECT 
    id, 
    COALESCE(legacy_hours_sewing, 0), 
    COALESCE(legacy_hours_pattern, 0),
    CASE 
        WHEN legacy_fixed_supply_tier = 'SENCILLO' THEN 30.00
        WHEN legacy_fixed_supply_tier = 'MEDIO' THEN 45.00
        WHEN legacy_fixed_supply_tier = 'COMPLEJO' THEN 60.00
        ELSE 30.00 
    END,
    1
FROM products
ON CONFLICT DO NOTHING;

COMMIT;
