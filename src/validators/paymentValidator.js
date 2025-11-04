const { body } = require('express-validator');

const createPaymentValidator = [
  body('customer_id').isUUID().withMessage('Valid customer ID is required'),
  body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid amount is required'),
  body('payment_date').optional().isISO8601().withMessage('Valid payment date is required'),
  body('payment_method')
    .isIn(['cash', 'upi', 'card', 'bank_transfer', 'cheque'])
    .withMessage('Invalid payment method'),
  body('transaction_reference').optional(),
  body('notes').optional(),
];

const updatePaymentValidator = [
  body('payment_status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),
  body('transaction_reference').optional(),
  body('notes').optional(),
];

module.exports = {
  createPaymentValidator,
  updatePaymentValidator,
};
