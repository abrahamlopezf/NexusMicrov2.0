const fs = require('fs');
const db = require('../src/models');
const { ROLES } = require('../src/utils/permissions');

async function testManager() {
    try {
        await db.User.create({
            email: 'manager3@test.com',
            name: 'Manager Test 3',
            password: 'password123',
            role: ROLES.MANAGER,
            active: true
        });
        fs.writeFileSync('error_log.json', JSON.stringify({ success: true }));
    } catch (err) {
        fs.writeFileSync('error_log.json', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } finally {
        await db.sequelize.close();
    }
}

testManager();
