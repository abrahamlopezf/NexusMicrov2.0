const sequelize = require('./src/config/database');
const Account = require('./src/models/Account.model');

async function seedAccounts() {
    try {
        await sequelize.authenticate();
        console.log('Conectado a la BD para crear cuentas...');

        const [caja, createdCaja] = await Account.findOrCreate({ 
            where: { name: 'Caja Principal' }, 
            defaults: { type: 'CAJA', balance: 0 } 
        });
        
        const [banco, createdBanco] = await Account.findOrCreate({ 
            where: { name: 'Cuenta Bancaria' }, 
            defaults: { type: 'BANCO', balance: 0 } 
        });

        console.log('Caja Principal:', createdCaja ? 'CREADA' : 'YA EXISTIA', '(ID:', caja.id, ')');
        console.log('Cuenta Bancaria:', createdBanco ? 'CREADA' : 'YA EXISTIA', '(ID:', banco.id, ')');
        
        process.exit(0);
    } catch (err) {
        console.error('Error creando cuentas:', err);
        process.exit(1);
    }
}

seedAccounts();
