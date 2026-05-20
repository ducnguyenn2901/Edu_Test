const express = require('express');
const router = express.Router();
const { getStats, exportAttempts } = require('../controllers/adminController');
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), getStats);
router.get(
  '/attempts/export',
  protect,
  authorize('admin'),
  exportAttempts,
);
router.get('/settings', protect, authorize('admin'), getSettings);
router.put('/settings', protect, authorize('admin'), updateSettings);

module.exports = router;
