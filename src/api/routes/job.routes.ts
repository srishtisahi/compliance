import { Router } from 'express';
import { jobController } from '../controllers/job.controller';

const router = Router();

/**
 * @route   GET /api/jobs
 * @desc    List jobs with filtering
 * @access  Private
 */
router.get('/', jobController.listJobs);

/**
 * @route   GET /api/jobs/:jobId
 * @desc    Get job status
 * @access  Private
 */
router.get('/:jobId', jobController.getJobStatus);

/**
 * @route   POST /api/jobs/:jobId/cancel
 * @desc    Cancel a job in progress
 * @access  Private
 */
router.post('/:jobId/cancel', jobController.cancelJob);

export default router; 