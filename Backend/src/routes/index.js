const express = require('express');
const router = express.Router();

// Import all routes
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const usersRoutes = require('./userRoutes');
const customersRoutes = require('./customerRoutes');
const suppliersRoutes = require('./supplierRoutes');
const productsRoutes = require('./productRoutes');
const categoriesRoutes = require('./categorieRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const salesRoutes = require('./saleRoutes');
const purchasesRoutes = require('./purchaseRoutes');
const workordersRoutes = require('./workorderRoutes');
const productionRoutes = require('./productionRoutes');
const tasksRoutes = require('./tasksRoutes');
const paymentsRoutes = require('./paymentsRoutes');
const reportsRoutes = require('./reportRoutes');
const healthRoutes = require('./healthRoutes');
const systemRoutes = require('./systemRoutes');
const jobRoutes = require('./jobRoutes');
const pricingRoutes = require('./pricingRoutes');
const quoteRoutes = require('./quoteRoutes');

// Register routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/customers', customersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', salesRoutes);
router.use('/purchases', purchasesRoutes);
router.use('/workorders', workordersRoutes);
router.use('/production', productionRoutes);
router.use('/tasks', tasksRoutes);
router.use('/payments', paymentsRoutes);
router.use('/reports', reportsRoutes);
router.use('/health', healthRoutes);
router.use('/system', systemRoutes);
router.use('/jobs', jobRoutes);
router.use('/pricing', pricingRoutes);
router.use('/quotes', quoteRoutes);

// Export main router
module.exports = router;