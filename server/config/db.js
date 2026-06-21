const mongoose = require('mongoose');

const getMongoHostLabel = (uri) => {
  if (!uri) return 'not configured';
  try {
    if (uri.includes('mongodb+srv://')) {
      const match = uri.match(/mongodb\+srv:\/\/[^@]+@([^/?]+)/);
      return match ? match[1] : 'Atlas cluster';
    }
    const match = uri.match(/mongodb:\/\/(?:[^@]+@)?([^/?]+)/);
    return match ? match[1] : 'localhost';
  } catch {
    return 'unknown';
  }
};

const isAtlasUri = (uri) =>
  uri.includes('mongodb+srv://') || uri.includes('.mongodb.net');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MongoDB connection error: MONGO_URI is not set in .env');
    process.exit(1);
  }

  const hostLabel = getMongoHostLabel(uri);
  const atlas = isAtlasUri(uri);

  try {
    const conn = await mongoose.connect(uri);
    if (atlas) {
      console.log(`MongoDB Atlas connected — cluster: ${hostLabel}`);
    } else {
      console.warn(`MongoDB connected (local/non-Atlas) — host: ${hostLabel}`);
      console.warn('For production, set MONGO_URI to a MongoDB Atlas connection string in server/.env');
    }
    console.log(`Database: ${conn.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
