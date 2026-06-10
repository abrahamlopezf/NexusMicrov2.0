const express = require('express');
const router = express.Router();

// Import all routes
const productionWorkflowRoutes = require('../modules/production/productionWorkflow.routes');
const authRoutes = require('../modules/auth/authRoutes');
const dashboardRoutes = require('../modules/dashboard/dashboardRoutes');
const usersRoutes = require('../modules/users/user.routes');
const customersRoutes = require('../modules/clients/customerRoutes');
const suppliersRoutes = require('../modules/suppliers/supplierRoutes');
const productsRoutes = require('../modules/products/productRoutes');
const categoriesRoutes = require('../modules/categories/categorieRoutes');
const inventoryRoutes = require('../modules/inventory/inventoryRoutes');
const materialRoutes = require('../modules/materials/materialRoutes');
const salesRoutes = require('../modules/sales/saleRoutes');
const cashRoutes = require('../modules/cash/cashRoutes');
const purchaseRoutes = require('../modules/purchases/purchaseRoutes');
const workordersRoutes = require('../modules/workorders/workorderRoutes');
const productionRoutes = require('../modules/production/productionRoutes');
const tasksRoutes = require('../modules/tasks/tasksRoutes');
const paymentsRoutes = require('../modules/payments/paymentsRoutes');
const reportsRoutes = require('../modules/reports/reportRoutes');
const healthRoutes = require('../modules/health/healthRoutes');
const systemRoutes = require('../modules/system/systemRoutes');
const jobRoutes = require('../modules/jobs/jobRoutes');
const pricingRoutes = require('../modules/pricing/pricingRoutes');
const quoteRoutes = require('../modules/quotes/quoteRoutes');

// Register routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/customers', customersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/materials', materialRoutes);
router.use('/sales', salesRoutes);
router.use('/cash', cashRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/workorders', workordersRoutes);
router.use('/production', productionRoutes);
router.use('/production/workflow', productionWorkflowRoutes);
router.use('/tasks', tasksRoutes);
router.use('/payments', paymentsRoutes);
router.use('/reports', reportsRoutes);
router.use('/health', healthRoutes);
router.use('/system', systemRoutes);
router.use('/jobs', jobRoutes);
router.use('/pricing', pricingRoutes);
router.use('/quotes', quoteRoutes);
// router.use('/finance', financeRoutes);

// Export main router
module.exports = router;