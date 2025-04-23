import { Router } from 'express';
import { orchestrationController } from '../controllers/orchestration.controller';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @route POST /api/orchestration/process
 * @desc Process a query with document URL and Gemini Web Search
 * @access Private
 */
router.post('/process', rateLimiter('orchestration', 5, 60), orchestrationController.processQuery);

/**
 * @route POST /api/orchestration/process-document
 * @desc Process a document with Mistral OCR
 * @access Private
 */
router.post('/process-document', rateLimiter('orchestration', 5, 60), orchestrationController.processDocument);

/**
 * @route POST /api/orchestration/search
 * @desc Search for compliance information with Gemini Web Search
 * @access Private
 */
router.post('/search', rateLimiter('orchestration', 10, 60), orchestrationController.search);

export default router; 