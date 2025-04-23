import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

/**
 * Type definition for text prompt request body
 */
interface TextPromptRequest {
  prompt: string;
  prioritizeGovernmentSources?: boolean;
  maxResults?: number;
  includeAnalysis?: boolean;
  includeRawSearchResults?: boolean;
}

/**
 * Validator middleware for text prompt processing requests
 */
export const validateTextPromptRequest = (req: Request, res: Response, next: NextFunction): void | Response => {
  try {
    const errors: { field: string; message: string }[] = [];
    const body = req.body as TextPromptRequest;
    
    // Validate prompt (required, string, min/max length)
    if (!body.prompt) {
      errors.push({ field: 'prompt', message: 'Prompt is required' });
    } else if (typeof body.prompt !== 'string') {
      errors.push({ field: 'prompt', message: 'Prompt must be a string' });
    } else if (body.prompt.length < 3) {
      errors.push({ field: 'prompt', message: 'Prompt must be at least 3 characters' });
    } else if (body.prompt.length > 1000) {
      errors.push({ field: 'prompt', message: 'Prompt must be at most 1000 characters' });
    }
    
    // Validate prioritizeGovernmentSources (optional, boolean)
    if (body.prioritizeGovernmentSources !== undefined && typeof body.prioritizeGovernmentSources !== 'boolean') {
      errors.push({ field: 'prioritizeGovernmentSources', message: 'Priority flag must be a boolean' });
    }
    
    // Validate maxResults (optional, number, min/max value)
    if (body.maxResults !== undefined) {
      if (typeof body.maxResults !== 'number') {
        errors.push({ field: 'maxResults', message: 'Max results must be a number' });
      } else if (body.maxResults < 1 || body.maxResults > 50) {
        errors.push({ field: 'maxResults', message: 'Max results must be between 1 and 50' });
      } else if (!Number.isInteger(body.maxResults)) {
        errors.push({ field: 'maxResults', message: 'Max results must be an integer' });
      }
    }
    
    // Validate includeAnalysis (optional, boolean)
    if (body.includeAnalysis !== undefined && typeof body.includeAnalysis !== 'boolean') {
      errors.push({ field: 'includeAnalysis', message: 'Include analysis flag must be a boolean' });
    }
    
    // Validate includeRawSearchResults (optional, boolean)
    if (body.includeRawSearchResults !== undefined && typeof body.includeRawSearchResults !== 'boolean') {
      errors.push({ field: 'includeRawSearchResults', message: 'Include raw search results flag must be a boolean' });
    }
    
    // If there are validation errors, return 400 with error details
    if (errors.length > 0) {
      logger.warn('Invalid text prompt request:', errors);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request data',
        errors
      });
    }
    
    // Set default values if not provided
    req.body = {
      prompt: body.prompt,
      prioritizeGovernmentSources: body.prioritizeGovernmentSources ?? true,
      maxResults: body.maxResults ?? 10,
      includeAnalysis: body.includeAnalysis ?? true,
      includeRawSearchResults: body.includeRawSearchResults ?? false
    };
    
    // Continue to controller
    next();
  } catch (error) {
    logger.error('Error validating text prompt request:', error);
    next(error);
  }
}; 