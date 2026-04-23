const fs = require('fs');
const db = require('../src/models');
async function getEnum() {
    try {
        const res = await db.sequelize.query("SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype");
        fs.writeFileSync('enum.json', JSON.stringify(res[0].map(r => r.enumlabel)));
    } catch(e) {
        console.error(e);
    } finally {
        await db.sequelize.close();
    }
}
getEnum();
