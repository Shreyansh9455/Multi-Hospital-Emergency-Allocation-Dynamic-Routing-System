const mongoose = require('mongoose');

/**
 * Connects to MongoDB database using Mongoose with proper logging & event handlers.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_dispatch';

  try {
    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);

    // Listen to connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected.');
    });

    return conn;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // If running in development and local mongo is not running, log helpful guidance without crashing ungracefully
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
