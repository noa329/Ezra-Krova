const shabbatGuard = (req, res, next) => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  if ((day === 5 && hour >= 18) || day === 6) {
    return res.status(403).json({ message: 'השירות אינו זמין בשבת' });
  }
  next();
};

module.exports = { shabbatGuard };
