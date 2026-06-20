const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const CLOUDINARY_HOST = 'res.cloudinary.com';

const isCloudinaryUrl = (url) =>
  typeof url === 'string' && url.includes(CLOUDINARY_HOST);

const extractPublicId = (url) => {
  if (!isCloudinaryUrl(url)) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

const deleteCloudinaryImage = async (url) => {
  if (!isCloudinaryConfigured() || !isCloudinaryUrl(url)) return;
  const publicId = extractPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('Failed to delete Cloudinary asset:', publicId, err.message);
  }
};

const uploadLocalFile = async (filePath, publicId) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'ezrakrova/profile-images',
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
  });
  return result.secure_url;
};

module.exports = {
  isCloudinaryUrl,
  extractPublicId,
  deleteCloudinaryImage,
  uploadLocalFile,
};
