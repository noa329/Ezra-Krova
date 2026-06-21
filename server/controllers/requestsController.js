const Request = require('../models/Request');
const User = require('../models/User');
const { notifyNearbyVolunteers } = require('./notificationsController');

const parsePreferredTime = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const PREFERRED_TIME_IN_PAST_MESSAGE = 'מועד מועדף לא יכול להיות בעבר';

const assertPreferredTimeNotInPast = (preferredTime) => {
  const parsed = parsePreferredTime(preferredTime);
  if (!parsed) return null;
  if (parsed.getTime() < Date.now()) {
    return PREFERRED_TIME_IN_PAST_MESSAGE;
  }
  return parsed;
};

const createRequest = async (req, res) => {
  try {
    const { category, description, location, urgency, city, preferredTime } = req.body;
    const parsedPreferredTime = assertPreferredTimeNotInPast(preferredTime);
    if (typeof parsedPreferredTime === 'string') {
      return res.status(400).json({ message: parsedPreferredTime });
    }
    const request = await Request.create({
      requesterId: req.user._id,
      category,
      description,
      location,
      urgency,
      city: city || '',
      preferredTime: parsedPreferredTime,
    });
    const io = req.app.get('io');
    if (io) io.emit('new-request', request);
    notifyNearbyVolunteers(request).catch((err) => console.warn('Push notify failed:', err.message));
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getRequests = async (req, res) => {
  try {
    const filter = { status: 'open' };
    if (req.query.category) filter.category = req.query.category;
    const requests = await Request.find(filter).populate('requesterId', 'name phone profileImage rating').sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requesterId: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyClaimedRequests = async (req, res) => {
  try {
    const requests = await Request.find({ volunteerId: req.user._id, status: 'locked' }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMatchedRequests = async (req, res) => {
  try {
    const { volunteerId } = req.query;
    if (!volunteerId) return res.status(400).json({ message: 'חסר מזהה מתנדב' });
    if (req.user._id.toString() !== volunteerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'אין הרשאה לצפות בהתאמות אלה' });
    }

    const volunteer = await User.findById(volunteerId).select('-password');
    if (!volunteer) return res.status(404).json({ message: 'מתנדב לא נמצא' });

    const profile = volunteer.volunteerProfile || {};
    const skills = profile.capabilities || [];
    const radius = profile.radius || 10;
    const coordinates = volunteer.location?.coordinates || [];
    const hasLocation = coordinates.length === 2 && (coordinates[0] !== 0 || coordinates[1] !== 0);
    const filter = { status: 'open' };

    if (skills.length) filter.category = { $in: skills };
    if (hasLocation) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates },
          $maxDistance: radius * 1000,
        },
      };
    }

    const requests = await Request.find(filter).populate('requesterId', 'name').limit(30);
    const matches = requests
      .filter(request => request.requesterId?._id?.toString() !== volunteerId
        && request.requesterId?.toString() !== volunteerId)
      .map(request => buildMatchResponse(request, volunteer, skills, radius))
      .sort((a, b) => b.matchPercent - a.matchPercent);

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const buildMatchResponse = (request, volunteer, skills, radius) => {
  const distance = calculateDistanceKm(volunteer.location?.coordinates, request.location?.coordinates);
  const skillScore = skills.includes(request.category) ? 45 : 20;
  const distanceScore = Math.max(0, 35 - (distance / Math.max(radius, 1)) * 35);
  const urgencyScore = { high: 20, medium: 12, low: 6 }[request.urgency] || 8;
  const matchPercent = Math.min(99, Math.round(skillScore + distanceScore + urgencyScore));

  return {
    _id: request._id,
    requesterId: request.requesterId?._id?.toString() || request.requesterId?.toString(),
    requesterName: request.requesterId?.name || 'מבקש עזרה',
    category: request.category,
    description: request.description,
    distance,
    matchPercent,
    requiredSkills: [request.category],
    urgency: request.urgency,
    lat: request.location?.coordinates?.[1],
    lng: request.location?.coordinates?.[0],
  };
};

const calculateDistanceKm = (from, to) => {
  if (!from || !to || from.length !== 2 || to.length !== 2) return 0;
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const toRad = value => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};

const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requesterId', 'name phone profileImage rating location')
      .populate('volunteerId', 'name phone profileImage rating location');
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { category, description, location, urgency, city, preferredTime } = req.body;
    const update = { category, description, location, urgency, city: city || '' };
    if (preferredTime !== undefined) {
      const parsedPreferredTime = assertPreferredTimeNotInPast(preferredTime);
      if (typeof parsedPreferredTime === 'string') {
        return res.status(400).json({ message: parsedPreferredTime });
      }
      update.preferredTime = parsedPreferredTime;
    }
    const request = await Request.findOneAndUpdate(
      { _id: req.params.id, requesterId: req.user._id },
      update,
      { new: true, runValidators: true },
    );
    if (!request) {
      const exists = await Request.findById(req.params.id);
      if (!exists) return res.status(404).json({ message: 'בקשה לא נמצאה' });
      return res.status(403).json({ message: 'אין הרשאה לעדכן בקשה זו' });
    }
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, requesterId: req.user._id };
    const request = await Request.findOneAndDelete(filter);
    if (!request) {
      const exists = await Request.findById(req.params.id);
      if (!exists) return res.status(404).json({ message: 'בקשה לא נמצאה' });
      return res.status(403).json({ message: 'אין הרשאה למחוק בקשה זו' });
    }
    res.json({ message: 'הבקשה נמחקה בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const lockRequest = async (req, res) => {
  try {
    const existing = await Request.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    if (existing.requesterId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'לא ניתן להתנדב לבקשה שפתחת בעצמך' });
    }
    const request = await Request.findOneAndUpdate(
      { _id: req.params.id, status: 'open' },
      { status: 'locked', volunteerId: req.user._id },
      { new: true }
    );
    if (!request) return res.status(409).json({ message: 'הבקשה כבר נתפסה על ידי מתנדב אחר' });
    const io = req.app.get('io');
    if (io) {
      io.emit('request-locked', { requestId: request._id, volunteerName: req.user.name });
      io.to(request.requesterId.toString()).emit('request-status-update', { requestId: request._id, status: 'locked' });
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const confirmRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    const userId = req.user._id.toString();
    if (request.requesterId.toString() === userId) request.requesterConfirmed = true;
    else if (request.volunteerId?.toString() === userId) request.volunteerConfirmed = true;
    else return res.status(403).json({ message: 'אין הרשאה לאשר בקשה זו' });
    if (request.requesterConfirmed && request.volunteerConfirmed) {
      request.status = 'closed';
      const io = req.app.get('io');
      if (io) io.emit('request-completed', { requestId: request._id });
    }
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getNearbyRequests = async (req, res) => {
  try {
    const user = req.user;
    if (!user.volunteerProfile || !user.volunteerProfile.isAvailable)
      return res.status(400).json({ message: 'פרופיל מתנדב לא מוגדר או לא זמין' });
    const { radius = 10, capabilities = [] } = user.volunteerProfile;
    const [lng, lat] = user.location.coordinates;
    const radiusInMeters = radius * 1000;
    const filter = {
      status: 'open',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusInMeters,
        },
      },
    };
    if (capabilities.length > 0) filter.category = { $in: capabilities };
    const requests = await Request.find(filter)
      .populate('requesterId', 'name phone profileImage rating');
    const userId = user._id.toString();
    const filtered = requests.filter(r => r.requesterId?._id?.toString() !== userId
      && r.requesterId?.toString() !== userId);
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    filtered.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const disputeRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    if (request.status !== 'locked')
      return res.status(400).json({ message: 'ניתן לדווח מחלוקת רק על בקשות נעולות' });
    const userId = req.user._id.toString();
    const isParty = request.requesterId.toString() === userId
      || request.volunteerId?.toString() === userId;
    if (!isParty) return res.status(403).json({ message: 'אין הרשאה לדווח מחלוקת' });
    request.status = 'disputed';
    await request.save();
    const io = req.app.get('io');
    if (io) {
      io.to(request.requesterId.toString()).emit('request-status-update', { requestId: request._id, status: 'disputed' });
      if (request.volunteerId) {
        io.to(request.volunteerId.toString()).emit('request-status-update', { requestId: request._id, status: 'disputed' });
      }
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { resolution } = req.body;
    if (!['closed', 'open'].includes(resolution))
      return res.status(400).json({ message: 'פתרון לא חוקי' });
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    if (request.status !== 'disputed')
      return res.status(400).json({ message: 'הבקשה אינה במצב מחלוקת' });
    if (resolution === 'closed') {
      request.status = 'closed';
      request.requesterConfirmed = true;
      request.volunteerConfirmed = true;
    } else {
      request.status = 'open';
      request.volunteerId = null;
      request.requesterConfirmed = false;
      request.volunteerConfirmed = false;
    }
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllRequestsAdmin = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('requesterId', 'name phone')
      .populate('volunteerId', 'name phone')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'locked', 'closed', 'disputed'];
    if (!allowed.includes(status))
      return res.status(400).json({ message: 'סטטוס לא חוקי' });
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const rateRequest = async (req, res) => {
  try {
    const { score } = req.body;
    if (!score || score < 1 || score > 5)
      return res.status(400).json({ message: 'דירוג חייב להיות בין 1 ל-5' });
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    if (request.status !== 'closed')
      return res.status(400).json({ message: 'ניתן לדרג רק בקשות שהושלמו' });
    const userId = req.user._id.toString();
    let ratedUserId;
    if (request.requesterId.toString() === userId) ratedUserId = request.volunteerId;
    else if (request.volunteerId?.toString() === userId) ratedUserId = request.requesterId;
    else return res.status(403).json({ message: 'אין הרשאה לדרג בקשה זו' });
    const ratedUser = await User.findById(ratedUserId);
    if (!ratedUser) return res.status(404).json({ message: 'המשתמש לא נמצא' });
    const { avg, count } = ratedUser.rating;
    ratedUser.rating.avg = ((avg * count) + score) / (count + 1);
    ratedUser.rating.count = count + 1;
    await ratedUser.save();
    res.json({ message: 'הדירוג נשמר בהצלחה', rating: ratedUser.rating });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRequest, getRequests, getMyRequests, getMyClaimedRequests, getMatchedRequests, getRequestById, updateRequest,
  deleteRequest, lockRequest, confirmRequest, getNearbyRequests, rateRequest, disputeRequest,
  resolveDispute, getAllRequestsAdmin, adminUpdateStatus,
};
