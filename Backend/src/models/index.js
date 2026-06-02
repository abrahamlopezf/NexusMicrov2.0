const sequelize = require("../config/database");
const fs = require('fs');
const path = require('path');
const db = {};

// Cargar dinámicamente todos los modelos usando el sufijo .model.js
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.endsWith('.model.js'));
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
  });

// Cargar dinámicamente desde módulos
const modulesPath = path.join(__dirname, '../modules');
if (fs.existsSync(modulesPath)) {
    fs.readdirSync(modulesPath).forEach(moduleDir => {
        const modulePath = path.join(modulesPath, moduleDir);
        if (fs.statSync(modulePath).isDirectory()) {
            fs.readdirSync(modulePath)
              .filter(file => file.endsWith('.model.js'))
              .forEach(file => {
                  const model = require(path.join(modulePath, file));
                  db[model.name] = model;
              });
        }
    });
}

// Configurar asociaciones (relaciones Enterprise)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

// Global Audit Hooks para trazabilidad de DB
const createAuditLog = async (instance, options, action) => {
    try {
        if (!db.AuditLog || instance.constructor.name === 'AuditLog') return;
        
        await db.AuditLog.create({
            user_id: options.userId || null,
            action: action,
            table_name: instance.constructor.tableName,
            record_id: instance.id,
            old_values: action === 'UPDATE' || action === 'DELETE' ? instance._previousDataValues : null,
            new_values: action === 'CREATE' || action === 'UPDATE' ? instance.dataValues : null,
            ip_address: options.ipAddress || null,
            user_agent: options.userAgent || null,
            correlation_id: options.correlationId || null,
            endpoint: options.endpoint || null
        }, { transaction: options.transaction });
    } catch(e) {
        console.error(`Audit log falló al registrar evento [${action}] en [${instance.constructor.tableName}]: ${e.message}`);
    }
};

sequelize.addHook('afterCreate', (instance, options) => createAuditLog(instance, options, 'CREATE'));
sequelize.addHook('afterUpdate', (instance, options) => createAuditLog(instance, options, 'UPDATE'));
sequelize.addHook('afterDestroy', (instance, options) => createAuditLog(instance, options, 'DELETE'));

module.exports = db;
