-- Migration Script: Enterprise Hardening (Ledger, Audit, Idempotency, Features)
-- Target: PostgreSQL

BEGIN;

-- 1. Double-Entry Accounting Ledger
CREATE TABLE IF NOT EXISTS ledger_entries (
    id SERIAL PRIMARY KEY,
    entry_group_id UUID NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    debit DECIMAL(15,4) DEFAULT 0 CHECK (debit >= 0),
    credit DECIMAL(15,4) DEFAULT 0 CHECK (credit >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    reference_type VARCHAR(50) NOT NULL, -- SALE, PAYMENT, CANCEL
    reference_id INTEGER NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_group ON ledger_entries(entry_group_id);
CREATE INDEX IF NOT EXISTS idx_ledger_ref ON ledger_entries(reference_type, reference_id);

-- 2. Idempotency Keys Table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    idempotency_key VARCHAR(100) PRIMARY KEY,
    request_path VARCHAR(200) NOT NULL,
    response_body JSONB NOT NULL,
    response_status INTEGER NOT NULL,
    correlation_id VARCHAR(100),
    locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Audit Log Enhancement
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    ip_address VARCHAR(50) NULL,
    user_agent TEXT NULL,
    correlation_id VARCHAR(100) NULL,
    endpoint VARCHAR(200) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_correlation ON audit_logs(correlation_id);

-- 4. DB-Based Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    name VARCHAR(100) PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT false,
    description TEXT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER NULL
);

-- Initial Flags
INSERT INTO feature_flags (name, is_enabled, description) VALUES 
('ENABLE_PAYROLL', true, 'Activates payroll module integration'),
('ENABLE_ASYNC_QUEUE', true, 'Toggles BullMQ processing vs Synchronous Fallback')
ON CONFLICT DO NOTHING;

-- 5. Versioning
ALTER TABLE sales ADD COLUMN IF NOT EXISTS pricing_rules_version VARCHAR(20) DEFAULT 'v1';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS pricing_rules_version VARCHAR(20) DEFAULT 'v1';
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB NULL;

COMMIT;
