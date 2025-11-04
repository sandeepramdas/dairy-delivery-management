const { body } = require('express-validator');

const createInvoiceValidator = [
  body('customer_id').isUUID().withMessage('Valid customer ID is required'),
  body('billing_period_start').isISO8601().withMessage('Valid billing period start is required'),
  body('billing_period_end').isISO8601().withMessage('Valid billing period end is required'),
  body('line_items').isArray({ min: 1 }).withMessage('Line items must be a non-empty array'),
  body('line_items.*.product_id').isUUID().withMessage('Valid product ID is required'),
  body('line_items.*.description').notEmpty().withMessage('Description is required'),
  body('line_items.*.quantity').isDecimal().withMessage('Valid quantity is required'),
  body('line_items.*.unit_price').isDecimal().withMessage('Valid unit price is required'),
  body('tax_amount').optional().isDecimal().withMessage('Valid tax amount is required'),
  body('discount_amount').optional().isDecimal().withMessage('Valid discount amount is required'),
  body('due_date').isISO8601().withMessage('Valid due date is required'),
];

const generateInvoiceValidator = [
  body('customer_id').isUUID().withMessage('Valid customer ID is required'),
  body('billing_period_start').isISO8601().withMessage('Valid billing period start is required'),
  body('billing_period_end').isISO8601().withMessage('Valid billing period end is required'),
  body('tax_amount').optional().isDecimal().withMessage('Valid tax amount is required'),
  body('discount_amount').optional().isDecimal().withMessage('Valid discount amount is required'),
  body('due_date').isISO8601().withMessage('Valid due date is required'),
];

const updateInvoiceValidator = [
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'partially_paid', 'paid', 'overdue'])
    .withMessage('Invalid status'),
  body('tax_amount').optional().isDecimal().withMessage('Valid tax amount is required'),
  body('discount_amount').optional().isDecimal().withMessage('Valid discount amount is required'),
  body('due_date').optional().isISO8601().withMessage('Valid due date is required'),
];

module.exports = {
  createInvoiceValidator,
  generateInvoiceValidator,
  updateInvoiceValidator,
};
