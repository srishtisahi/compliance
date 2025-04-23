import { logger } from './logger';
import { jobTrackerService } from '../services/jobTracker.service';

/**
 * Cleanup job retention configuration
 */
interface CleanupConfig {
  /**
   * How old (in days) a completed or failed job must be to be deleted
   */
  retentionDays: number;
  
  /**
   * How often to run the cleanup (in milliseconds)
   */
  cleanupIntervalMs: number;
}

/**
 * Default cleanup configuration
 */
const DEFAULT_CONFIG: CleanupConfig = {
  // Delete completed/failed jobs after 7 days
  retentionDays: 7,
  // Run cleanup every 24 hours
  cleanupIntervalMs: 24 * 60 * 60 * 1000,
};

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Run a single job cleanup pass
 */
export async function runJobCleanup(retentionDays: number = DEFAULT_CONFIG.retentionDays): Promise<number> {
  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    logger.info(`Running cleanup for jobs older than ${cutoffDate.toISOString()}`);
    
    // Clean up old jobs
    const deletedCount = await jobTrackerService.cleanupOldJobs(cutoffDate);
    
    logger.info(`Job cleanup complete. Deleted ${deletedCount} old jobs.`);
    return deletedCount;
  } catch (error) {
    logger.error('Error during job cleanup:', error);
    return 0;
  }
}

/**
 * Start periodic job cleanup
 */
export function startJobCleanup(config: Partial<CleanupConfig> = {}): void {
  // Merge provided config with defaults
  const fullConfig: CleanupConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  
  // Stop existing interval if running
  if (cleanupInterval !== null) {
    clearInterval(cleanupInterval);
  }
  
  // Log configuration
  logger.info(`Starting job cleanup service with retention of ${fullConfig.retentionDays} days`);
  logger.info(`Cleanup will run every ${fullConfig.cleanupIntervalMs / (60 * 60 * 1000)} hours`);
  
  // Run cleanup immediately
  runJobCleanup(fullConfig.retentionDays)
    .catch(error => logger.error('Initial job cleanup failed:', error));
  
  // Schedule periodic cleanup
  cleanupInterval = setInterval(() => {
    runJobCleanup(fullConfig.retentionDays)
      .catch(error => logger.error('Scheduled job cleanup failed:', error));
  }, fullConfig.cleanupIntervalMs);
}

/**
 * Stop periodic job cleanup
 */
export function stopJobCleanup(): void {
  if (cleanupInterval !== null) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('Job cleanup service stopped');
  }
}

// Export default configuration
export const JOB_CLEANUP_CONFIG = DEFAULT_CONFIG; 