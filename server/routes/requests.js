const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { shabbatGuard } = require('../middleware/shabbatGuard');
const {
  createRequest, getRequests, getMyRequests, getRequestById, updateRequest, deleteRequest,
} = require('../controllers/requestsController');

router.post('/', protect, shabbatGuard, createRequest);
router.get('/', protect, getRequests);
router.get('/my', protect, getMyRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id', protect, updateRequest);
router.delete('/:id', protect, deleteRequest);

module.exports = router;
