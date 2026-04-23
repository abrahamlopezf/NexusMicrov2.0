const db = require('../src/models');
const bcrypt = require('bcryptjs');

async function forceUpdatePasswords() {
    try {
        await db.sequelize.authenticate();
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await db.User.update(
            { password: hashedPassword },
            { where: {} } // update all
        );
        console.log('Successfully hashed passwords for ALL users.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.sequelize.close();
    }
}

forceUpdatePasswords();
