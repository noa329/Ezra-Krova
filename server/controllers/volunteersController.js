const Request = require('../models/Request');
const User = require('../models/User');

const toVolunteerResponse = async (user) => {
  const completedHelps = await Request.countDocuments({ volunteerId: user._id, status: 'closed' });
  const profile = user.volunteerProfile || {};

  return {
    name: user.name,
    city: user.city || '',
    isVerified: Boolean(user.rating?.count),
    rating: user.rating?.avg || 0,
    completedHelps,
    availableNow: Boolean(profile.isAvailable),
    skills: profile.capabilities || [],
    availabilitySlots: profile.availabilitySlots || [],
    helpRadius: profile.radius || 10,
    lat: user.location?.coordinates?.[1] || null,
    lng: user.location?.coordinates?.[0] || null,
  };
};

const canEditVolunteer = (req, id) => req.user._id.toString() === id || req.user.role === 'admin';

const getVolunteerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'מתנדב לא נמצא' });
    res.json(await toVolunteerResponse(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateAvailability = async (req, res) => {
  try {
    if (!canEditVolunteer(req, req.params.id)) return res.status(403).json({ message: 'אין הרשאה לעדכן מתנדב זה' });
    const availableNow = Boolean(req.body.availableNow);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 'volunteerProfile.isAvailable': availableNow },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'מתנדב לא נמצא' });
    res.json(await toVolunteerResponse(user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateSkills = async (req, res) => {
  try {
    if (!canEditVolunteer(req, req.params.id)) return res.status(403).json({ message: 'אין הרשאה לעדכן מתנדב זה' });
    const { skills } = req.body;
    if (!Array.isArray(skills)) return res.status(400).json({ message: 'כישורים חייבים להיות מערך' });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 'volunteerProfile.capabilities': skills },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'מתנדב לא נמצא' });
    res.json(await toVolunteerResponse(user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateRadius = async (req, res) => {
  try {
    if (!canEditVolunteer(req, req.params.id)) return res.status(403).json({ message: 'אין הרשאה לעדכן מתנדב זה' });
    const helpRadius = Number(req.body.helpRadius ?? req.body.radius);
    if (!Number.isFinite(helpRadius) || helpRadius < 1 || helpRadius > 50) {
      return res.status(400).json({ message: 'רדיוס חייב להיות בין 1 ל-50 ק״מ' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 'volunteerProfile.radius': helpRadius },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'מתנדב לא נמצא' });
    res.json(await toVolunteerResponse(user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getVolunteerById, updateAvailability, updateSkills, updateRadius };
