const fs = require('fs');
const db = require('../src/models');
const { ROLES } = require('../src/utils/permissions');

async function testManager() {
    try {
        await db.User.create({
            email: 'manager2@test.com',
            name: 'Manager Test 2',
            password: 'password123',
            role: ROLES.MANAGER,
            active: true
        });
        fs.writeFileSync('error_log.txt', 'Success!');
    } catch (err) {
        fs.writeFileSync('error_log.txt', err.stack || err.message || String(err));
    } finally {
        await db.sequelize.close();
    }
}

testManager();
