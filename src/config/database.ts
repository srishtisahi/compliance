import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Database connection options
const options = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

// Get the correct MongoDB URI based on the environment
const getMongoURI = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return process.env.MONGODB_URI_PROD || '';
    case 'test':
      return process.env.MONGODB_URI_TEST || '';
    case 'development':
    default:
      return process.env.MONGODB_URI_DEV || '';
  }
};

// Connect to MongoDB
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = getMongoURI();
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoURI, options);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Disconnect from MongoDB
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
}; 