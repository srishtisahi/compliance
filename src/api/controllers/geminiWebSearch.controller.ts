import { Request, Response, NextFunction } from 'express';
import { geminiWebSearchService } from '../../services/geminiWebSearch.service';
import { logger } from '../../utils/logger';
import { isValidUrl } from '../../utils/validators';
import { GeminiWebSearchRequestOptions, ComplianceSearchOptions } from '../../types/geminiWebSearch.types';
import { QueryOptimizerOptions } from '../../services/queryOptimizer.service';

/**
 * Controller for Gemini Web Search API endpoints
 */
export class GeminiWebSearchController {
  constructor() {
    // Bind methods to this instance to preserve 'this' context
    this.searchCompliance = this.searchCompliance.bind(this);
    this.searchComplianceOptimized = this.searchComplianceOptimized.bind(this);
    this.complianceSearch = this.complianceSearch.bind(this);
  }

  /**
   * Search for compliance information using Gemini Web Search API
   * @route POST /api/search/search
   */
  async searchCompliance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, focus, maxResults, timeoutMs } = req.body;
      
      // Validate required parameters
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query parameter is required and must be a string' });
        return;
      }
      
      // Validate focus if provided
      if (focus && !['government', 'news', 'all'].includes(focus)) {
        res.status(400).json({ 
          error: 'Focus must be one of: government, news, all'
        });
        return;
      }
      
      // Validate maxResults if provided
      if (maxResults && (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 50)) {
        res.status(400).json({ error: 'maxResults must be a number between 1 and 50' });
        return;
      }
      
      // Validate timeoutMs if provided
      if (timeoutMs && (typeof timeoutMs !== 'number' || timeoutMs < 1000 || timeoutMs > 30000)) {
        res.status(400).json({ error: 'timeoutMs must be a number between 1000 and 30000' });
        return;
      }
      
      // Prepare search options
      const options: GeminiWebSearchRequestOptions = { 
        query,
        focus,
        maxResults,
        timeoutMs
      };
      
      // Execute search
      const result = await geminiWebSearchService.searchCompliance(options);
      
      // Return search results
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in searchCompliance:', error);
      next(error);
    }
  }

  /**
   * Search with optimized queries based on user prompts
   * @route POST /api/search/optimized-search
   */
  async searchComplianceOptimized(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        userPrompt, 
        industry, 
        location, 
        documentContext, 
        complianceDomains,
        prioritizeRecent,
        maxResults,
        timeoutMs
      } = req.body;
      
      // Validate required parameters
      if (!userPrompt || typeof userPrompt !== 'string') {
        res.status(400).json({ error: 'userPrompt parameter is required and must be a string' });
        return;
      }
      
      // Validate maxResults if provided
      if (maxResults && (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 50)) {
        res.status(400).json({ error: 'maxResults must be a number between 1 and 50' });
        return;
      }
      
      // Prepare optimizer options
      const options: QueryOptimizerOptions & Omit<GeminiWebSearchRequestOptions, 'query'> = {
        userPrompt,
        industry,
        location,
        documentContext,
        complianceDomains,
        prioritizeRecent,
        maxResults,
        timeoutMs
      };
      
      // Execute optimized search
      const result = await geminiWebSearchService.searchComplianceWithOptimizedQuery(options);
      
      // Return search results
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in searchComplianceOptimized:', error);
      next(error);
    }
  }

  /**
   * Enhanced search for compliance information with government source prioritization
   * @route POST /api/search/compliance-search
   */
  async complianceSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        query, 
        domainCategories, 
        governmentSourcesOnly, 
        maxResults, 
        minAuthorityScore,
        timeoutMs 
      } = req.body;
      
      // Validate required parameters
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query parameter is required and must be a string' });
        return;
      }
      
      // Validate domain categories if provided
      if (domainCategories) {
        if (!Array.isArray(domainCategories)) {
          res.status(400).json({ error: 'domainCategories must be an array' });
          return;
        }
        
        const validCategories = ['government', 'news', 'educational', 'organization', 'legal', 'other'];
        for (const category of domainCategories) {
          if (!validCategories.includes(category)) {
            res.status(400).json({ 
              error: `Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}` 
            });
            return;
          }
        }
      }
      
      // Validate governmentSourcesOnly if provided
      if (governmentSourcesOnly !== undefined && typeof governmentSourcesOnly !== 'boolean') {
        res.status(400).json({ error: 'governmentSourcesOnly must be a boolean' });
        return;
      }
      
      // Validate maxResults if provided
      if (maxResults && (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 50)) {
        res.status(400).json({ error: 'maxResults must be a number between 1 and 50' });
        return;
      }
      
      // Validate minAuthorityScore if provided
      if (minAuthorityScore && (typeof minAuthorityScore !== 'number' || minAuthorityScore < 0 || minAuthorityScore > 100)) {
        res.status(400).json({ error: 'minAuthorityScore must be a number between 0 and 100' });
        return;
      }
      
      // Prepare search options
      const options: ComplianceSearchOptions = {
        query,
        domainCategories,
        governmentSourcesOnly,
        maxResults,
        minAuthorityScore,
        timeoutMs
      };
      
      // Execute enhanced search
      const result = await geminiWebSearchService.complianceSearch(options);
      
      // Return search results
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in complianceSearch:', error);
      next(error);
    }
  }
}

// Export singleton instance
export const geminiWebSearchController = new GeminiWebSearchController(); 