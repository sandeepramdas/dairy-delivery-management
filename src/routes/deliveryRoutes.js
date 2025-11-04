const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');
const {
  createDeliveryValidator,
  updateDeliveryValidator,
  completeDeliveryValidator,
  reportExceptionValidator,
  calendarViewValidator,
} = require('../validators/deliveryValidator');

// All routes require authentication
router.use(authenticateToken);

// Delivery CRUD
router.post('/', authorizeRoles('admin', 'manager'), createDeliveryValidator, validate, deliveryController.createDelivery);
router.get('/', deliveryController.getAllDeliveries);
router.get('/today', deliveryController.getTodayDeliveries);
router.get('/calendar', calendarViewValidator, validate, deliveryController.getCalendarView);
router.get('/date/:date', deliveryController.getDeliveriesByDate);
router.get('/:id', deliveryController.getDeliveryById);
router.put('/:id', authorizeRoles('admin', 'manager', 'delivery_person'), updateDeliveryValidator, validate, deliveryController.updateDelivery);
router.delete('/:id', authorizeRoles('admin'), deliveryController.deleteDelivery);

// Delivery actions
router.post('/:id/complete', authorizeRoles('admin', 'manager', 'delivery_person'), completeDeliveryValidator, validate, deliveryController.completeDelivery);
router.post('/:id/missed', authorizeRoles('admin', 'manager', 'delivery_person'), deliveryController.markMissed);

// Delivery exceptions
router.post('/:id/exceptions', authorizeRoles('admin', 'manager', 'delivery_person'), reportExceptionValidator, validate, deliveryController.reportException);
router.get('/:id/exceptions', deliveryController.getExceptions);

module.exports = router;
