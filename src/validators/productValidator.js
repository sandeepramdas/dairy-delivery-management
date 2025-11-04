const { body } = require('express-validator');

const createProductValidator = [
  body('product_name').notEmpty().withMessage('Product name is required'),
  body('product_code').notEmpty().withMessage('Product code is required'),
  body('unit').isIn(['L', 'mL', 'kg', 'g', 'pieces', 'dozen', 'pack']).withMessage('Unit must be L, mL, kg, g, pieces, dozen, or pack'),
  body('price_per_unit').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid price is required'),
  body('description').optional(),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
];

const updateProductValidator = [
  body('product_name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('product_code').optional().notEmpty().withMessage('Product code cannot be empty'),
  body('unit').optional().isIn(['L', 'mL', 'kg', 'g', 'pieces', 'dozen', 'pack']).withMessage('Unit must be L, mL, kg, g, pieces, dozen, or pack'),
  body('price_per_unit').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Valid price is required'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
];

module.exports = {
  createProductValidator,
  updateProductValidator,
};
