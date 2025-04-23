import { logger } from '../utils/logger';
import { MistralOcrService } from './mistralOcr.service';
import { GeminiWebSearchService } from './geminiWebSearch.service';
import { GeminiService } from './gemini.service';
import { MistralOCRResponse } from '../models/MistralOCR';
import { GeminiWebSearchResponse, GeminiWebSearchRequestOptions } from '../types/geminiWebSearch.types';
import { GeminiComplianceAnalysisResponse } from '../types/gemini.types';

/**
 * Orchestration response combining data from all services
 */
export interface OrchestrationResponse {
  /** Original user query */
  query: string;
  /** Document URL that was processed (if applicable) */
  documentUrl?: string;
  /** Extracted text from document */
  extractedText?: string;
  /** Web search results */
  searchResults?: GeminiWebSearchResponse;
  /** Gemini analysis of the combined data */
  analysis: GeminiComplianceAnalysisResponse;
  /** Overall processing status */
  status: 'success' | 'partial_success' | 'failed';
  /** Processing timestamps */
  timestamps: {
    started: string;
    completed: string;
  };
  /** Error information if any step failed */
  errors?: {
    documentProcessing?: string;
    searchProcessing?: string;
    analysisProcessing?: string;
  };
}

/**
 * Options for the orchestration service
 */
export interface OrchestrationOptions {
  /** User's original query */
  query: string;
  /** URL of document to process (optional) */
  documentUrl?: string;
  /** Base64 encoded document (optional) */
  documentBase64?: string;
  /** Additional context for the analysis */
  additionalContext?: string;
  /** Max search results to retrieve */
  maxSearchResults?: number;
  /** Whether to prioritize government sources */
  prioritizeGovernmentSources?: boolean;
  /** Maximum timeout for the entire orchestration process (ms) */
  timeoutMs?: number;
}

/**
 * Orchestration service that combines Mistral OCR, Gemini Web Search, and Gemini
 * for comprehensive compliance analysis
 */
export class OrchestrationService {
  private mistralOcrService: MistralOcrService;
  private geminiWebSearchService: GeminiWebSearchService;
  private geminiService: GeminiService;
  
  constructor() {
    this.mistralOcrService = new MistralOcrService();
    this.geminiWebSearchService = new GeminiWebSearchService();
    this.geminiService = new GeminiService();
    
    logger.info('Orchestration service initialized');
  }
  
  /**
   * Process a document and query using all services
   * @param options Orchestration options
   * @returns Combined orchestration response
   */
  async process(options: OrchestrationOptions): Promise<OrchestrationResponse> {
    const startTime = new Date();
    const response: OrchestrationResponse = {
      query: options.query,
      status: 'success',
      timestamps: {
        started: startTime.toISOString(),
        completed: ''
      },
      analysis: {
        text: '',
        summary: '',
        obligations: [],
        recentChanges: [],
        citations: [],
        risks: []
      }
    };
    
    try {
      // Step 1: Process document with Mistral OCR (if provided)
      let documentText = '';
      if (options.documentUrl || options.documentBase64) {
        try {
          documentText = await this.processDocument(options);
          response.documentUrl = options.documentUrl;
          response.extractedText = documentText;
          logger.info('Document processed successfully');
        } catch (error) {
          logger.error('Error processing document:', error);
          response.status = 'partial_success';
          response.errors = {
            ...response.errors,
            documentProcessing: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
      
      // Step 2: Search for relevant information with Gemini Web Search
      let searchResults: GeminiWebSearchResponse | undefined;
      try {
        searchResults = await this.searchRelevantInformation(options, documentText);
        response.searchResults = searchResults;
        logger.info('Gemini Web Search completed successfully');
      } catch (error) {
        logger.error('Error searching with Gemini Web Search:', error);
        response.status = 'partial_success';
        response.errors = {
          ...response.errors,
          searchProcessing: error instanceof Error ? error.message : 'Unknown error'
        };
      }
      
      // Step 3: Analyze combined data with Gemini
      try {
        const analysisResponse = await this.analyzeWithGemini(
          options,
          documentText,
          searchResults
        );
        response.analysis = analysisResponse;
        logger.info('Gemini analysis completed successfully');
      } catch (error) {
        logger.error('Error analyzing with Gemini:', error);
        response.status = options.documentUrl || searchResults ? 'partial_success' : 'failed';
        response.errors = {
          ...response.errors,
          analysisProcessing: error instanceof Error ? error.message : 'Unknown error'
        };
      }
      
    } catch (error) {
      logger.error('Orchestration process error:', error);
      response.status = 'failed';
    } finally {
      // Record completion timestamp
      const endTime = new Date();
      response.timestamps.completed = endTime.toISOString();
      
      // Log processing time
      const processingTimeMs = endTime.getTime() - startTime.getTime();
      logger.info(`Orchestration completed in ${processingTimeMs}ms with status: ${response.status}`);
    }
    
    return response;
  }
  
  /**
   * Process a document using Mistral OCR
   * @param options Orchestration options containing document information
   * @returns Extracted text from the document
   */
  private async processDocument(options: OrchestrationOptions): Promise<string> {
    let ocrResponse: MistralOCRResponse;
    
    if (options.documentUrl) {
      // Process document from URL
      ocrResponse = await this.mistralOcrService.processDocumentFromUrl(
        options.documentUrl
      );
    } else if (options.documentBase64) {
      // Process document from base64 string
      ocrResponse = await this.mistralOcrService.processDocumentFromBase64(
        options.documentBase64
      );
    } else {
      throw new Error('No document URL or base64 provided');
    }
    
    // Extract and format text from OCR response
    return this.mistralOcrService.getFormattedText(ocrResponse);
  }
  
  /**
   * Search for relevant compliance information using Gemini Web Search
   * @param options Orchestration options
   * @param documentText Extracted text from document (if available)
   * @returns Gemini Web Search results
   */
  private async searchRelevantInformation(
    options: OrchestrationOptions,
    documentText: string
  ): Promise<GeminiWebSearchResponse> {
    // Prepare search options
    const searchOptions: GeminiWebSearchRequestOptions = {
      query: options.query,
      maxResults: options.maxSearchResults || 10,
      focus: options.prioritizeGovernmentSources ? 'government' : 'all'
    };
    
    // If document text is available, enhance the query with relevant context
    if (documentText) {
      // Extract key details from document to enhance search
      const documentSummary = this.extractDocumentSummary(documentText);
      
      // Enhance the query with document context
      searchOptions.query = `${options.query} ${documentSummary}`;
    }
    
    // Execute search with Gemini Web Search
    return await this.geminiWebSearchService.complianceSearch(searchOptions);
  }
  
  /**
   * Extract a brief summary from document text to enhance search queries
   * @param documentText Full document text
   * @returns Brief summary with key entities and terms
   */
  private extractDocumentSummary(documentText: string): string {
    // This is a simplified implementation
    // In a real implementation, you would use NLP techniques to extract
    // key entities, dates, regulations, etc.
    
    // For now, just take the first 500 characters
    const summary = documentText.substring(0, 500);
    
    // Remove line breaks and extra whitespace
    return summary.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Analyze combined data with Gemini
   * @param options Orchestration options
   * @param documentText Extracted text from document (if available)
   * @param searchResults Gemini Web Search results (if available)
   * @returns Gemini analysis response
   */
  private async analyzeWithGemini(
    options: OrchestrationOptions,
    documentText: string,
    searchResults?: GeminiWebSearchResponse
  ): Promise<GeminiComplianceAnalysisResponse> {
    // Build context from available data
    let context = '';
    
    // Add document text if available
    if (documentText) {
      context += `DOCUMENT CONTENT:\n${documentText.substring(0, 5000)}\n\n`;
    }
    
    // Add search results if available
    if (searchResults && searchResults.sources.length > 0) {
      context += 'SEARCH RESULTS:\n';
      
      // Format sources with priority on government sources
      searchResults.sources
        .slice(0, 10) // Limit to top 10 sources to avoid token limits
        .forEach((source, index) => {
          context += `[${index + 1}] ${source.title} (${source.isGovernment ? 'GOVERNMENT SOURCE' : 'NON-GOVERNMENT SOURCE'})\n`;
          context += `URL: ${source.url}\n`;
          context += `${source.snippet}\n\n`;
        });
      
      // Add summary if available
      if (searchResults.summary) {
        context += `SEARCH SUMMARY: ${searchResults.summary}\n\n`;
      }
    }
    
    // Add additional context if provided
    if (options.additionalContext) {
      context += `ADDITIONAL CONTEXT:\n${options.additionalContext}\n\n`;
    }
    
    // Send to Gemini for analysis
    return await this.geminiService.analyzeComplianceInfo(context, options.query);
  }
}

// Export singleton instance
export const orchestrationService = new OrchestrationService(); 