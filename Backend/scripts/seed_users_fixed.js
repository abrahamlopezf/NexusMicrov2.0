const db = require('../src/models');
const bcrypt = require('bcryptjs');

async function seedUsers() {
    try {
        await db.sequelize.authenticate();
        console.log('Database connection established.');

        // The DB enum for user_role is: ["ADMIN", "MANAGER", "EMPLOYEE"]
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

        // 2. Manager
        const [managerUser, managerCreated] = await db.User.findOrCreate({
            where: { email: 'manager@test.com' },
            defaults: {
                name: 'Manager Test',
                password: hashedPassword,
                role: 'MANAGER',
                active: true
            }
        });
        console.log(`[${managerCreated ? 'CREATED' : 'EXISTS'}] Manager: ${managerUser.email} / password123`);

        // 3. Employee
        const [employeeUser, employeeCreated] = await db.User.findOrCreate({
            where: { email: 'employee@test.com' },
            defaults: {
                name: 'Employee Test',
                password: hashedPassword,
                role: 'EMPLOYEE',
                active: true
            }
        });
        console.log(`[${employeeCreated ? 'CREATED' : 'EXISTS'}] Employee: ${employeeUser.email} / password123`);

        console.log('\nAll test users have been injected successfully!');

    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        await db.sequelize.close();
    }
}

seedUsers();
