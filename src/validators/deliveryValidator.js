const { body, query } = require('express-validator');

const createDeliveryValidator = [
  body('customer_id').isUUID().withMessage('Valid customer ID is required'),
  body('product_id').isUUID().withMessage('Valid product ID is required'),
  body('subscription_plan_id').optional().isUUID().withMessage('Valid subscription plan ID is required'),
  body('scheduled_date').isISO8601().withMessage('Valid scheduled date is required'),
  body('scheduled_quantity').isDecimal().withMessage('Valid quantity is required'),
];

const updateDeliveryValidator = [
  body('scheduled_quantity').optional().isDecimal().withMessage('Valid quantity is required'),
  body('delivered_quantity').optional().isDecimal().withMessage('Valid delivered quantity is required'),
  body('delivery_status')
    .optional()
    .isIn(['scheduled', 'out_for_delivery', 'delivered', 'missed', 'cancelled'])
    .withMessage('Invalid delivery status'),
];

const completeDeliveryValidator = [
  body('delivered_quantity').isDecimal().withMessage('Valid delivered quantity is required'),
  body('delivery_notes').optional(),
];

const reportExceptionValidator = [
  body('exception_type')
    .isIn(['customer_unavailable', 'wrong_address', 'quantity_issue', 'payment_issue', 'other'])
    .withMessage('Invalid exception type'),
  body('exception_notes').notEmpty().withMessage('Exception notes are required'),
];

const calendarViewValidator = [
  query('year').notEmpty().isInt({ min: 2020, max: 2100 }).withMessage('Valid year is required'),
  query('month').notEmpty().isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
  query('area_id').optional().isUUID().withMessage('Valid area ID is required'),
];

module.exports = {
  createDeliveryValidator,
  updateDeliveryValidator,
  completeDeliveryValidator,
  reportExceptionValidator,
  calendarViewValidator,
};
