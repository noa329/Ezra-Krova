const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { shabbatGuard } = require('../middleware/shabbatGuard');
const {
  createRequest, getRequests, getMyRequests, getMatchedRequests, getRequestById, updateRequest,
  deleteRequest, lockRequest, confirmRequest, getNearbyRequests, rateRequest, disputeRequest,
  resolveDispute, getAllRequestsAdmin, adminUpdateStatus,
} = require('../controllers/requestsController');

router.post('/', protect, shabbatGuard, createRequest);
router.get('/', protect, getRequests);
router.get('/admin/all', protect, adminOnly, getAllRequestsAdmin);
router.get('/my', protect, getMyRequests);
router.get('/nearby', protect, getNearbyRequests);
router.get('/matches', protect, getMatchedRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id', protect, updateRequest);
router.delete('/:id', protect, deleteRequest);
router.post('/:id/lock', protect, lockRequest);
router.post('/:id/volunteer', protect, lockRequest);
router.post('/:id/confirm', protect, confirmRequest);
router.post('/:id/rate', protect, rateRequest);
router.post('/:id/dispute', protect, disputeRequest);
router.post('/:id/resolve-dispute', protect, adminOnly, resolveDispute);
router.put('/:id/status', protect, adminOnly, adminUpdateStatus);

module.exports = router;
