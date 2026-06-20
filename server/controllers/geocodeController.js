const NOMINATIM_HEADERS = { 'User-Agent': 'EzraKrova/1.0 (mutual-aid platform)' };

const searchAddress = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=il&accept-language=he`;
    const response = await fetch(url, { headers: NOMINATIM_HEADERS });
    const data = await response.json();
    const results = data.map((item) => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בחיפוש כתובת' });
  }
};

const reverseGeocode = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'קואורדינטות לא תקינות' });
    }
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=he`;
    const response = await fetch(url, { headers: NOMINATIM_HEADERS });
    const data = await response.json();
    res.json({
      label: data.display_name || '',
      city: data.address?.city || data.address?.town || data.address?.village || '',
      lat,
      lng,
    });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בזיהוי כתובת' });
  }
};

module.exports = { searchAddress, reverseGeocode };
