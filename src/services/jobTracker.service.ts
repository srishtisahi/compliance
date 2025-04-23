import { v4 as uuidv4 } from 'uuid';
import ComplianceJob, { IComplianceJob, JobStatus, JobType } from '../models/ComplianceJob';
import { logger } from '../utils/logger';

class JobTrackerService {
  /**
   * Create a new job
   */
  async createJob(params: {
    userId?: string;
    jobType: JobType;
    query: string;
    documentId?: string;
    params?: Record<string, any>;
  }): Promise<IComplianceJob> {
    try {
      const jobId = uuidv4();
      
      const job = new ComplianceJob({
        jobId,
        userId: params.userId,
        jobType: params.jobType,
        status: JobStatus.PENDING,
        progress: 0,
        query: params.query,
        documentId: params.documentId,
        params: params.params,
        startTime: new Date(),
      });
      
      await job.save();
      logger.info(`Created new ${params.jobType} job with ID: ${jobId}`);
      return job;
    } catch (error) {
      logger.error('Error creating job:', error);
      throw error;
    }
  }

  /**
   * Get job by job ID
   */
  async getJob(jobId: string): Promise<IComplianceJob | null> {
    try {
      return await ComplianceJob.findOne({ jobId });
    } catch (error) {
      logger.error(`Error retrieving job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string, 
    status: JobStatus, 
    progress?: number, 
    result?: Record<string, any>,
    error?: string
  ): Promise<IComplianceJob | null> {
    try {
      const updateData: Partial<IComplianceJob> = { status };
      
      if (progress !== undefined) {
        updateData.progress = progress;
      }
      
      if (result) {
        updateData.result = result;
      }
      
      if (error) {
        updateData.error = error;
      }
      
      if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
        updateData.endTime = new Date();
      }
      
      const updatedJob = await ComplianceJob.findOneAndUpdate(
        { jobId },
        updateData,
        { new: true }
      );
      
      if (updatedJob) {
        logger.info(`Updated job ${jobId} status to ${status}`);
      } else {
        logger.warn(`Failed to update job ${jobId}: Job not found`);
      }
      
      return updatedJob;
    } catch (error) {
      logger.error(`Error updating job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * List jobs with optional filters
   */
  async listJobs(params: {
    userId?: string;
    jobType?: JobType;
    status?: JobStatus;
    page?: number;
    limit?: number;
  }): Promise<{
    jobs: IComplianceJob[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { userId, jobType, status, page = 1, limit = 10 } = params;
      
      // Build filter
      const filter: Record<string, any> = {};
      if (userId) filter.userId = userId;
      if (jobType) filter.jobType = jobType;
      if (status) filter.status = status;
      
      // Count total documents
      const total = await ComplianceJob.countDocuments(filter);
      
      // Calculate pagination
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;
      
      // Get jobs
      const jobs = await ComplianceJob.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return {
        jobs,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Error listing jobs:', error);
      throw error;
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<boolean> {
    try {
      const result = await ComplianceJob.deleteOne({ jobId });
      const success = result.deletedCount === 1;
      
      if (success) {
        logger.info(`Deleted job ${jobId}`);
      } else {
        logger.warn(`Failed to delete job ${jobId}: Job not found`);
      }
      
      return success;
    } catch (error) {
      logger.error(`Error deleting job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old completed or failed jobs
   */
  async cleanupOldJobs(olderThan: Date): Promise<number> {
    try {
      const result = await ComplianceJob.deleteMany({
        status: { $in: [JobStatus.COMPLETED, JobStatus.FAILED] },
        updatedAt: { $lt: olderThan },
      });
      
      logger.info(`Cleaned up ${result.deletedCount} old jobs`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old jobs:', error);
      throw error;
    }
  }
}

export const jobTrackerService = new JobTrackerService(); 