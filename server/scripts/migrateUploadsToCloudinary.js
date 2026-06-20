require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const User = require('../models/User');
const { uploadLocalFile, isCloudinaryUrl } = require('../services/cloudinaryUpload');
const { isCloudinaryConfigured } = require('../config/cloudinary');

const UPLOADS_DIR = path.join(__dirname, '../uploads/profiles');

const migrate = async () => {
  if (!isCloudinaryConfigured()) {
    console.error('Cloudinary is not configured. Set credentials in server/.env');
    process.exit(1);
  }

  await connectDB();

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('No uploads/profiles directory found — nothing to migrate.');
    process.exit(0);
  }

  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  if (!files.length) {
    console.log('No profile images to migrate.');
    process.exit(0);
  }

  let migrated = 0;
  let skipped = 0;

  for (const file of files) {
    const match = file.match(/^([a-f0-9]{24})-/i);
    if (!match) {
      console.warn('Skipping unrecognized file:', file);
      skipped++;
      continue;
    }

    const userId = match[1];
    const user = await User.findById(userId);
    if (!user) {
      console.warn('User not found for file:', file);
      skipped++;
      continue;
    }

    if (isCloudinaryUrl(user.profileImage)) {
      console.log('Already on Cloudinary:', user.name);
      skipped++;
      continue;
    }

    const filePath = path.join(UPLOADS_DIR, file);
    try {
      const url = await uploadLocalFile(filePath, `legacy-${userId}`);
      user.profileImage = url;
      await user.save();
      migrated++;
      console.log('Migrated:', user.name, '→', url);
    } catch (err) {
      console.error('Failed to migrate', file, err.message);
      skipped++;
    }
  }

  console.log(`Done. Migrated: ${migrated}, Skipped: ${skipped}`);
  process.exit(0);
};

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
