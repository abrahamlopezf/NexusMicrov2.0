const db = require('../src/models');
const bcrypt = require('bcryptjs');

async function updatePasswords() {
    try {
        await db.sequelize.authenticate();
        console.log('Database connection established.');

        const hashedPassword = await bcrypt.hash('password123', 10);

        const emails = [
            'admin@test.com',
            'ventas@test.com',
            'produccion@test.com',
            'finanzas@test.com'
        ];

        for (const email of emails) {
            const [updated] = await db.User.update(
                { password: hashedPassword },
                { where: { email } }
            );
            if (updated) {
                console.log(`Updated to hashed password for ${email}`);
            } else {
                console.log(`Did not update password for ${email} (Maybe not found)`);
            }
        }

        console.log('\nAll test users have been updated with correctly hashed passwords!');

    } catch (error) {
        console.error('Error updating passwords:', error);
    } finally {
        await db.sequelize.close();
    }
}

updatePasswords();
