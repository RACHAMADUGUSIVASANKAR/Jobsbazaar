import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const uri = process.env.MONGODB_URI || (isProd ? '' : 'mongodb://localhost:27017/ai-job-tracker');

    if (!uri) {
      throw new Error('MONGODB_URI is required in production.');
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    if ((error.message || '').toLowerCase().includes('ip') || (error.message || '').toLowerCase().includes('atlas')) {
      console.error('Tip: for MongoDB Atlas, allow Render outbound access (0.0.0.0/0 or restricted Render egress IPs) in Network Access.');
    }
    process.exit(1);
  }
};

export default connectDB;
