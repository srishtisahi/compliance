import { Request, Response, NextFunction } from 'express';
import { query, param, validationResult } from 'express-validator';

/**
 * Validate query parameters for paginated compliance analysis results
 */
export const validateAnalysisQuery = [
  // Pagination parameters
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isString()
    .isIn(['createdAt', 'query', 'jurisdiction', 'category'])
    .withMessage('Sort field must be one of: createdAt, query, jurisdiction, category'),
  
  query('sortDirection')
    .optional()
    .isString()
    .isIn(['asc', 'desc'])
    .withMessage('Sort direction must be either asc or desc'),
  
  // Filter parameters
  query('userId')
    .optional()
    .isString()
    .withMessage('User ID must be a string'),
  
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  
  query('jurisdiction')
    .optional()
    .isString()
    .withMessage('Jurisdiction must be a string'),
  
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  
  query('documentId')
    .optional()
    .isString()
    .withMessage('Document ID must be a string'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search term must be a string'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  // Validation handler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validate ID parameter for getting a single compliance analysis
 */
export const validateAnalysisId = [
  param('id')
    .notEmpty()
    .withMessage('Analysis ID is required')
    .isMongoId()
    .withMessage('Analysis ID must be a valid MongoDB ID'),
  
  // Validation handler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    next();
  }
]; 