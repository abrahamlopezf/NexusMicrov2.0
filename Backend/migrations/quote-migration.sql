-- Migration Script: Quotes PRO Module
-- Target: PostgreSQL
-- Description: Alters the quotes and quote_items tables safely, changes status from ENUM to VARCHAR(50), and migrates legacy statuses.

BEGIN;

-- 1. Alter Quotes Table
ALTER TABLE quotes 
    ALTER COLUMN status TYPE VARCHAR(50),
    ALTER COLUMN status SET DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS valid_until DATE NULL,
    ADD COLUMN IF NOT EXISTS notes TEXT NULL,
    ADD COLUMN IF NOT EXISTS created_by INTEGER NULL,
    ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB NULL;

-- 2. Migrate existing status records safely
UPDATE quotes SET status = 'DRAFT' WHERE status = 'BORRADOR';
UPDATE quotes SET status = 'SENT' WHERE status = 'PENDIENTE';
UPDATE quotes SET status = 'APPROVED' WHERE status = 'APROBADA';
UPDATE quotes SET status = 'REJECTED' WHERE status = 'RECHAZADA';
UPDATE quotes SET status = 'APPROVED' WHERE status = 'CONVERTIDA'; -- Assuming converted implies it was approved and turned to sale

-- 3. Alter QuoteItems Table
ALTER TABLE quote_items 
    ALTER COLUMN product_id DROP NOT NULL,
    ALTER COLUMN quantity TYPE DECIMAL(10,4),
    ADD COLUMN IF NOT EXISTS custom_description TEXT NULL,
    ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12,2) NULL,
    ADD COLUMN IF NOT EXISTS cost_breakdown JSONB NULL,
    ADD COLUMN IF NOT EXISTS materials_estimate JSONB NULL,
    ADD COLUMN IF NOT EXISTS created_by INTEGER NULL;

COMMIT;
