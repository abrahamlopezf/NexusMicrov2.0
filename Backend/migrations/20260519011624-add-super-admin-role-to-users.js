'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'SUPER_ADMIN'
          AND enumtypid = (
            SELECT oid
            FROM pg_type
            WHERE typname = 'enum_users_role'
          )
        ) THEN
          ALTER TYPE enum_users_role ADD VALUE 'SUPER_ADMIN';
        END IF;
      END
      $$;
    `);
  },

  async down(queryInterface) {
    // PostgreSQL no permite eliminar fácilmente un valor de ENUM.
    // Si se requiere revertir, habría que recrear el tipo ENUM.
  }
};