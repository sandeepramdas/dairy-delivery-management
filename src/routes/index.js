const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const areaRoutes = require('./areaRoutes');
const productRoutes = require('./productRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const paymentRoutes = require('./paymentRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const reportRoutes = require('./reportRoutes');

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use(`/api/${API_VERSION}/auth`, authRoutes);
router.use(`/api/${API_VERSION}/customers`, customerRoutes);
router.use(`/api/${API_VERSION}/areas`, areaRoutes);
router.use(`/api/${API_VERSION}/products`, productRoutes);
router.use(`/api/${API_VERSION}/subscriptions`, subscriptionRoutes);
router.use(`/api/${API_VERSION}/deliveries`, deliveryRoutes);
router.use(`/api/${API_VERSION}/payments`, paymentRoutes);
router.use(`/api/${API_VERSION}/invoices`, invoiceRoutes);
router.use(`/api/${API_VERSION}/reports`, reportRoutes);

module.exports = router;
