const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validator');
const {
  createSubscriptionValidator,
  updateSubscriptionValidator,
  updateScheduleValidator,
} = require('../validators/subscriptionValidator');

// All routes require authentication
router.use(authenticateToken);

// Subscription CRUD
router.post('/', authorizeRoles('admin', 'manager'), createSubscriptionValidator, validate, subscriptionController.createSubscription);
router.get('/', subscriptionController.getAllSubscriptions);
router.get('/:id', subscriptionController.getSubscriptionById);
router.put('/:id', authorizeRoles('admin', 'manager'), updateSubscriptionValidator, validate, subscriptionController.updateSubscription);
router.put('/:id/schedule', authorizeRoles('admin', 'manager'), updateScheduleValidator, validate, subscriptionController.updateSchedule);
router.delete('/:id', authorizeRoles('admin'), subscriptionController.deleteSubscription);

// Subscription actions
router.post('/:id/pause', authorizeRoles('admin', 'manager'), subscriptionController.pauseSubscription);
router.post('/:id/resume', authorizeRoles('admin', 'manager'), subscriptionController.resumeSubscription);
router.post('/:id/cancel', authorizeRoles('admin', 'manager'), subscriptionController.cancelSubscription);

module.exports = router;
