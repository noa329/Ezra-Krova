const User = require('../models/User');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const { deleteCloudinaryImage } = require('../services/cloudinaryUpload');

const getMe = async (req, res) => {
  res.json(req.user);
};

const updateMe = async (req, res) => {
  try {
    const { name, location, volunteerProfile } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (location) updates.location = location;
    if (volunteerProfile) {
      if (volunteerProfile.capabilities !== undefined) {
        updates['volunteerProfile.capabilities'] = volunteerProfile.capabilities;
      }
      if (volunteerProfile.radius !== undefined) {
        updates['volunteerProfile.radius'] = volunteerProfile.radius;
      }
      if (volunteerProfile.isAvailable !== undefined) {
        updates['volunteerProfile.isAvailable'] = volunteerProfile.isAvailable;
      }
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ message: 'שירות העלאת תמונות אינו זמין. פנה למנהל המערכת.' });
    }
    if (!req.file) return res.status(400).json({ message: 'לא הועלתה תמונה' });
    const existing = await User.findById(req.user._id).select('profileImage');
    if (existing?.profileImage) {
      await deleteCloudinaryImage(existing.profileImage);
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: req.file.path },
      { new: true }
    );
    res.json({ profileImage: user.profileImage });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בהעלאת תמונה' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });
    res.json({ message: 'משתמש נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMe, updateMe, uploadImage, getAllUsers, deleteUser };
