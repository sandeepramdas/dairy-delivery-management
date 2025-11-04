const { body } = require('express-validator');

const createSubscriptionValidator = [
  body('customer_id').isUUID().withMessage('Valid customer ID is required'),
  body('product_id').isUUID().withMessage('Valid product ID is required'),
  body('plan_name').notEmpty().withMessage('Plan name is required'),
  body('plan_type').isIn(['daily', 'weekly', 'custom']).withMessage('Plan type must be daily, weekly, or custom'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').optional().isISO8601().withMessage('Valid end date is required'),
  body('schedule').isArray({ min: 1 }).withMessage('Schedule must be a non-empty array'),
  body('schedule.*.quantity').isDecimal().withMessage('Valid quantity is required'),
];

const updateSubscriptionValidator = [
  body('plan_name').optional().notEmpty().withMessage('Plan name cannot be empty'),
  body('status').optional().isIn(['active', 'paused', 'cancelled', 'completed']).withMessage('Invalid status'),
  body('end_date').optional().isISO8601().withMessage('Valid end date is required'),
];

const updateScheduleValidator = [
  body('schedule').isArray({ min: 1 }).withMessage('Schedule must be a non-empty array'),
  body('schedule.*.quantity').isDecimal().withMessage('Valid quantity is required'),
];

module.exports = {
  createSubscriptionValidator,
  updateSubscriptionValidator,
  updateScheduleValidator,
};
