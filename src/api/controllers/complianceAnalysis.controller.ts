import { Request, Response, NextFunction } from 'express';
import { geminiService } from '../../services/gemini.service';
import { logger } from '../../utils/logger';
import { GeminiComplianceAnalysisResponse } from '../../types/gemini.types';
import { 
  TextAnalysisRequest, 
  DocumentAnalysisRequest, 
  TextAnalysisResponse, 
  DocumentAnalysisResponse,
  ComplianceAnalysisResult,
  ComplianceAnalysisQueryParams,
  ComplianceAnalysisListResponse,
  ComplianceAnalysisListItem
} from '../../types/api.types';
import { GeminiFormattingService, ResponseFormat } from '../../services/geminiFormatting.service';
import ComplianceAnalysisModel from '../../models/ComplianceAnalysis';
import { parsePaginationParams, createPaginationMetadata } from '../../utils/pagination';

// Create an instance of the formatting service
const geminiFormattingService = new GeminiFormattingService(geminiService);

/**
 * Controller for compliance analysis endpoints
 */
export class ComplianceAnalysisController {
  /**
   * Analyze text data for compliance information
   */
  async analyzeText(req: Request<{}, {}, TextAnalysisRequest>, res: Response<TextAnalysisResponse>, next: NextFunction): Promise<void> {
    try {
      const { query, context, responseFormat } = req.body;
      
      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Query is required for compliance analysis'
        });
        return;
      }
      
      const contextData = context || '';
      const format = (responseFormat as ResponseFormat) || 'json';
      
      logger.info(`Processing compliance analysis for query: ${query.substring(0, 50)}...`);

      // Quick bypass with dummy data if SKIP_MONGODB is true
      if (process.env.SKIP_MONGODB === 'true') {
        logger.warn('Using mock data for compliance analysis because SKIP_MONGODB is true');
        
        const mockAnalysis = {
          text: `Mock analysis response for query: ${query}`,
          summary: "This is a mock summary for testing purposes. It simulates a compliance analysis response when MongoDB is skipped.",
          obligations: [
            "Mock obligation 1: All residential bathroom ventilation systems must meet code requirements",
            "Mock obligation 2: Ventilation must provide adequate air exchange rates",
            "Mock obligation 3: Regular inspection and maintenance is required"
          ],
          recentChanges: [
            "Mock recent change: Updated ventilation requirements effective January 2025"
          ],
          citations: [
            {
              text: "Mock citation text from California Building Code",
              source: "Mock California Building Standards Commission"
            }
          ],
          risks: [
            "Mock risk: Non-compliance may result in penalties"
          ]
        };
        
        res.status(200).json({
          success: true,
          data: {
            analysis: mockAnalysis,
            format
          }
        });
        return;
      }
      
      // Use the enhanced formatting service for real analysis
      const enhancedAnalysis = await geminiFormattingService.analyzeComplianceInfo(
        contextData,
        query,
        {
          format,
          exportOptions: {
            includeMetadata: true,
            includeDisclaimer: true,
            includeSources: true,
            includeConfidenceIndicators: true
          }
        }
      );
      
      // If HTML or Markdown format is requested, return as text
      if (format === 'html' || format === 'markdown') {
        res.setHeader('Content-Type', format === 'html' ? 'text/html' : 'text/markdown');
        res.send(enhancedAnalysis);
        return;
      }

      // Save the analysis result to the database
      try {
        // Get user ID from the request if available
        const userId = (req as any).user?.id;
        
        // Extract jurisdiction and category if they exist in the analysis
        const jurisdiction = enhancedAnalysis.summary?.match(/jurisdiction:\s*([^,\n]+)/i)?.[1]?.trim();
        const category = enhancedAnalysis.summary?.match(/category:\s*([^,\n]+)/i)?.[1]?.trim();
        
        await ComplianceAnalysisModel.create({
          query,
          context: contextData,
          result: enhancedAnalysis,
          userId,
          jurisdiction,
          category,
        });
        
        logger.info(`Saved compliance analysis to database for query: ${query.substring(0, 30)}...`);
      } catch (error) {
        // Log error but don't fail the request
        logger.error('Failed to save compliance analysis to database:', error);
      }
      
      // For JSON format, wrap in our standard API response
      res.status(200).json({
        success: true,
        data: {
          analysis: enhancedAnalysis,
          format
        }
      });
    } catch (error) {
      // Enhanced error logging
      logger.error('Error in analyzeText:', error);
      if (error instanceof Error) {
        logger.error('Error message:', error.message);
        logger.error('Error stack:', error.stack);
      }
      // Return a more descriptive error response
      res.status(500).json({
        success: false,
        message: 'Failed to analyze text',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Analyze document data combined with search context
   */
  async analyzeDocument(req: Request<{}, {}, DocumentAnalysisRequest>, res: Response<DocumentAnalysisResponse>, next: NextFunction): Promise<void> {
    try {
      const { documentId, documentText, query, searchResults, responseFormat } = req.body;
      
      if (!documentId || !query) {
        res.status(400).json({
          success: false,
          message: 'Document ID and query are required for document analysis'
        });
        return;
      }
      
      // If document text was not provided, we would normally retrieve it
      // In this example, we'll use the provided text or a placeholder
      const docText = documentText || `Sample document text for document ID: ${documentId}`;
      const searchContext = searchResults?.join('\n') || '';
      const combinedContext = `${docText}\n\n${searchContext}`;
      const format = (responseFormat as ResponseFormat) || 'json';
      
      logger.info(`Processing document analysis for document ID: ${documentId}`);
      
      // Quick bypass with dummy data if SKIP_MONGODB is true
      if (process.env.SKIP_MONGODB === 'true') {
        logger.warn('Using mock data for document analysis because SKIP_MONGODB is true');
        
        const mockAnalysis = {
          text: `Mock document analysis for documentId: ${documentId}`,
          summary: "This is a mock document analysis summary for testing purposes. It simulates a document analysis response when MongoDB is skipped.",
          obligations: [
            "Mock document obligation 1: Document contains requirements that must be followed",
            "Mock document obligation 2: Specific regulatory requirements mentioned in sections 3-5",
            "Mock document obligation 3: Compliance timeline is specified in the document"
          ],
          recentChanges: [
            "Mock document changes: The document references recent regulatory updates from 2024"
          ],
          citations: [
            {
              text: "Mock document citation: References California Code section 4.2.1",
              source: "California Building Standards"
            }
          ],
          risks: [
            "Mock document risk: Document highlights potential compliance risks in section 7"
          ]
        };
        
        res.status(200).json({
          success: true,
          data: {
            documentId,
            analysis: mockAnalysis,
            format
          }
        });
        return;
      }
      
      // Use the enhanced formatting service
      const enhancedAnalysis = await geminiFormattingService.analyzeComplianceDocument(
        combinedContext,
        query,
        {
          format,
          exportOptions: {
            includeMetadata: true,
            includeDisclaimer: true,
            includeSources: true,
            includeConfidenceIndicators: true
          }
        }
      );
      
      // If HTML or Markdown format is requested, return as text
      if (format === 'html' || format === 'markdown') {
        res.setHeader('Content-Type', format === 'html' ? 'text/html' : 'text/markdown');
        res.send(enhancedAnalysis);
        return;
      }
      
      // Save the analysis result to the database
      try {
        // Get user ID from the request if available
        const userId = (req as any).user?.id;
        
        // Extract jurisdiction and category if they exist in the analysis
        const jurisdiction = enhancedAnalysis.summary?.match(/jurisdiction:\s*([^,\n]+)/i)?.[1]?.trim();
        const category = enhancedAnalysis.summary?.match(/category:\s*([^,\n]+)/i)?.[1]?.trim();
        
        await ComplianceAnalysisModel.create({
          query,
          context: combinedContext,
          documentId,
          result: enhancedAnalysis,
          userId,
          jurisdiction,
          category,
        });
        
        logger.info(`Saved document compliance analysis to database for document ID: ${documentId}`);
      } catch (error) {
        // Log error but don't fail the request
        logger.error('Failed to save compliance analysis to database:', error);
      }
      
      // For JSON format, wrap in our standard API response
      res.status(200).json({
        success: true,
        data: {
          documentId,
          analysis: enhancedAnalysis,
          format
        }
      });
    } catch (error) {
      // Enhanced error logging
      logger.error('Error in analyzeDocument:', error);
      if (error instanceof Error) {
        logger.error('Error message:', error.message);
        logger.error('Error stack:', error.stack);
      }
      // Return a more descriptive error response
      res.status(500).json({
        success: false,
        message: 'Failed to analyze document',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get paginated compliance analysis results with filtering
   */
  async getAnalysisResults(req: Request, res: Response<ComplianceAnalysisListResponse>, next: NextFunction): Promise<void> {
    try {
      const queryParams: ComplianceAnalysisQueryParams = req.query as any;
      
      // Parse pagination parameters
      const { page, limit, skip, sort } = parsePaginationParams(queryParams);
      
      // Build filter conditions
      const filter: Record<string, any> = {};
      
      // Add user ID filter if present
      if (queryParams.userId) {
        filter.userId = queryParams.userId;
      }
      
      // Add document ID filter if present
      if (queryParams.documentId) {
        filter.documentId = queryParams.documentId;
      }
      
      // Add jurisdiction filter if present
      if (queryParams.jurisdiction) {
        filter.jurisdiction = queryParams.jurisdiction;
      }
      
      // Add category filter if present
      if (queryParams.category) {
        filter.category = queryParams.category;
      }
      
      // Add tags filter if present (comma-separated)
      if (queryParams.tags) {
        const tagList = queryParams.tags.split(',').map(tag => tag.trim());
        filter.tags = { $in: tagList };
      }
      
      // Add date range filter if present
      if (queryParams.startDate || queryParams.endDate) {
        filter.createdAt = {};
        
        if (queryParams.startDate) {
          filter.createdAt.$gte = new Date(queryParams.startDate);
        }
        
        if (queryParams.endDate) {
          filter.createdAt.$lte = new Date(queryParams.endDate);
        }
      }
      
      // Add text search if present
      if (queryParams.search) {
        filter.$text = { $search: queryParams.search };
      }
      
      // Execute count query for pagination
      const total = await ComplianceAnalysisModel.countDocuments(filter);
      
      // Execute main query with pagination
      const results = await ComplianceAnalysisModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // Map results to response format
      const items: ComplianceAnalysisListItem[] = results.map(item => ({
        id: item._id.toString(),
        query: item.query,
        documentId: item.documentId,
        summary: item.result.summary,
        jurisdiction: item.jurisdiction,
        category: item.category,
        tags: item.tags,
        createdAt: item.createdAt.toISOString(),
        userId: item.userId,
      }));
      
      // Create pagination metadata
      const pagination = createPaginationMetadata(total, page, limit);
      
      // Return response
      res.status(200).json({
        success: true,
        data: {
          items,
          pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single compliance analysis result by ID
   */
  async getAnalysisById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Analysis ID is required'
        });
        return;
      }
      
      // Find the analysis by ID
      const analysis = await ComplianceAnalysisModel.findById(id).lean();
      
      if (!analysis) {
        res.status(404).json({
          success: false,
          message: 'Compliance analysis not found'
        });
        return;
      }
      
      // Return the analysis
      res.status(200).json({
        success: true,
        data: {
          id: analysis._id.toString(),
          query: analysis.query,
          documentId: analysis.documentId,
          result: analysis.result,
          jurisdiction: analysis.jurisdiction,
          category: analysis.category,
          tags: analysis.tags,
          createdAt: analysis.createdAt.toISOString(),
          updatedAt: analysis.updatedAt.toISOString(),
          userId: analysis.userId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const complianceAnalysisController = new ComplianceAnalysisController(); 