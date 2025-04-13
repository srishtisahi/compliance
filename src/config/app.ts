import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes (to be created)
import apiRoutes from '../api/routes';

// Import custom middleware
import { errorHandler } from '../api/middlewares/errorHandler';
import { notFoundHandler } from '../api/middlewares/notFoundHandler';
import { logger } from '../utils/logger';

// Initialize express app
const app: Application = express();

// Set up rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window default
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
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

// HTTP request logger
app.use(morgan('dev', {
  stream: {
    write: (message: string) => logger.http(message.trim()),
  },
}));

// Apply rate limiting to all requests
app.use(limiter);

// API routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.use(apiPrefix, apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler middleware (should be the last middleware)
app.use(errorHandler);

export default app; 