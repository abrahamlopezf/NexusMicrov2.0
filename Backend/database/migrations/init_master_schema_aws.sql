-- ======================================================================================
-- MASTER SCHEMA HEKKA ERP (AWS DEPLOYMENT OPTIMIZED)
-- Arquitectura Centralizada - PostgreSQL 14+
-- ======================================================================================

-- 1. EXTENSIONES RECOMENDADAS AWS RDS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES (Control estricto de catálogos)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'VENTAS', 'PRODUCCION', 'FINANZAS');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status') THEN
        CREATE TYPE sale_status AS ENUM ('PENDIENTE', 'EN_PRODUCCION', 'LISTO_ENTREGA', 'PAGADO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
        CREATE TYPE quote_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CONVERTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_type') THEN
        CREATE TYPE inventory_type AS ENUM ('ENTRADA_COMPRA', 'SALIDA_PRODUCCION', 'SALIDA_VENTA', 'AJUSTE', 'DEVOLUCION');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('CAJA', 'BANCO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'production_status') THEN
        CREATE TYPE production_status AS ENUM ('PENDIENTE', 'ASIGNADA', 'EN_PROCESO', 'TERMINADA', 'ENTREGADA');
    END IF;
END $$;


-- ==========================
-- TABLAS MAESTRAS (CORE)
-- ==========================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    rfc VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    credit_days INT DEFAULT 0,
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(100),
    area VARCHAR(100),
    salary_type VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);


-- ==========================
-- CATÁLOGO E INVENTARIO
-- ==========================

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    type VARCHAR(20) DEFAULT 'FIJO' CHECK (type IN ('FIJO','ROTATIVO')),
    unit VARCHAR(50) NOT NULL,
    current_stock DECIMAL(10,4) DEFAULT 0 CHECK (current_stock >= 0),
    min_stock DECIMAL(10,4) DEFAULT 0,
    cost DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    base_price DECIMAL(12,2) DEFAULT 0,
    base_cost DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS product_materials (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    material_id INT NOT NULL REFERENCES materials(id),
    type VARCHAR(20) DEFAULT 'FIJO' CHECK (type IN ('FIJO','OPCIONAL')),
    quantity DECIMAL(10,4) NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Única de Movimientos de Inventario (BIGSERIAL para AWS alto volumen)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    material_id INT NOT NULL REFERENCES materials(id),
    type inventory_type NOT NULL,
    quantity DECIMAL(10,4) NOT NULL,
    unit_cost DECIMAL(12,2),
    reference_type VARCHAR(50), 
    reference_id INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ==========================
-- COMERCIAL (VENTAS Y COTIZACIONES)
-- ==========================

CREATE TABLE IF NOT EXISTS pricing_rules (
    id SERIAL PRIMARY KEY,
    operation_cost_percent DECIMAL(5,2) NOT NULL,
    profit_margin_percent DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT NOT NULL REFERENCES clients(id),
    status quote_status DEFAULT 'DRAFT',
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_items (
    id BIGSERIAL PRIMARY KEY,
    quote_id INT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    description TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    surcharge DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT NOT NULL REFERENCES clients(id),
    quote_id INT REFERENCES quotes(id),
    status sale_status DEFAULT 'PENDIENTE',
    total DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    description TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ==========================
-- PRODUCCIÓN Y COMPRAS
-- ==========================

CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(id),
    status production_status DEFAULT 'PENDIENTE',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_tasks (
    id BIGSERIAL PRIMARY KEY,
    work_order_id INT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    employee_id INT REFERENCES employees(id),
    task_name VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDIENTE',
    price DECIMAL(12,2),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL REFERENCES suppliers(id),
    status VARCHAR(50) DEFAULT 'PENDIENTE',
    total DECIMAL(12,2) DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    material_id INT NOT NULL REFERENCES materials(id),
    quantity DECIMAL(10,4) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ==========================
-- FINANZAS
-- ==========================

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type account_type NOT NULL,
    balance DECIMAL(14,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(id),
    account_id INT NOT NULL REFERENCES accounts(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_method payment_method NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Representa el libro mayor contable, inmutable y auditable (BIGSERIAL)
CREATE TABLE IF NOT EXISTS financial_movements (
    id BIGSERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts(id),
    type VARCHAR(20) CHECK (type IN ('INGRESO','EGRESO')) NOT NULL,
    concept TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_advances (
    id BIGSERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDIENTE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ==========================
-- AUDITORÍA NATIVA DB
-- ==========================
-- Solo se activa para cambios estructurales puros, no usar si Sequelize ya audita para evitar doble I/O en AWS.

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT,
    action VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ==========================
-- ÍNDICES (AWS PERFORMANCE OPTIMIZATION)
-- ==========================
-- Optimizamos para RDS agrupando B-Trees

CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_quote ON sales(quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_status_date ON sales(status, created_at);

CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);

CREATE INDEX IF NOT EXISTS idx_inv_movement_material ON inventory_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_inv_movement_ref ON inventory_movements(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_work_orders_sale ON work_orders(sale_id);
CREATE INDEX IF NOT EXISTS idx_tasks_work_order ON production_tasks(work_order_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON production_tasks(employee_id);

CREATE INDEX IF NOT EXISTS idx_product_materials_prod ON product_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_product_materials_mat ON product_materials(material_id);

CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_finance_account ON financial_movements(account_id);

CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);


-- ==========================
-- FUNCIONES Y TRIGGERS (DATA INTEGRITY ONLY)
-- ==========================

-- 1. Automantenimiento de updated_at (Este trigger sí debe vivir en la BD)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_%I ON %I', t, t);
        EXECUTE format('CREATE TRIGGER trg_update_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_timestamp()', t, t);
    END LOOP;
END $$;

-- ======================================================================================
-- NOTA A NIVEL ARQUITECTURA: 
-- Los Triggers de Negocio (update_stock, update_accounts_receivable, cascade_payments) 
-- FUERON REMOVIDOS de esta capa. En esquemas Node.js + AWS (RDS/Aurora), la lógica de
-- sumas/restas de stock y contabilidad DEBERÁ vivir en tu API (Capa de Servicio con Transacciones ACID)
-- para evitar locks silenciosos en la base de datos, lidiar con Double-Auditing y facilitar Cache/Microservicios.
-- ======================================================================================
