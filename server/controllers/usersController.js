const User = require('../models/User');

const getMe = async (req, res) => {
  res.json(req.user);
};

const updateMe = async (req, res) => {
  try {
    const { name, location, volunteerProfile } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (location) updates.location = location;
    if (volunteerProfile) updates.volunteerProfile = volunteerProfile;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'לא הועלתה תמונה' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: `/uploads/profiles/${req.file.filename}` },
      { new: true }
    );
    res.json({ profileImage: user.profileImage });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
