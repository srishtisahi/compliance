import { Router } from 'express';
import { complianceAnalysisController } from '../controllers/complianceAnalysis.controller';
import { validateAnalysisQuery, validateAnalysisId } from '../validators/complianceAnalysis.validator';

const router = Router();

/**
 * @route   POST /api/compliance/analyze/text
 * @desc    Analyze text query for compliance information
 * @access  Private
 */
router.post('/analyze/text', complianceAnalysisController.analyzeText);

/**
 * @route   POST /api/compliance/analyze/document
 * @desc    Analyze document and search results for compliance information
 * @access  Private
 */
router.post('/analyze/document', complianceAnalysisController.analyzeDocument);

/**
 * @route   GET /api/compliance/analysis
 * @desc    Get paginated compliance analysis results with filtering
 * @access  Private
 */
router.get('/analysis', validateAnalysisQuery, complianceAnalysisController.getAnalysisResults);

/**
 * @route   GET /api/compliance/analysis/:id
 * @desc    Get a single compliance analysis result by ID
 * @access  Private
 */
router.get('/analysis/:id', validateAnalysisId, complianceAnalysisController.getAnalysisById);

export default router; 