import { Request, Response, NextFunction } from 'express';
import { perplexityService } from '../../services/perplexity.service';
import { logger } from '../../utils/logger';
import { isValidUrl } from '../../utils/perplexity.guards';
import { PerplexityRequestOptions, ComplianceSearchOptions } from '../../types/perplexity.types';
import { QueryOptimizerOptions } from '../../services/queryOptimizer.service';

/**
 * Controller for Perplexity API endpoints
 */
export class PerplexityController {
  constructor() {
    // Bind methods to this instance to preserve 'this' context
    this.searchCompliance = this.searchCompliance.bind(this);
    this.searchComplianceOptimized = this.searchComplianceOptimized.bind(this);
    this.complianceSearch = this.complianceSearch.bind(this);
  }

  /**
   * Search for compliance information using Perplexity Sonar API
   */
  async searchCompliance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, focus, maxResults, timeoutMs } = req.body;
      
      // Validate request parameters
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query parameter is required and must be a string' });
        return;
      }
      
      // Validate focus if provided
      if (focus && !['government', 'news', 'all'].includes(focus)) {
        res.status(400).json({ 
          error: 'Invalid focus value. Must be one of: government, news, all' 
        });
        return;
      }
      
      // Validate maxResults if provided
      if (maxResults && (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 50)) {
        res.status(400).json({ 
          error: 'maxResults must be a number between 1 and 50' 
        });
        return;
      }
      
      // Validate timeoutMs if provided
      if (timeoutMs && (typeof timeoutMs !== 'number' || timeoutMs < 1000 || timeoutMs > 30000)) {
        res.status(400).json({ 
          error: 'timeoutMs must be a number between 1000 and 30000' 
        });
        return;
      }
      
      // Prepare options for Perplexity service
      const options: PerplexityRequestOptions = {
        query,
        focus: focus as 'government' | 'news' | 'all',
        maxResults,
        timeoutMs
      };
      
      // Call Perplexity service
      const results = await perplexityService.searchCompliance(options);
      
      // Validate URLs in response
      const sanitizedSources = results.sources.filter(source => isValidUrl(source.url));
      
      // Return results
      res.status(200).json({
        ...results,
        sources: sanitizedSources
      });
    } catch (error) {
      logger.error('Error in searchCompliance controller:', error);
      next(error);
    }
  }

  /**
   * Search for compliance information using optimized queries
   * based on user prompts and context
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
      
      // Validate optional parameters
      if (industry && typeof industry !== 'string') {
        res.status(400).json({ error: 'industry must be a string' });
        return;
      }
      
      if (location && typeof location !== 'string') {
        res.status(400).json({ error: 'location must be a string' });
        return;
      }
      
      if (documentContext && typeof documentContext !== 'string') {
        res.status(400).json({ error: 'documentContext must be a string' });
        return;
      }
      
      if (complianceDomains && !Array.isArray(complianceDomains)) {
        res.status(400).json({ error: 'complianceDomains must be an array of strings' });
        return;
      }
      
      if (prioritizeRecent !== undefined && typeof prioritizeRecent !== 'boolean') {
        res.status(400).json({ error: 'prioritizeRecent must be a boolean' });
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
      
      // Prepare options for optimized search
      const options: QueryOptimizerOptions & Omit<PerplexityRequestOptions, 'query'> = {
        userPrompt,
        industry,
        location,
        documentContext,
        complianceDomains,
        prioritizeRecent,
        maxResults,
        timeoutMs
      };
      
      // Call Perplexity service with optimized query
      const results = await perplexityService.searchComplianceWithOptimizedQuery(options);
      
      // Validate URLs in response
      const sanitizedSources = results.sources.filter(source => isValidUrl(source.url));
      
      // Return results
      res.status(200).json({
        ...results,
        sources: sanitizedSources
      });
    } catch (error) {
      logger.error('Error in searchComplianceOptimized controller:', error);
      next(error);
    }
  }

  /**
   * Enhanced search for compliance information with government source prioritization
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
      if (minAuthorityScore !== undefined && 
          (typeof minAuthorityScore !== 'number' || minAuthorityScore < 0 || minAuthorityScore > 100)) {
        res.status(400).json({ error: 'minAuthorityScore must be a number between 0 and 100' });
        return;
      }
      
      // Validate timeoutMs if provided
      if (timeoutMs && (typeof timeoutMs !== 'number' || timeoutMs < 1000 || timeoutMs > 30000)) {
        res.status(400).json({ error: 'timeoutMs must be a number between 1000 and 30000' });
        return;
      }
      
      // Prepare options for enhanced compliance search
      const options: ComplianceSearchOptions = {
        query,
        focus: 'all', // We handle focus internally based on governmentSourcesOnly
        domainCategories: domainCategories as any,
        governmentSourcesOnly,
        maxResults,
        minAuthorityScore,
        timeoutMs
      };
      
      // Call Perplexity service with enhanced compliance search
      const results = await perplexityService.complianceSearch(options);
      
      // Validate URLs in response
      const sanitizedSources = results.sources.filter(source => isValidUrl(source.url));
      
      // Return results
      res.status(200).json({
        ...results,
        sources: sanitizedSources
      });
    } catch (error) {
      logger.error('Error in complianceSearch controller:', error);
      next(error);
    }
  }
}

// Export singleton instance
export const perplexityController = new PerplexityController(); 