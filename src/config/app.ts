import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

// Import configuration
import { config } from './env';

// Import routes (to be created)
import apiRoutes from '../api/routes';

// Import custom middleware
import { errorHandler } from '../api/middlewares/errorHandler';
import { notFoundHandler } from '../api/middlewares/notFoundHandler';
import { requestLogger } from '../api/middlewares/requestLogger';
import { logger } from '../utils/logger';

// Initialize express app
const app: Application = express();

// Set up rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));

// Apply custom request logger middleware
app.use(requestLogger);

// HTTP request logger using morgan (can be disabled since we now have our own logger)
if (config.USE_MORGAN_LOGGER) {
  app.use(morgan('dev', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }));
}

// Apply rate limiting to all requests
app.use(limiter);

// API routes
app.use(config.API_PREFIX, apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler middleware (should be the last middleware)
app.use(errorHandler);

export default app; 