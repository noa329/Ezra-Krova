const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'גישה מותרת לאדמינים בלבד' });
};

module.exports = { adminOnly };
