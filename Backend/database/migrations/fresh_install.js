const fs = require('fs');
const path = require('path');
const sequelize = require('../../src/config/database');

async function run() {
  try {
    console.log('\n[HEKKA AWS DEPLOYER]');
    console.log('1. Conectando a la Base de Datos...');
    await sequelize.authenticate();

    console.log('2. Purgando esquema publico (Drop All Tables vacío)...');
    await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;');

    console.log('3. Leyendo Master Schema AWS...');
    const sqlPath = path.join(__dirname, 'init_master_schema_aws.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('4. Ejecutando migracion estructural Enterprise...');
    await sequelize.query(sql);

    console.log('✅ ¡BINGO! Base de Datos Hekka reconstruida e hidratada con la nueva Arquitectura AWS.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal durante la reconstrucción:', error);
    process.exit(1);
  }
}

run();
