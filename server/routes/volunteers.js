const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getVolunteerById,
  updateAvailability,
  updateSkills,
  updateRadius,
} = require('../controllers/volunteersController');

router.get('/:id', protect, getVolunteerById);
router.patch('/:id/availability', protect, updateAvailability);
router.patch('/:id/skills', protect, updateSkills);
router.patch('/:id/radius', protect, updateRadius);

module.exports = router;
