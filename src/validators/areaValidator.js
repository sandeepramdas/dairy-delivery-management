const { body, query } = require('express-validator');

const createAreaValidator = [
  body('name').notEmpty().withMessage('Area name is required'),
  body('code').notEmpty().withMessage('Area code is required'),
  body('description').optional(),
];

const updateAreaValidator = [
  body('name').optional().notEmpty().withMessage('Area name cannot be empty'),
  body('code').optional().notEmpty().withMessage('Area code cannot be empty'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
];

const assignPersonnelValidator = [
  body('user_id').isUUID().withMessage('Valid user ID is required'),
  body('assigned_date').optional().isISO8601().withMessage('Valid date is required'),
];

module.exports = {
  createAreaValidator,
  updateAreaValidator,
  assignPersonnelValidator,
};
