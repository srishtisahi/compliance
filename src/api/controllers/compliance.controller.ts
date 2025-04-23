import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { webScraperService } from '../../services/webScraper.service';
import { webScraper, ScrapedContent } from '../../utils/webScraper';
import { jobTrackerService } from '../../services/jobTracker.service';
import { JobStatus, JobType } from '../../models/ComplianceJob';

// Extended Request interface that may include a user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

/**
 * Controller for compliance-related endpoints
 */
class ComplianceController {
  /**
   * Initiate a long-running compliance search
   * @route POST /api/compliance/search-async
   */
  async initiateSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        query,
        maxSources,
        extractLinks,
        downloadPdf,
        timeoutMs,
        governmentSourcesOnly,
        requestDelay,
        userAgent,
        respectRobotsTxt
      } = req.body;
      
      // Validate required parameters
      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Query is required',
        });
        return;
      }
      
      // Create a new job
      const job = await jobTrackerService.createJob({
        userId: req.user?.id, // From authenticated user if available
        jobType: JobType.SEARCH,
        query,
        params: {
          maxSources,
          extractLinks,
          downloadPdf,
          timeoutMs,
          governmentSourcesOnly,
          requestDelay,
          userAgent,
          respectRobotsTxt
        },
      });
      
      // Start the search process in the background
      this.processComplianceSearch(job.jobId, query, {
        maxSources,
        extractLinks,
        downloadPdf,
        timeoutMs,
        governmentSourcesOnly,
        requestDelay,
        userAgent,
        respectRobotsTxt
      });
      
      // Return the job ID immediately
      res.status(202).json({
        success: true,
        message: 'Compliance search initiated',
        data: {
          jobId: job.jobId,
          status: job.status,
        },
      });
    } catch (error) {
      logger.error('Error initiating compliance search:', error);
      res.status(500).json({
        success: false,
        message: 'Error initiating compliance search',
      });
    }
  }

  /**
   * Process compliance search in the background
   * @private
   */
  private async processComplianceSearch(
    jobId: string,
    query: string,
    params: {
      maxSources?: number;
      extractLinks?: boolean;
      downloadPdf?: boolean;
      timeoutMs?: number;
      governmentSourcesOnly?: boolean;
      requestDelay?: number;
      userAgent?: string;
      respectRobotsTxt?: boolean;
    }
  ): Promise<void> {
    try {
      // Update job status to processing
      await jobTrackerService.updateJobStatus(jobId, JobStatus.PROCESSING, 10);
      
      // Extract content using web scraper service
      const extractionStartTime = Date.now();
      
      // Update progress to indicate extraction started
      await jobTrackerService.updateJobStatus(jobId, JobStatus.PROCESSING, 20);
      
      const extractedContent = await webScraperService.extractContentFromSearch({
        query,
        ...params,
      });
      
      // Update progress to indicate extraction completed
      await jobTrackerService.updateJobStatus(jobId, JobStatus.PROCESSING, 60);
      
      const extractionTime = Date.now() - extractionStartTime;
      logger.info(`Extraction completed for job ${jobId} in ${extractionTime}ms`);
      
      // Process and analyze the extracted content
      const processingStartTime = Date.now();
      
      // In a real implementation, you would analyze the content here
      // For example, categorize, summarize, extract key compliance information
      const analyzedResults = {
        ...extractedContent,
        metadata: {
          query,
          extractionTimeMs: extractionTime,
          timestamp: new Date().toISOString(),
          sourceCount: extractedContent.searchResponse?.sources?.length || 0,
        },
      };
      
      // Update progress to indicate analysis completed
      await jobTrackerService.updateJobStatus(jobId, JobStatus.PROCESSING, 90);
      
      const processingTime = Date.now() - processingStartTime;
      logger.info(`Processing completed for job ${jobId} in ${processingTime}ms`);
      
      // Mark job as completed with results
      await jobTrackerService.updateJobStatus(
        jobId,
        JobStatus.COMPLETED,
        100,
        analyzedResults
      );
      
      logger.info(`Job ${jobId} completed successfully`);
    } catch (error) {
      logger.error(`Error processing compliance search job ${jobId}:`, error);
      
      // Mark job as failed
      await jobTrackerService.updateJobStatus(
        jobId,
        JobStatus.FAILED,
        undefined,
        undefined,
        error instanceof Error ? error.message : 'Unknown error during processing'
      );
    }
  }

  /**
   * Scrape specific URLs for content asynchronously
   * @route POST /api/compliance/scrape-urls-async
   */
  async initiateScraping(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        urls,
        extractLinks,
        downloadPdf,
        timeoutMs,
        requestDelay,
        userAgent,
        respectRobotsTxt
      } = req.body;
      
      // Validate required parameters
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        res.status(400).json({
          success: false,
          message: 'URLs array is required',
        });
        return;
      }
      
      // Create a new job
      const job = await jobTrackerService.createJob({
        userId: req.user?.id, // From authenticated user if available
        jobType: JobType.WEB_SCRAPING,
        query: `Scraping ${urls.length} URLs`,
        params: {
          urls,
          extractLinks,
          downloadPdf,
          timeoutMs,
          requestDelay,
          userAgent,
          respectRobotsTxt
        },
      });
      
      // Start the scraping process in the background
      this.processUrlScraping(job.jobId, urls, {
        extractLinks,
        downloadPdf,
        timeoutMs,
        requestDelay,
        userAgent,
        respectRobotsTxt
      });
      
      // Return the job ID immediately
      res.status(202).json({
        success: true,
        message: 'URL scraping initiated',
        data: {
          jobId: job.jobId,
          status: job.status,
          urlCount: urls.length,
        },
      });
    } catch (error) {
      logger.error('Error initiating URL scraping:', error);
      res.status(500).json({
        success: false,
        message: 'Error initiating URL scraping',
      });
    }
  }

  /**
   * Process URL scraping in the background
   * @private
   */
  private async processUrlScraping(
    jobId: string,
    urls: string[],
    params: {
      extractLinks?: boolean;
      downloadPdf?: boolean;
      timeoutMs?: number;
      requestDelay?: number;
      userAgent?: string;
      respectRobotsTxt?: boolean;
    }
  ): Promise<void> {
    try {
      // Update job status to processing
      await jobTrackerService.updateJobStatus(jobId, JobStatus.PROCESSING, 10);
      
      // Scrape URLs using web scraper utility
      const scrapingStartTime = Date.now();
      
      // Initialize progress tracking
      const totalUrls = urls.length;
      let processedUrls = 0;
      const scrapedContent: ScrapedContent[] = [];
      
      // Process URLs in batches to update progress
      const batchSize = Math.max(1, Math.ceil(totalUrls / 10)); // 10 progress updates
      
      for (let i = 0; i < totalUrls; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const batchResult = await webScraper.scrapeMultipleUrls(batch, params);
        
        scrapedContent.push(...batchResult);
        processedUrls += batch.length;
        
        // Update progress (10% baseline + 80% for scraping progress)
        const progressPercentage = 10 + Math.round((processedUrls / totalUrls) * 80);
        await jobTrackerService.updateJobStatus(jobId, JobStatus.PROCESSING, progressPercentage);
      }
      
      const scrapingTime = Date.now() - scrapingStartTime;
      logger.info(`Scraping completed for job ${jobId} in ${scrapingTime}ms`);
      
      // Process and analyze the scraped content
      const result = {
        urls,
        scrapedContent,
        metadata: {
          totalUrls,
          successfulScrapes: scrapedContent.filter((content: ScrapedContent) => !content.error).length,
          governmentSources: scrapedContent.filter((content: ScrapedContent) => content.isGovernment).length,
          scrapingTimeMs: scrapingTime,
          timestamp: new Date().toISOString()
        }
      };
      
      // Mark job as completed with results
      await jobTrackerService.updateJobStatus(
        jobId,
        JobStatus.COMPLETED,
        100,
        result
      );
      
      logger.info(`Job ${jobId} completed successfully`);
    } catch (error) {
      logger.error(`Error processing URL scraping job ${jobId}:`, error);
      
      // Mark job as failed
      await jobTrackerService.updateJobStatus(
        jobId,
        JobStatus.FAILED,
        undefined,
        undefined,
        error instanceof Error ? error.message : 'Unknown error during scraping'
      );
    }
  }
}

export const complianceController = new ComplianceController(); 