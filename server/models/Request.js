const mongoose = require('mongoose');

const CATEGORIES = ['לינה', 'הסעה', 'מזון', 'תרופות', 'ילדים', 'נפשי'];

const requestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: CATEGORIES, required: true },
  description: { type: String, required: true, trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  city: { type: String, default: '' },
  urgency: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  status: { type: String, enum: ['open', 'locked', 'closed', 'disputed'], default: 'open' },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  requesterConfirmed: { type: Boolean, default: false },
  volunteerConfirmed: { type: Boolean, default: false },
  // When null, consumers should treat createdAt as the implicit preferred time.
  preferredTime: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

requestSchema.index({ location: '2dsphere' });

// Reverse geocode city from Nominatim (silent fail)
requestSchema.pre('save', async function (next) {
  if (!this.isModified('location') && this.city) return next();
  try {
    const [lng, lat] = this.coordinates || this.location.coordinates;
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EzraKrova/1.0' } });
    const data = await res.json();
    this.city = data.address?.city || data.address?.town || data.address?.village || '';
  } catch {
    // silent fail
  }
  next();
});

module.exports = mongoose.model('Request', requestSchema);
