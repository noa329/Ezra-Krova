const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  saveSubscription,
  removeSubscription,
  getVapidPublicKey,
} = require('../controllers/notificationsController');

router.get('/vapid-public-key', protect, getVapidPublicKey);
router.post('/subscribe', protect, saveSubscription);
router.post('/unsubscribe', protect, removeSubscription);

module.exports = router;
