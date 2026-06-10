const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function main() {
    const hash = await bcrypt.hash('test123', 10);
    console.log('Generated hash:', hash);
    
    const pool = new Pool({
        host: '127.0.0.1',
        port: 5432,
        user: 'nexus_user',
        password: 'resendiz1226NRC',
        database: 'erp_local'
    });
    
    await pool.query("DELETE FROM users WHERE email = 'admin@nexus.com'");
    
    const result = await pool.query(
        `INSERT INTO users (name, email, password, role, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW()) RETURNING id`,
        ['Test Admin', 'admin@nexus.com', hash, 'ADMIN']
    );
    console.log('User created with ID:', result.rows[0].id);
    await pool.end();
}

main().catch(e => console.error(e));
