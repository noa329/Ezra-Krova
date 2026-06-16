const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../config/multer');
const { getMe, updateMe, uploadImage, getAllUsers, deleteUser } = require('../controllers/usersController');

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/me/image', protect, upload.single('image'), uploadImage);
router.get('/', protect, adminOnly, getAllUsers);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
