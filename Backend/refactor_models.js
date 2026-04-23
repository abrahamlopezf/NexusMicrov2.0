const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');
const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.model.js'));

const associations = {
  Client: [
    "models.Client.hasMany(models.Sale, { foreignKey: 'client_id', as: 'sales' });",
    "models.Client.hasMany(models.Quote, { foreignKey: 'client_id', as: 'quotes' });"
  ],
  Sale: [
    "models.Sale.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });",
    "models.Sale.hasMany(models.SaleItem, { foreignKey: 'sale_id', as: 'items' });",
    "models.Sale.hasOne(models.WorkOrder, { foreignKey: 'sale_id', as: 'work_order' });",
    "models.Sale.hasMany(models.Payment, { foreignKey: 'sale_id', as: 'payments' });"
  ],
  SaleItem: [
    "models.SaleItem.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });",
    "models.SaleItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });"
  ],
  Quote: [
    "models.Quote.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });",
    "models.Quote.hasMany(models.QuoteItem, { foreignKey: 'quote_id', as: 'items' });"
  ],
  QuoteItem: [
    "models.QuoteItem.belongsTo(models.Quote, { foreignKey: 'quote_id', as: 'quote' });",
    "models.QuoteItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });"
  ],
  Product: [
    "models.Product.hasMany(models.SaleItem, { foreignKey: 'product_id', as: 'sale_items' });",
    "models.Product.hasMany(models.QuoteItem, { foreignKey: 'product_id', as: 'quote_items' });",
    "models.Product.hasMany(models.ProductMaterial, { foreignKey: 'product_id', as: 'materials' });",
    "models.Product.hasMany(models.ProductionTask, { foreignKey: 'product_id', as: 'production_tasks' });"
  ],
  ProductMaterial: [
    "models.ProductMaterial.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });",
    "models.ProductMaterial.belongsTo(models.Material, { foreignKey: 'material_id', as: 'material' });"
  ],
  Material: [
    "models.Material.hasMany(models.ProductMaterial, { foreignKey: 'material_id', as: 'product_materials' });",
    "models.Material.hasMany(models.InventoryMovement, { foreignKey: 'material_id', as: 'inventory_movements' });",
    "models.Material.hasMany(models.PurchaseItem, { foreignKey: 'material_id', as: 'purchase_items' });"
  ],
  InventoryMovement: [
    "models.InventoryMovement.belongsTo(models.Material, { foreignKey: 'material_id', as: 'material' });"
  ],
  WorkOrder: [
    "models.WorkOrder.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });",
    "models.WorkOrder.hasMany(models.ProductionTask, { foreignKey: 'work_order_id', as: 'tasks' });"
  ],
  ProductionTask: [
    "models.ProductionTask.belongsTo(models.WorkOrder, { foreignKey: 'work_order_id', as: 'work_order' });",
    "models.ProductionTask.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });",
    "models.ProductionTask.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });"
  ],
  Employee: [
    "models.Employee.hasMany(models.ProductionTask, { foreignKey: 'employee_id', as: 'production_tasks' });"
  ],
  Supplier: [
    "models.Supplier.hasMany(models.PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchase_orders' });"
  ],
  PurchaseOrder: [
    "models.PurchaseOrder.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });",
    "models.PurchaseOrder.hasMany(models.PurchaseItem, { foreignKey: 'purchase_order_id', as: 'items' });"
  ],
  PurchaseItem: [
    "models.PurchaseItem.belongsTo(models.PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchase_order' });",
    "models.PurchaseItem.belongsTo(models.Material, { foreignKey: 'material_id', as: 'material' });"
  ],
  Account: [
    "models.Account.hasMany(models.FinancialMovement, { foreignKey: 'account_id', as: 'movements' });",
    "models.Account.hasMany(models.Payment, { foreignKey: 'account_id', as: 'payments' });"
  ],
  FinancialMovement: [
    "models.FinancialMovement.belongsTo(models.Account, { foreignKey: 'account_id', as: 'account' });"
  ],
  Payment: [
    "models.Payment.belongsTo(models.Sale, { foreignKey: 'sale_id', as: 'sale' });",
    "models.Payment.belongsTo(models.Account, { foreignKey: 'account_id', as: 'account' });"
  ],
  User: [
    "models.User.hasMany(models.AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });"
  ],
  AuditLog: [
    "models.AuditLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });"
  ]
};

for (const file of modelFiles) {
    const fullPath = path.join(modelsDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add soft deletes to Sale, Product, Client
    if (['Sale.model.js', 'Product.model.js', 'Client.model.js'].includes(file)) {
        if (!content.includes('paranoid: true')) {
            content = content.replace(/(timestamps:\s*false\s*})/g, '$1,\n    paranoid: true,\n    deleted_at: "deleted_at"');
            content = content.replace(/(timestamps:\s*true\s*})/g, '$1,\n    paranoid: true,\n    deleted_at: "deleted_at"');
            if (!content.includes('paranoid') && content.includes('tableName')) {
                content = content.replace(/(tableName:\s*["'][a-zA-Z_]+["'])/g, '$1,\n    paranoid: true,\n    deleted_at: "deleted_at"');
            }
        }
    }

    // Add indexes to InventoryMovement
    if (file === 'InventoryMovement.model.js') {
        if (!content.includes('indexes:')) {
            content = content.replace(/(tableName:\s*["'][a-zA-Z_]+["'])/g, `$1,\n    indexes: [\n      { fields: ['material_id'] },\n      { fields: ['reference_type', 'reference_id'] }\n    ]`);
        }
    }

    const modelName = file.replace('.model.js', '');
    const asc = associations[modelName];

    if (asc && !content.includes('.associate = ')) {
        const associateBlock = `\n${modelName}.associate = function(models) {\n    ${asc.join('\n    ')}\n};\n`;
        content = content.replace(`module.exports = ${modelName};`, `${associateBlock}\nmodule.exports = ${modelName};`);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}

// Rewrite index.js
const indexContent = `const sequelize = require("../config/database");
const fs = require('fs');
const path = require('path');
const db = {};

db.sequelize = sequelize;

// Read all model files in directory
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    db[model.name] = model;
  });

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
`;

fs.writeFileSync(path.join(modelsDir, 'index.js'), indexContent, 'utf8');
console.log('Updated index.js');
