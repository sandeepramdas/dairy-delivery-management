const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// All report routes are accessible by admin and manager
router.use(authorizeRoles('admin', 'manager'));

// Reports
router.get('/aging', reportController.getAgingReport);
router.get('/financial', reportController.getFinancialSummary);
router.get('/deliveries', reportController.getDeliveryReports);
router.get('/customers', reportController.getCustomerAnalytics);
router.get('/dashboard', reportController.getDashboardSummary);

module.exports = router;
