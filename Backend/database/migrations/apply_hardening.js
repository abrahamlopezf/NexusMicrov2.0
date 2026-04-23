const fs = require('fs');
const path = require('path');
const sequelize = require('../../src/config/database');

async function run() {
  try {
    console.log('\n[HEKKA AWS HARDENING]');
    console.log('1. Conectando a la Base de Datos...');
    await sequelize.authenticate();

    console.log('2. Leyendo Script Hardening...');
    const sqlPath = path.join(__dirname, 'hardening_schema_aws.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('3. Inyectando triggers dinámicos y constraints de hierro...');
    await sequelize.query(sql);

    console.log('✅ ¡BINGO! Base de datos blindada a nivel corporativo.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal durante el hardening:', error);
    process.exit(1);
  }
}

run();
