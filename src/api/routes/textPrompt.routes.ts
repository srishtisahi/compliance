import { Router } from 'express';
import { textPromptController } from '../controllers/textPrompt.controller';
import { rateLimiter } from '../middlewares/rateLimiter';
import { validateTextPromptRequest } from '../validators/textPrompt.validator';

const router = Router();

/**
 * @route POST /api/text-prompt/process
 * @desc Process a text prompt to initiate the compliance search workflow
 * @access Private
 */
router.post('/process', rateLimiter('text-prompt', 10, 60), validateTextPromptRequest, textPromptController.processTextPrompt);

export default router; 