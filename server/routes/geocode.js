const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { searchAddress, reverseGeocode } = require('../controllers/geocodeController');

router.get('/search', protect, searchAddress);
router.get('/reverse', protect, reverseGeocode);

module.exports = router;
