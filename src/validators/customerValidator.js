const { body, query } = require('express-validator');

const createCustomerValidator = [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('area_id').isUUID().withMessage('Valid area ID is required'),
  body('address_line1').notEmpty().withMessage('Address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('pincode').notEmpty().withMessage('Pincode is required'),
  body('latitude').optional().isDecimal().withMessage('Valid latitude is required'),
  body('longitude').optional().isDecimal().withMessage('Valid longitude is required'),
];

const updateCustomerValidator = [
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('area_id').optional().isUUID().withMessage('Valid area ID is required'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  body('latitude').optional().isDecimal().withMessage('Valid latitude is required'),
  body('longitude').optional().isDecimal().withMessage('Valid longitude is required'),
];

const getCustomersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  query('area_id').optional().isUUID().withMessage('Valid area ID is required'),
];

module.exports = {
  createCustomerValidator,
  updateCustomerValidator,
  getCustomersValidator,
};
