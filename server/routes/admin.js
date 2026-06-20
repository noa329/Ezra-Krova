const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { getStats, exportData } = require('../controllers/adminController');

router.get('/stats', protect, adminOnly, getStats);
router.get('/export', protect, adminOnly, exportData);

module.exports = router;
