const db = require('../src/models');
const { ROLES } = require('../src/utils/permissions');

async function seedUsers() {
    try {
        await db.sequelize.authenticate();
        console.log('Database connection established.');

        // 1. Admin (Requested first)
        const [adminUser, adminCreated] = await db.User.findOrCreate({
            where: { email: 'admin@test.com' },
            defaults: {
                name: 'Admin Test',
                password: 'password123',
                role: ROLES.ADMIN,
                active: true
            }
        });
        console.log(`[${adminCreated ? 'CREATED' : 'EXISTS'}] Admin user: ${adminUser.email} / password123`);

        // 2. Manager
        const [managerUser, managerCreated] = await db.User.findOrCreate({
            where: { email: 'manager@test.com' },
            defaults: {
                name: 'Manager Test',
                password: 'password123',
                role: ROLES.MANAGER,
                active: true
            }
        });
        console.log(`[${managerCreated ? 'CREATED' : 'EXISTS'}] Manager user: ${managerUser.email} / password123`);

        // 3. Employee
        const [employeeUser, employeeCreated] = await db.User.findOrCreate({
            where: { email: 'employee@test.com' },
            defaults: {
                name: 'Employee Test',
                password: 'password123',
                role: ROLES.EMPLOYEE,
                active: true
            }
        });
        console.log(`[${employeeCreated ? 'CREATED' : 'EXISTS'}] Employee user: ${employeeUser.email} / password123`);

        // 4. Client
        const [clientUser, clientCreated] = await db.User.findOrCreate({
            where: { email: 'client@test.com' },
            defaults: {
                name: 'Client Test',
                password: 'password123',
                role: ROLES.CLIENT,
                active: true
            }
        });
        console.log(`[${clientCreated ? 'CREATED' : 'EXISTS'}] Client user: ${clientUser.email} / password123`);

        console.log('\nAll test users have been injected successfully!');

    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        await db.sequelize.close();
    }
}

seedUsers();
