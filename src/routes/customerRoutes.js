const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');
const {
  createCustomerValidator,
  updateCustomerValidator,
  getCustomersValidator,
} = require('../validators/customerValidator');

// All routes require authentication
router.use(authenticateToken);

// Customer CRUD
router.post('/', authorizeRoles('admin', 'manager'), createCustomerValidator, validate, customerController.createCustomer);
router.get('/', getCustomersValidator, validate, customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', authorizeRoles('admin', 'manager'), updateCustomerValidator, validate, customerController.updateCustomer);
router.delete('/:id', authorizeRoles('admin'), customerController.deleteCustomer);

// Customer related data
router.get('/:id/subscriptions', customerController.getCustomerSubscriptions);
router.get('/:id/payments', customerController.getCustomerPayments);
router.get('/:id/invoices', customerController.getCustomerInvoices);
router.get('/:id/outstanding', customerController.getCustomerOutstanding);

module.exports = router;
