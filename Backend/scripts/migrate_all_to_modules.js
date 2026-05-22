const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const modulesDir = path.join(srcDir, 'modules');

if (!fs.existsSync(modulesDir)) fs.mkdirSync(modulesDir);

// Mapping of domains
const domains = {
    auth: { controllers: ['authController.js'], routes: ['authRoutes.js'], services: ['AuthService.js'] },
    dashboard: { controllers: ['DashboardController.js'], routes: ['dashboardRoutes.js'], services: ['DashboardService.js'] },
    clients: { controllers: ['clientController.js'], routes: ['customerRoutes.js'], services: ['ClientService.js'], models: ['Client.model.js'] },
    suppliers: { controllers: ['supplierController.js'], routes: ['supplierRoutes.js'], services: ['SupplierService.js'], models: ['Supplier.model.js'] },
    products: { controllers: ['productController.js'], routes: ['productRoutes.js'], services: ['ProductService.js'], models: ['Product.model.js', 'ProductCostConfig.model.js', 'ProductMaterial.model.js'] },
    categories: { controllers: ['categoryController.js'], routes: ['categorieRoutes.js'], services: ['CategoryService.js'] },
    inventory: { controllers: ['inventoryController.js'], routes: ['inventoryRoutes.js'], services: ['InventoryService.js'], models: ['InventoryMovement.model.js', 'InventoryReservation.model.js'] },
    materials: { controllers: ['materialController.js'], routes: ['materialRoutes.js'], services: ['MaterialService.js'], models: ['Material.model.js'] },
    sales: { controllers: ['saleController.js'], routes: ['saleRoutes.js'], services: ['SaleService.js', 'SaleOrchestrator.js'], models: ['Sale.model.js', 'SaleItem.model.js'] },
    purchases: { controllers: ['purchaseController.js'], routes: ['purchaseRoutes.js'], services: ['PurchaseService.js', 'PurchasingService.js'], models: ['PurchaseOrder.model.js', 'PurchaseItem.model.js'] },
    workorders: { controllers: ['workOrderController.js'], routes: ['workorderRoutes.js'], services: ['WorkOrderService.js'], models: ['WorkOrder.model.js'] },
    production: { controllers: ['productionController.js'], routes: ['productionRoutes.js'], services: ['ProductionService.js'], models: ['ProductionTask.model.js'] },
    tasks: { controllers: ['taskController.js'], routes: ['tasksRoutes.js'], services: ['TaskService.js'] },
    payments: { controllers: ['paymentController.js'], routes: ['paymentsRoutes.js'], services: ['PaymentService.js'], models: ['Payment.model.js'] },
    reports: { controllers: ['reportController.js'], routes: ['reportRoutes.js'], services: ['ReportService.js'] },
    health: { controllers: ['healthController.js'], routes: ['healthRoutes.js'], services: ['HealthService.js'] },
    system: { controllers: ['systemController.js'], routes: ['systemRoutes.js'], models: ['GlobalSetting.model.js', 'FeatureFlag.model.js'] },
    jobs: { controllers: ['jobController.js'], routes: ['jobRoutes.js'], models: ['Job.model.js'] },
    pricing: { controllers: ['pricingController.js'], routes: ['pricingRoutes.js'] },
    quotes: { controllers: ['QuoteController.js'], routes: ['quoteRoutes.js'], services: ['QuoteService.js'], models: ['Quote.model.js', 'QuoteItem.model.js'] },
    accounts: { controllers: ['accountController.js'], models: ['Account.model.js'] },
    employees: { controllers: ['employeeController.js'], services: ['EmployeeService.js', 'PayrollService.js'], models: ['Employee.model.js', 'PayrollAdvance.model.js'] },
    finance: { services: ['FinanceService.js', 'LedgerService.js'], models: ['FinancialMovement.model.js', 'LedgerEntry.model.js'] },
};

// Also we need to keep track of file new paths to rewrite requires
const fileRegistry = {}; // filename -> new relative path from src/

function registerAndMove() {
    for (const [domain, types] of Object.entries(domains)) {
        const domainPath = path.join(modulesDir, domain);
        if (!fs.existsSync(domainPath)) fs.mkdirSync(domainPath);

        for (const [type, files] of Object.entries(types)) {
            const oldTypeDir = path.join(srcDir, type);
            files.forEach(file => {
                const oldPath = path.join(oldTypeDir, file);
                if (fs.existsSync(oldPath)) {
                    // New name formatting
                    let newName = file;
                    // For simplicity, we keep original names to avoid breaking deep dependencies
                    const newPath = path.join(domainPath, newName);
                    fs.renameSync(oldPath, newPath);
                    
                    fileRegistry[file] = `modules/${domain}/${newName}`;
                    console.log(`Moved ${file} to modules/${domain}/`);
                }
            });
        }
    }
}

// Helper to replace paths in a file
function replaceRequiresInFile(filePath, depthFromSrc) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // We look for requires like require('../models/User.model') or require('../../services/AuthService')
    const requireRegex = /require\(['"](\.\.\/[^'"]+)['"]\)/g;
    
    content = content.replace(requireRegex, (match, p1) => {
        // Resolve the require path relative to current file's OLD context vs NEW context?
        // Actually, it's easier to just find the basename of the required file
        const targetBaseName = path.basename(p1);
        
        // Let's check if the target was moved
        // Because of extensions omitted in require, we match without .js
        const matchedKey = Object.keys(fileRegistry).find(k => k.replace('.js', '') === targetBaseName.replace('.js', ''));
        
        if (matchedKey) {
            // It was moved! Calculate new relative path
            const targetNewPathFromSrc = fileRegistry[matchedKey];
            
            // If current file is in src/modules/domain/ file.js, depth is 2
            let backSteps = '../'.repeat(depthFromSrc);
            if (backSteps === '') backSteps = './'; // if depth 0 (in src/)
            
            let newRequirePath = backSteps + targetNewPathFromSrc;
            
            // Remove .js extension for standard require
            newRequirePath = newRequirePath.replace('.js', '');
            
            // Ensure starts with ./ or ../
            if (!newRequirePath.startsWith('.')) newRequirePath = './' + newRequirePath;
            
            changed = true;
            return `require('${newRequirePath}')`;
        }
        
        // If not moved (e.g. ../middlewares/auth), we just adjust depth
        // This is complex. If depth changed, we add an extra '../'
        // For files moved from src/controllers to src/modules/domain, depth changes from 1 to 2.
        // So a require to '../middlewares/auth' must become '../../middlewares/auth'
        if (depthFromSrc > 1 && p1.startsWith('../')) {
            const extraSteps = depthFromSrc - 1;
            const newP = '../'.repeat(extraSteps) + p1.substring(3);
            changed = true;
            return `require('${newP}')`;
        }

        return match;
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

// Process all files in modules
function updateAllRequires() {
    const processDir = (dir, depth) => {
        const files = fs.readdirSync(dir);
        files.forEach(f => {
            const fPath = path.join(dir, f);
            if (fs.statSync(fPath).isDirectory()) {
                processDir(fPath, depth + 1);
            } else if (f.endsWith('.js')) {
                replaceRequiresInFile(fPath, depth);
            }
        });
    };
    
    // Process modules (depth 2: src/modules/domain)
    processDir(modulesDir, 2);
    
    // Process routes/index.js (depth 1: src/routes/)
    if (fs.existsSync(path.join(srcDir, 'routes/index.js'))) {
        replaceRequiresInFile(path.join(srcDir, 'routes/index.js'), 1);
    }
}

try {
    console.log('Starting migration...');
    registerAndMove();
    console.log('Files moved. Updating requires...');
    updateAllRequires();
    console.log('Migration complete!');
} catch(e) {
    console.error('Error during migration:', e);
}
