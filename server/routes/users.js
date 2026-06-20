const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const { getMe, updateMe, uploadImage, getAllUsers, deleteUser } = require('../controllers/usersController');

const requireCloudinary = (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({ message: 'שירות העלאת תמונות אינו זמין. פנה למנהל המערכת.' });
  }
  next();
};

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/me/image', protect, requireCloudinary, upload.single('profileImage'), uploadImage);
router.get('/', protect, adminOnly, getAllUsers);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
