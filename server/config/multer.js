const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profiles/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
              allowed.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('קובץ חייב להיות תמונה (jpg, png, webp)'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = upload;
