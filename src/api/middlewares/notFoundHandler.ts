import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

// Middleware to handle 404 errors
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
}; 