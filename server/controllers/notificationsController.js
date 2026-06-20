const webpush = require('web-push');
const User = require('../models/User');

let pushConfigured = false;

const initWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@ezrakrova.local';
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  pushConfigured = true;
  return true;
};

const isPushConfigured = () => pushConfigured || initWebPush();

const saveSubscription = async (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: 'מנוי push לא תקין' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { pushSubscriptions: subscription },
    });
    res.json({ message: 'מנוי push נשמר' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeSubscription = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ message: 'חסר endpoint' });
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pushSubscriptions: { endpoint } },
    });
    res.json({ message: 'מנוי push הוסר' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getVapidPublicKey = (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ message: 'Push notifications not configured' });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

const sendPushToUser = async (userId, payload) => {
  if (!isPushConfigured()) return;
  const user = await User.findById(userId).select('pushSubscriptions');
  if (!user?.pushSubscriptions?.length) return;
  const body = JSON.stringify(payload);
  const stale = [];

  await Promise.all(user.pushSubscriptions.map(async (sub, index) => {
    try {
      await webpush.sendNotification(sub, body);
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) stale.push(sub.endpoint);
      else console.warn('Push send failed:', err.message);
    }
  }));

  if (stale.length) {
    await User.findByIdAndUpdate(userId, {
      $pull: { pushSubscriptions: { endpoint: { $in: stale } } },
    });
  }
};

const notifyNearbyVolunteers = async (request) => {
  if (!isPushConfigured() || !request?.location?.coordinates) return;
  const [lng, lat] = request.location.coordinates;
  const volunteers = await User.find({
    'volunteerProfile.isAvailable': true,
    pushSubscriptions: { $exists: true, $not: { $size: 0 } },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: 50000,
      },
    },
  }).select('_id pushSubscriptions volunteerProfile');

  const payload = {
    title: 'בקשת עזרה חדשה בסביבה',
    body: `${request.category}: ${request.description.slice(0, 80)}`,
    url: `/requests/${request._id}`,
  };

  await Promise.all(volunteers
    .filter((v) => {
      const caps = v.volunteerProfile?.capabilities || [];
      return !caps.length || caps.includes(request.category);
    })
    .map((v) => sendPushToUser(v._id, payload)));
};

module.exports = {
  saveSubscription,
  removeSubscription,
  getVapidPublicKey,
  notifyNearbyVolunteers,
  isPushConfigured,
};
