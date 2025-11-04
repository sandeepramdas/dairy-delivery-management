const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');
const {
  createProductValidator,
  updateProductValidator,
} = require('../validators/productValidator');

// All routes require authentication
router.use(authenticateToken);

// Product CRUD
router.post('/', authorizeRoles('admin', 'manager'), createProductValidator, validate, productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', authorizeRoles('admin', 'manager'), updateProductValidator, validate, productController.updateProduct);
router.delete('/:id', authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;
