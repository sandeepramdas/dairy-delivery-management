const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');
const {
  createInvoiceValidator,
  generateInvoiceValidator,
  updateInvoiceValidator,
} = require('../validators/invoiceValidator');

// All routes require authentication
router.use(authenticateToken);

// Invoice CRUD
router.post('/', authorizeRoles('admin', 'manager'), createInvoiceValidator, validate, invoiceController.createInvoice);
router.post('/generate', authorizeRoles('admin', 'manager'), generateInvoiceValidator, validate, invoiceController.generateInvoiceFromDeliveries);
router.get('/', invoiceController.getAllInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', authorizeRoles('admin', 'manager'), updateInvoiceValidator, validate, invoiceController.updateInvoice);
router.delete('/:id', authorizeRoles('admin'), invoiceController.deleteInvoice);

module.exports = router;
