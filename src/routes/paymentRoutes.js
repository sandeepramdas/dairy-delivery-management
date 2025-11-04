const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');
const {
  createPaymentValidator,
  updatePaymentValidator,
} = require('../validators/paymentValidator');

// All routes require authentication
router.use(authenticateToken);

// Payment CRUD
router.post('/', authorizeRoles('admin', 'manager', 'delivery_person'), createPaymentValidator, validate, paymentController.createPayment);
router.get('/', paymentController.getAllPayments);
router.get('/pending', paymentController.getPendingCollections);
router.get('/:id', paymentController.getPaymentById);
router.put('/:id', authorizeRoles('admin', 'manager'), updatePaymentValidator, validate, paymentController.updatePayment);
router.delete('/:id', authorizeRoles('admin'), paymentController.deletePayment);

module.exports = router;
