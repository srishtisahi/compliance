import { Request, Response, NextFunction } from 'express';
import { OrchestrationService, OrchestrationOptions } from '../../services/orchestration.service';
import { GeminiWebSearchService } from '../../services/geminiWebSearch.service';
import { GeminiWebSearchRequestOptions } from '../../types/geminiWebSearch.types';
import { logger } from '../../utils/logger';

/**
 * Controller for text prompt processing endpoints
 */
export class TextPromptController {
  private orchestrationService: OrchestrationService;
  private geminiWebSearchService: GeminiWebSearchService;

  constructor() {
    this.orchestrationService = new OrchestrationService();
    this.geminiWebSearchService = new GeminiWebSearchService();
    
    // Bind methods to this instance
    this.processTextPrompt = this.processTextPrompt.bind(this);
  }

  /**
   * Process a text prompt from the user
   * @route POST /api/text-prompt/process
   */
  async processTextPrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        prompt, 
        analyze = true, 
        maxSearchResults = 10,
        prioritizeGovernmentSources = true
      } = req.body;
      
      // Validate required parameters
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({
          status: 'error',
          message: 'Text prompt is required and must be a string'
        });
        return;
      }
      
      // Decide whether to perform analysis with Gemini or just return search results
      if (analyze) {
        // Use orchestration service for combined search and analysis
        const options: OrchestrationOptions = {
          query: prompt,
          maxSearchResults,
          prioritizeGovernmentSources
        };
        
        const result = await this.orchestrationService.process(options);
        
        res.status(200).json({
          status: 'success',
          data: {
            prompt,
            searchResults: result.searchResults,
            analysis: result.analysis,
            processingStatus: result.status
          }
        });
      } else {
        // Use geminiWebSearchService directly for search-only results
        const searchOptions: GeminiWebSearchRequestOptions = {
          query: prompt,
          maxResults: maxSearchResults,
          focus: prioritizeGovernmentSources ? 'government' : 'all'
        };
        
        const searchResults = await this.geminiWebSearchService.complianceSearch(searchOptions);
        
        res.status(200).json({
          status: 'success',
          data: {
            prompt,
            searchResults
          }
        });
      }
    } catch (error) {
      logger.error('Error processing text prompt:', error);
      next(error);
    }
  }
}

// Export controller instance
export const textPromptController = new TextPromptController(); 