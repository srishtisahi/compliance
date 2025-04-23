import { Request, Response, NextFunction } from 'express';
import { orchestrationService, OrchestrationOptions } from '../../services/orchestration.service';
import { logger } from '../../utils/logger';

/**
 * Controller for orchestration endpoints
 */
export class OrchestrationController {
  constructor() {
    // Bind methods to this instance
    this.processQuery = this.processQuery.bind(this);
    this.processDocument = this.processDocument.bind(this);
    this.search = this.search.bind(this);
  }

  /**
   * Process a query with document URL and Gemini Web Search
   * @route POST /api/orchestration/process
   */
  async processQuery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        query, 
        documentUrl, 
        documentBase64,
        additionalContext,
        maxSearchResults,
        prioritizeGovernmentSources,
        timeoutMs 
      } = req.body;

      // Validate required parameters
      if (!query) {
        res.status(400).json({
          status: 'error',
          message: 'Query is required'
        });
        return;
      }

      // Prepare orchestration options
      const options: OrchestrationOptions = {
        query,
        documentUrl,
        documentBase64,
        additionalContext,
        maxSearchResults,
        prioritizeGovernmentSources,
        timeoutMs
      };

      // Process the request with orchestration service
      const result = await orchestrationService.process(options);

      // Return response based on status
      if (result.status === 'failed') {
        res.status(500).json({
          status: 'error',
          message: 'Orchestration process failed',
          errors: result.errors,
          result
        });
      } else {
        res.status(200).json({
          status: 'success',
          data: result
        });
      }
    } catch (error) {
      logger.error('Error in orchestration controller:', error);
      next(error);
    }
  }

  /**
   * Process a document with Mistral OCR
   * @route POST /api/orchestration/process-document
   */
  async processDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentUrl, documentBase64 } = req.body;

      // Validate required parameters
      if (!documentUrl && !documentBase64) {
        res.status(400).json({
          status: 'error',
          message: 'Either documentUrl or documentBase64 is required'
        });
        return;
      }

      // Process document only
      const options: OrchestrationOptions = {
        query: 'Document processing request',
        documentUrl,
        documentBase64
      };

      // Process just the document step
      const result = await orchestrationService.process(options);

      res.status(200).json({
        status: 'success',
        data: {
          documentUrl: result.documentUrl,
          extractedText: result.extractedText,
          status: result.status,
          errors: result.errors?.documentProcessing ? { documentProcessing: result.errors.documentProcessing } : undefined
        }
      });
    } catch (error) {
      logger.error('Error in document processing:', error);
      next(error);
    }
  }

  /**
   * Search for compliance information with Gemini Web Search
   * @route POST /api/orchestration/search
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        query, 
        maxSearchResults, 
        prioritizeGovernmentSources 
      } = req.body;

      // Validate required parameters
      if (!query) {
        res.status(400).json({
          status: 'error',
          message: 'Query is required'
        });
        return;
      }

      // Process search only
      const options: OrchestrationOptions = {
        query,
        maxSearchResults,
        prioritizeGovernmentSources
      };

      // Process just the search step
      const result = await orchestrationService.process(options);

      res.status(200).json({
        status: 'success',
        data: {
          query: result.query,
          searchResults: result.searchResults,
          status: result.status,
          errors: result.errors?.searchProcessing ? { searchProcessing: result.errors.searchProcessing } : undefined
        }
      });
    } catch (error) {
      logger.error('Error in search processing:', error);
      next(error);
    }
  }
}

// Export controller instance
export const orchestrationController = new OrchestrationController(); 