const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { shabbatGuard } = require('../middleware/shabbatGuard');
const {
  createRequest, getRequests, getMyRequests, getRequestById, updateRequest, deleteRequest, lockRequest, confirmRequest, getNearbyRequests, rateRequest,
} = require('../controllers/requestsController');

router.post('/', protect, shabbatGuard, createRequest);
router.get('/', protect, getRequests);
router.get('/my', protect, getMyRequests);
router.get('/nearby', protect, getNearbyRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id', protect, updateRequest);
router.delete('/:id', protect, deleteRequest);
router.post('/:id/lock', protect, lockRequest);
router.post('/:id/confirm', protect, confirmRequest);
router.post('/:id/rate', protect, rateRequest);

module.exports = router;
