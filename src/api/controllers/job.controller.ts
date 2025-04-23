import { Request, Response } from 'express';
import { jobTrackerService } from '../../services/jobTracker.service';
import { JobStatus, JobType } from '../../models/ComplianceJob';
import { logger } from '../../utils/logger';

// Extended Request interface that may include a user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

/**
 * Controller for job status management
 */
class JobController {
  /**
   * Get status of a job
   * @route GET /api/jobs/:jobId
   */
  async getJobStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        res.status(400).json({
          success: false,
          message: 'Job ID is required',
        });
        return;
      }
      
      const job = await jobTrackerService.getJob(jobId);
      
      if (!job) {
        res.status(404).json({
          success: false,
          message: `Job with ID ${jobId} not found`,
        });
        return;
      }
      
      // Optional user permission check
      if (req.user && job.userId && req.user.id !== job.userId) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to access this job',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: {
          jobId: job.jobId,
          status: job.status,
          progress: job.progress,
          jobType: job.jobType,
          query: job.query,
          documentId: job.documentId,
          startTime: job.startTime,
          endTime: job.endTime,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          result: job.status === JobStatus.COMPLETED ? job.result : undefined,
          error: job.status === JobStatus.FAILED ? job.error : undefined,
        },
      });
    } catch (error) {
      logger.error('Error retrieving job status:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving job status',
      });
    }
  }

  /**
   * List jobs with filtering
   * @route GET /api/jobs
   */
  async listJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        userId = req.user?.id, // Default to current user if authenticated
        jobType,
        status,
        page = '1',
        limit = '10',
      } = req.query;
      
      const filters: {
        userId?: string;
        jobType?: JobType;
        status?: JobStatus;
        page: number;
        limit: number;
      } = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      };
      
      if (userId) filters.userId = userId as string;
      if (jobType && Object.values(JobType).includes(jobType as JobType)) {
        filters.jobType = jobType as JobType;
      }
      if (status && Object.values(JobStatus).includes(status as JobStatus)) {
        filters.status = status as JobStatus;
      }
      
      // If user is not admin, enforce filtering by current user ID
      if (req.user && !req.user.isAdmin && filters.userId !== req.user.id) {
        filters.userId = req.user.id; // Only allow seeing own jobs
      }
      
      const result = await jobTrackerService.listJobs(filters);
      
      res.status(200).json({
        success: true,
        data: {
          items: result.jobs.map(job => ({
            jobId: job.jobId,
            status: job.status,
            progress: job.progress,
            jobType: job.jobType,
            query: job.query,
            documentId: job.documentId,
            startTime: job.startTime,
            endTime: job.endTime,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
          })),
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
        },
      });
    } catch (error) {
      logger.error('Error listing jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Error listing jobs',
      });
    }
  }

  /**
   * Cancel a job in progress
   * @route POST /api/jobs/:jobId/cancel
   */
  async cancelJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        res.status(400).json({
          success: false,
          message: 'Job ID is required',
        });
        return;
      }
      
      const job = await jobTrackerService.getJob(jobId);
      
      if (!job) {
        res.status(404).json({
          success: false,
          message: `Job with ID ${jobId} not found`,
        });
        return;
      }
      
      // Optional user permission check
      if (req.user && job.userId && req.user.id !== job.userId && !req.user.isAdmin) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to cancel this job',
        });
        return;
      }
      
      // Only pending or processing jobs can be canceled
      if (job.status !== JobStatus.PENDING && job.status !== JobStatus.PROCESSING) {
        res.status(400).json({
          success: false,
          message: `Cannot cancel job with status '${job.status}'`,
        });
        return;
      }
      
      // Update job status to failed with cancellation message
      const updatedJob = await jobTrackerService.updateJobStatus(
        jobId,
        JobStatus.FAILED,
        job.progress,
        undefined,
        'Job was canceled by the user'
      );
      
      res.status(200).json({
        success: true,
        data: {
          jobId: updatedJob?.jobId,
          status: updatedJob?.status,
          message: 'Job has been canceled',
        },
      });
    } catch (error) {
      logger.error('Error canceling job:', error);
      res.status(500).json({
        success: false,
        message: 'Error canceling job',
      });
    }
  }
}

export const jobController = new JobController(); 