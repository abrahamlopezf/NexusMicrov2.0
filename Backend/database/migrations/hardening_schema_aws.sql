-- ==============================================================================
-- 🔐 HARDENING FINAL - HEKKA ERP (PRODUCCIÓN AWS READY)
-- Compatible 100% con Sequelize API & Soft Deletes
-- ==============================================================================

-- =========================
-- 1. NOT NULL PROTECCIÓN (DATOS VITALES)
-- =========================

ALTER TABLE users ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE clients ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE products ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE sales ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE materials ALTER COLUMN updated_at SET NOT NULL;

-- =========================
-- 2. TRIGGER GLOBAL updated_at (NIVEL EXPERTO AWS)
-- =========================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo se modifica si la fila realmente sufrió un cambio (Ahorra I/O en Cloud)
  IF row_to_json(NEW) IS DISTINCT FROM row_to_json(OLD) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Inyección dinámica inteligente
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;
            CREATE TRIGGER trg_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
        ', t.table_name, t.table_name, t.table_name, t.table_name);
    END LOOP;
END;
$$;

-- =========================
-- 3. BARRERAS CONTABLES (DOUBLE-ENTRY PROTECTION)
-- =========================

ALTER TABLE accounts 
    ADD CONSTRAINT chk_accounts_balance CHECK (balance >= 0);

ALTER TABLE payments 
    ADD CONSTRAINT chk_payments_amount CHECK (amount > 0);

ALTER TABLE sales 
    ADD CONSTRAINT chk_sales_total CHECK (total >= 0),
    ADD CONSTRAINT chk_sales_paid CHECK (paid_amount >= 0),
    ADD CONSTRAINT chk_sales_balance CHECK (balance >= 0 AND balance <= total);

ALTER TABLE quotes 
    ADD CONSTRAINT chk_quotes_financials CHECK (subtotal >= 0 AND discount >= 0 AND total >= 0);

-- =========================
-- 4. BARRERAS FÍSICAS (INVENTARIO Y BOM)
-- =========================

ALTER TABLE materials 
    ADD CONSTRAINT chk_material_stock CHECK (current_stock >= 0),
    ADD CONSTRAINT chk_material_min CHECK (min_stock >= 0);

ALTER TABLE product_materials 
    ADD CONSTRAINT chk_bom_quantity CHECK (quantity > 0);

ALTER TABLE inventory_movements 
    ADD CONSTRAINT chk_inventory_qty CHECK (quantity > 0);

-- =========================
-- 5. DEFAULTS INTELIGENTES EN CASCADA
-- =========================

ALTER TABLE sales ALTER COLUMN status SET DEFAULT 'PENDIENTE';

-- ==============================================================================
-- ✅ FIN DEL HARDENING (DB MASTERED)
-- ==============================================================================
