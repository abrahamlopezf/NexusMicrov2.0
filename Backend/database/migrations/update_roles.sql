-- 1. Create a temporary type or add values to the existing ENUM
-- Since Postgres doesn't allow removing values from ENUM easily, we add the new ones first.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'EMPLOYEE';

-- 2. Migrate existing users to the new roles
-- You should decide which old role maps to which new role.
-- Example mapping:
-- VENTAS -> MANAGER or EMPLOYEE
-- PRODUCCION -> EMPLOYEE
-- FINANZAS -> MANAGER
-- CLIENT -> (Needs a new home or keep as is if you don't mind the enum having extra values)

-- Update users (adjust as needed):
UPDATE users SET role = 'MANAGER' WHERE role = 'VENTAS';
UPDATE users SET role = 'EMPLOYEE' WHERE role = 'PRODUCCION';
UPDATE users SET role = 'MANAGER' WHERE role = 'FINANZAS';
