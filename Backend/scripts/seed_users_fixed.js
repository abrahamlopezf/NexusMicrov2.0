const db = require('../src/models');
const bcrypt = require('bcryptjs');

async function seedUsers() {
    try {
        await db.sequelize.authenticate();
        console.log('Database connection established.');

        // The DB enum for user_role is: ["ADMIN", "VENTAS", "PRODUCCION", "FINANZAS"]
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Admin
        const [adminUser, adminCreated] = await db.User.findOrCreate({
            where: { email: 'admin@test.com' },
            defaults: {
                name: 'Admin Test',
                password: hashedPassword,
                role: 'ADMIN',
                active: true
            }
        });
        console.log(`[${adminCreated ? 'CREATED' : 'EXISTS'}] Admin: ${adminUser.email} / password123`);

        // 2. Ventas (Sales)
        const [ventasUser, ventasCreated] = await db.User.findOrCreate({
            where: { email: 'ventas@test.com' },
            defaults: {
                name: 'Ventas Test',
                password: hashedPassword,
                role: 'VENTAS',
                active: true
            }
        });
        console.log(`[${ventasCreated ? 'CREATED' : 'EXISTS'}] Ventas: ${ventasUser.email} / password123`);

        // 3. Produccion (Production)
        const [prodUser, prodCreated] = await db.User.findOrCreate({
            where: { email: 'produccion@test.com' },
            defaults: {
                name: 'Produccion Test',
                password: hashedPassword,
                role: 'PRODUCCION',
                active: true
            }
        });
        console.log(`[${prodCreated ? 'CREATED' : 'EXISTS'}] Produccion: ${prodUser.email} / password123`);

        // 4. Finanzas (Finance)
        const [finanzasUser, finanzasCreated] = await db.User.findOrCreate({
            where: { email: 'finanzas@test.com' },
            defaults: {
                name: 'Finanzas Test',
                password: 'password123',
                role: 'FINANZAS',
                active: true
            }
        });
        console.log(`[${finanzasCreated ? 'CREATED' : 'EXISTS'}] Finanzas: ${finanzasUser.email} / password123`);

        console.log('\nAll test users have been injected successfully!');

    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        await db.sequelize.close();
    }
}

seedUsers();
