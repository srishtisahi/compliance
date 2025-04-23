import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { geminiFormattingService, ResponseFormat } from '@/lib/services/geminiFormatting.service';
import { DocumentAnalysisRequest } from '@/lib/types/api.types';
import { ApiError } from '@/lib/errors/errorHandler';
// Import connectDB and model if/when DB saving is re-enabled
// import { connectDB } from '@/lib/config/database'; 
// import ComplianceAnalysisModel from '@/lib/models/ComplianceAnalysis';

export async function POST(request: NextRequest) {
  logger.info('Received request POST /api/compliance/analyze/document');

  try {
    // --> Log the raw request body <--
    const requestBody = await request.json();
    logger.debug('Analysis route received request body:', requestBody); 

    const body: DocumentAnalysisRequest = requestBody; // Use the already parsed body
    const { documentId, documentText, query, searchResults, responseFormat = 'json' } = body;

    // --> ADD LOGGING HERE <--
    logger.debug(`Received documentText for analysis: ${documentText ? '[Text Provided]' : '[Text NOT Provided]'}`); 
    if (documentText) {
      logger.debug(`DocumentText Snippet: ${documentText.substring(0, 200)}...`); // Log snippet if present
    }

    // --- Validation ---
    if (!documentId || !query) {
      return NextResponse.json(
        { success: false, message: 'Document ID and query are required' },
        { status: 400 }
      );
    }
    if (!documentText) {
        logger.warn(`Document text not provided for documentId: ${documentId}. Analysis might be less accurate.`);
    }

    // --- Authentication Placeholder ---
    const userId = 'user_placeholder_id';

    // --- Prepare Context ---
    const docText = documentText || `Placeholder text for document ID: ${documentId}. Document text was not provided in the request.`;
    const searchContext = searchResults?.join('\n') || '';

    // --> Add logs before combining <--
    logger.debug('[Analysis Route] docText value (first 200 chars):', docText?.substring(0, 200));
    logger.debug('[Analysis Route] searchContext value (first 200 chars):', searchContext?.substring(0, 200));

    const combinedContext = `${docText}\n\nSearch Results Context:\n${searchContext}`.trim();

    // --> Log combinedContext immediately after creation <--
    logger.debug('[Analysis Route] combinedContext value (first 200 chars):', combinedContext?.substring(0, 200));

    logger.info(`Analyzing documentId: ${documentId} with query: ${query.substring(0, 50)}...`);

    // --- Call Analysis Service ---
    const analysisResult = await geminiFormattingService.analyzeComplianceDocument(
      combinedContext,
      query,
      { format: responseFormat as ResponseFormat } 
    );

    // --- Handle Different Response Formats ---
    if (responseFormat === 'html' || responseFormat === 'markdown') {
      const contentType = responseFormat === 'html' ? 'text/html' : 'text/markdown';
      return new NextResponse(analysisResult, {
        status: 200,
        headers: { 'Content-Type': contentType },
      });
    }

    // --- Format JSON Response ---
    return NextResponse.json(
      {
        success: true,
        data: {
          documentId,
          analysis: analysisResult, 
          format: responseFormat,
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    logger.error('Error handling document analysis in API route:', error);
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Internal Server Error during analysis';
    return NextResponse.json(
      { success: false, message: message },
      { status: statusCode }
    );
  }
} 