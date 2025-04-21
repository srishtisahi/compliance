import app from './config/app';
import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { config } from './config/env';

// Set the port
const PORT = config.PORT;

// Connect to MongoDB
connectDB();

// Start the server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
  logger.info(`API available at http://localhost:${PORT}${config.API_PREFIX}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack || 'No stack trace available');
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack || 'No stack trace available');
  
  // Exit process
  process.exit(1);
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated!');
  });
}); 