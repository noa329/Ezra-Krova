const Request = require('../models/Request');

const createRequest = async (req, res) => {
  try {
    const { category, description, location, urgency } = req.body;
    const request = await Request.create({
      requesterId: req.user._id,
      category,
      description,
      location,
      urgency,
    });
    const io = req.app.get('io');
    if (io) io.emit('new-request', request);
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

const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requesterId', 'name phone profileImage rating')
      .populate('volunteerId', 'name phone profileImage rating');
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    if (request.requesterId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'אין הרשאה לעדכן בקשה זו' });
    const { category, description, location, urgency } = req.body;
    if (category) request.category = category;
    if (description) request.description = description;
    if (location) request.location = location;
    if (urgency) request.urgency = urgency;
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'בקשה לא נמצאה' });
    const isOwner = request.requesterId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: 'אין הרשאה למחוק בקשה זו' });
    await request.deleteOne();
    res.json({ message: 'הבקשה נמחקה בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const lockRequest = async (req, res) => {
  try {
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

module.exports = { createRequest, getRequests, getMyRequests, getRequestById, updateRequest, deleteRequest, lockRequest, confirmRequest };
