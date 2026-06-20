const User = require('../models/User');
const Request = require('../models/Request');

const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalRequests,
      openRequests,
      lockedRequests,
      closedRequests,
      disputedRequests,
      requestsByCategory,
      requestsByUrgency,
      recentRequests,
    ] = await Promise.all([
      User.countDocuments(),
      Request.countDocuments(),
      Request.countDocuments({ status: 'open' }),
      Request.countDocuments({ status: 'locked' }),
      Request.countDocuments({ status: 'closed' }),
      Request.countDocuments({ status: 'disputed' }),
      Request.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Request.aggregate([
        { $group: { _id: '$urgency', count: { $sum: 1 } } },
      ]),
      Request.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('requesterId', 'name')
        .select('category status urgency createdAt requesterId'),
    ]);

    const topVolunteers = await User.find({ 'rating.count': { $gt: 0 } })
      .sort({ 'rating.avg': -1 })
      .limit(5)
      .select('name rating');

    res.json({
      totals: {
        users: totalUsers,
        requests: totalRequests,
        open: openRequests,
        locked: lockedRequests,
        closed: closedRequests,
        disputed: disputedRequests,
      },
      byCategory: requestsByCategory.map((row) => ({ category: row._id, count: row.count })),
      byUrgency: requestsByUrgency.map((row) => ({ urgency: row._id, count: row.count })),
      recentRequests,
      topVolunteers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const exportData = async (req, res) => {
  try {
    const [users, requests] = await Promise.all([
      User.find().select('-password').lean(),
      Request.find().populate('requesterId', 'name phone').populate('volunteerId', 'name phone').lean(),
    ]);
    res.json({ exportedAt: new Date().toISOString(), users, requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats, exportData };
