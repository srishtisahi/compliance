import { GeminiService } from './gemini.service';
import { 
  formatComplianceResponse, 
  FormattedComplianceResponse 
} from '../utils/geminiResponseFormatter';
import { 
  exportAsHtml, 
  exportAsMarkdown, 
  exportAsClientJson, 
  ExportOptions 
} from '../utils/geminiResponseExporter';
import { logger } from '../utils/logger';
import { GeminiComplianceAnalysisResponse } from '../types/gemini.types';

/**
 * Response format options
 */
export type ResponseFormat = 'json' | 'html' | 'markdown' | 'raw';

/**
 * Options for the enhanced Gemini response
 */
export interface EnhancedGeminiOptions {
  format?: ResponseFormat;
  exportOptions?: ExportOptions;
}

/**
 * Service for handling Gemini API responses with enhanced formatting
 */
export class GeminiFormattingService {
  private geminiService: GeminiService;
  
  constructor(geminiService?: GeminiService) {
    this.geminiService = geminiService || new GeminiService();
  }
  
  /**
   * Analyze compliance information and return enhanced formatted response
   * @param context - Context information for the query
   * @param query - User query for compliance analysis
   * @param options - Response formatting options
   * @returns Formatted response in the requested format
   */
  async analyzeComplianceInfo(
    context: string,
    query: string,
    options: EnhancedGeminiOptions = {}
  ): Promise<any> {
    try {
      // Get raw response from Gemini API
      const rawResponse: GeminiComplianceAnalysisResponse = 
        await this.geminiService.analyzeComplianceInfo(context, query);
      
      // If raw format requested, return the unmodified response
      if (options.format === 'raw') {
        return rawResponse;
      }
      
      // Format the response with source attribution and confidence levels
      const formattedResponse: FormattedComplianceResponse = 
        formatComplianceResponse(rawResponse, query);
      
      // Return the response in the requested format
      return this.formatResponse(formattedResponse, options);
    } catch (error) {
      logger.error('Error in enhanced compliance analysis:', error);
      throw error;
    }
  }
  
  /**
   * Analyze compliance document and return enhanced formatted response
   * @param documentText - Text extracted from the document
   * @param query - User query for document analysis
   * @param options - Response formatting options
   * @returns Formatted response in the requested format
   */
  async analyzeComplianceDocument(
    documentText: string,
    query: string,
    options: EnhancedGeminiOptions = {}
  ): Promise<any> {
    try {
      // Get raw response from Gemini API
      const rawResponse: GeminiComplianceAnalysisResponse = 
        await this.geminiService.analyzeComplianceDocument(documentText, query);
      
      // If raw format requested, return the unmodified response
      if (options.format === 'raw') {
        return rawResponse;
      }
      
      // Format the response with source attribution and confidence levels
      const formattedResponse: FormattedComplianceResponse = 
        formatComplianceResponse(rawResponse, query);
      
      // Return the response in the requested format
      return this.formatResponse(formattedResponse, options);
    } catch (error) {
      logger.error('Error in enhanced document analysis:', error);
      throw error;
    }
  }
  
  /**
   * Format the response according to the requested format
   * @param formattedResponse - Structured response with confidence levels
   * @param options - Output format options
   * @returns Formatted response in the requested format
   */
  private formatResponse(
    formattedResponse: FormattedComplianceResponse,
    options: EnhancedGeminiOptions
  ): any {
    const { format = 'json', exportOptions = {} } = options;
    
    switch (format) {
      case 'html':
        return exportAsHtml(formattedResponse, exportOptions);
      
      case 'markdown':
        return exportAsMarkdown(formattedResponse, exportOptions);
      
      case 'json':
        return exportAsClientJson(formattedResponse, exportOptions);
      
      default:
        // Default to the full formatted response
        return formattedResponse;
    }
  }
} 