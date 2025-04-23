import { GeminiService } from '@/lib/services/gemini.service'; // Updated path
import { 
  formatComplianceResponse, 
  FormattedComplianceResponse 
} from '@/lib/utils/geminiResponseFormatter'; // Updated path
import { 
  exportAsHtml, 
  exportAsMarkdown, 
  exportAsClientJson, 
  ExportOptions 
} from '@/lib/utils/geminiResponseExporter'; // Updated path
import { logger } from '@/lib/utils/logger'; // Updated path
import { GeminiComplianceAnalysisResponse } from '@/lib/types/gemini.types'; // Updated path

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
  
  constructor(geminiServiceInstance?: GeminiService) {
    // Use the provided instance or create a new one (singleton from gemini.service.ts)
    this.geminiService = geminiServiceInstance || new GeminiService(); 
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
  ): Promise<any> { // Return type is any because it could be string (html/md) or object (json)
    try {
      // Get raw response from Gemini API 
      // Assuming analyzeComplianceInfo exists in geminiService (based on backend code)
      const rawResponse: string = 
        await this.geminiService.analyzeComplianceInfo(context, query);
      
      if (options.format === 'raw') {
        return rawResponse; // Return raw Gemini response if requested
      }
      
      const formattedResponse: FormattedComplianceResponse = 
        formatComplianceResponse(rawResponse, query);
        
      return this.formatResponse(formattedResponse, options);
    } catch (error) {
      logger.error('Error in enhanced compliance analysis:', error);
      throw error; // Re-throw the error to be handled by the API route
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
  ): Promise<any> { // Return type is any because it could be string (html/md) or object (json)
    try {
      // Get raw response from Gemini API
      // We need a method in GeminiService specifically for documents or adapt analyzeComplianceInfo
      // For now, let's assume analyzeComplianceInfo can handle document context too.
      // A better approach might be a dedicated method in GeminiService:
      // const rawResponse = await this.geminiService.analyzeDocument({ documentText, query });
      
      // Using analyzeComplianceInfo for now, passing document text as context:
      logger.info('Calling GeminiService to analyze document text as context...')
      logger.debug('[geminiFormattingService] Context received:', documentText ? `[Context Present - Snippet]: ${documentText.substring(0, 200)}...` : '[Context Missing or Empty]');
      const rawResponse: string = 
        await this.geminiService.analyzeComplianceInfo(documentText, query);
        
      if (options.format === 'raw') {
        return rawResponse; // Return raw Gemini response if requested
      }
      
      const formattedResponse: FormattedComplianceResponse = 
        formatComplianceResponse(rawResponse, query);
        
      return this.formatResponse(formattedResponse, options);
    } catch (error) {
      logger.error('Error in enhanced document analysis:', error);
      throw error; // Re-throw the error to be handled by the API route
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
  ): any { // Return type is any because it could be string (html/md) or object (json)
    const { format = 'json', exportOptions = {} } = options;
    
    switch (format) {
      case 'html':
        return exportAsHtml(formattedResponse, exportOptions);
      case 'markdown':
        return exportAsMarkdown(formattedResponse, exportOptions);
      case 'json':
      default:
        // Default to client-friendly JSON
        return exportAsClientJson(formattedResponse, exportOptions);
    }
  }
}

// Export a singleton instance (optional, depends on usage pattern)
export const geminiFormattingService = new GeminiFormattingService(); 