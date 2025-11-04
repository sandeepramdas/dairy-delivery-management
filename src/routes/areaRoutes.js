const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');
const {
  createAreaValidator,
  updateAreaValidator,
  assignPersonnelValidator,
} = require('../validators/areaValidator');

// All routes require authentication
router.use(authenticateToken);

// Area CRUD
router.post('/', authorizeRoles('admin', 'manager'), createAreaValidator, validate, areaController.createArea);
router.get('/', areaController.getAllAreas);
router.get('/:id', areaController.getAreaById);
router.put('/:id', authorizeRoles('admin', 'manager'), updateAreaValidator, validate, areaController.updateArea);
router.delete('/:id', authorizeRoles('admin'), areaController.deleteArea);

// Area related data
router.get('/:id/customers', areaController.getAreaCustomers);
router.get('/:id/personnel', areaController.getAreaPersonnel);
router.post('/:id/personnel', authorizeRoles('admin', 'manager'), assignPersonnelValidator, validate, areaController.assignPersonnel);
router.delete('/:id/personnel/:assignment_id', authorizeRoles('admin', 'manager'), areaController.removePersonnel);

module.exports = router;
