const { v2: cloudinary } = require('cloudinary');

const isCloudinaryConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const warnIfNotConfigured = () => {
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary not configured — profile image uploads will fail.');
    console.warn('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in server/.env');
  } else {
    console.log('Cloudinary configured for image uploads');
  }
};

module.exports = { cloudinary, isCloudinaryConfigured, warnIfNotConfigured };
