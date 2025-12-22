const mongoose = require('mongoose');

// ✅ STEP 8: MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scribble';
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected:', mongoURI);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Don't exit - fall back to in-memory storage
    console.log('⚠️ Falling back to in-memory storage');
  }
};

module.exports = connectDB;
