import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
// import { connectDB } from '@/lib/config/database'; // <-- REMOVE DB import
import { documentValidator } from '@/lib/utils/documentValidator';
// Use the legacy build for Node.js environment
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'; // <-- Remove unused import
import { PdfReader } from 'pdfreader'; // <-- Import PdfReader
// import { documentService } from '@/lib/services/document.service'; // <-- REMOVE Service import
// import mongoose from 'mongoose'; // <-- REMOVE Mongoose import
// NEW Imports for Gemini Integration
import { geminiFormattingService, ResponseFormat } from '@/lib/services/geminiFormatting.service';
import { ComplianceAnalysisResult } from '@/lib/types/api.types'; // Assuming this type exists

// Ensure environment variables are loaded (might need dotenv for local dev if not using Next.js built-in)
// import dotenv from 'dotenv';
// dotenv.config({ path: '.env.local' }); // Adjust path if necessary

// Worker source is typically not needed for the legacy Node.js build
// try {
//   pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';
// } catch (error) {
//   logger.warn('Could not set pdfjsLib.GlobalWorkerOptions.workerSrc...', error);
// }

export async function POST(request: NextRequest) {
  logger.info('Received request POST /api/documents/upload');

  try {
    // --- Database Connection ---
    // await connectDB(); // <-- REMOVE DB call
    // logger.debug('Database connection established.');

    // --- Authentication Placeholder ---
    // TODO: Implement proper authentication and retrieve userId
    const userId = 'user_placeholder_id'; // !! REPLACE WITH ACTUAL AUTH !! Use simple string
    logger.warn(`Using placeholder userId: ${userId}`);

    // --- FormData Parsing ---
    const formData = await request.formData();
    const file = formData.get('document') as File | null;
    const sourceType = (formData.get('sourceType') as string | null) || 'private'; // Default to private

    if (!file) {
      logger.warn('No file found in FormData');
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 }); // Use success/message pattern
    }

    logger.info(`File received: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
    logger.info(`Source Type: ${sourceType}`);

    // --- Validation ---
    if (!documentValidator.isFileTypeSupported(file.type)) {
       const supportedTypes = documentValidator.getSupportedFileTypesString();
       const message = `Unsupported file type: ${file.type}. Supported types: ${supportedTypes}`;
       logger.warn(message);
       return NextResponse.json({ success: false, message }, { status: 415 }); // 415 Unsupported Media Type
    }

    if (!documentValidator.isValidFileSize(file.size)) {
      const message = `File size exceeds the limit. Size: ${documentValidator.formatFileSize(file.size)}`;
      logger.warn(message);
      return NextResponse.json({ success: false, message }, { status: 413 }); // 413 Payload Too Large
    }

    // --- Read File Buffer ---
    const fileBuffer = Buffer.from(await file.arrayBuffer()); // Need Buffer for pdfreader
    logger.debug('File content read into buffer.');

    // --- Extract Text using pdfreader ---
    let extractedText = '';
    try {
      if (file.type === 'application/pdf') {
        // Use a Promise to handle the asynchronous nature of pdfreader
        extractedText = await new Promise<string>((resolve, reject) => {
          const reader = new PdfReader(null); // Provide options if needed
          let textAccumulator = '';
          reader.parseBuffer(fileBuffer, (err, item) => {
            if (err) {
              logger.error('Error during pdfreader parsing:', err);
              // Explicitly create an Error object for rejection
              let errMsg = 'Text extraction failed: pdfreader error';
              // Refined check for Error-like object
              if (typeof err === 'object' && err !== null && 'message' in err) {
                  errMsg = `Text extraction failed: ${(err as Error).message}`;
              } else if (typeof err === 'string') {
                  errMsg = `Text extraction failed: ${err}`;
              }
              // Ensure a new Error object is always rejected
              reject(new Error(errMsg));
            } else if (!item) {
              // End of buffer processing
              logger.info(`Text extracted successfully using pdfreader (length: ${textAccumulator.length})`);
              resolve(textAccumulator);
            } else if (item.text) {
              // Append text item, adding a space for separation
              textAccumulator += item.text + ' '; 
            }
          });
        });

        // Clean up extra whitespace AFTER the promise resolves
        if (extractedText) {
          const originalLength = extractedText.length;
          extractedText = extractedText.replace(/\s+/g, ' ').trim();
          logger.info(`Cleaned extracted text. Original length: ${originalLength}, New length: ${extractedText.length}`);
        }

      } else {
        logger.warn(`File type is ${file.type}, not PDF. Skipping text extraction.`);
      }
      logger.debug(`Extracted Text Snippet (if any): ${extractedText?.substring(0, 200)}...`);
    } catch (parseError: unknown) {
      logger.error('pdfreader failed:', parseError);
      // Type guard to check if it is an Error object
      let errorMessage = 'Text extraction failed: Unknown error';
      if (parseError instanceof Error) {
        errorMessage = `Text extraction failed: ${parseError.message}`;
      } else if (typeof parseError === 'string') {
        errorMessage = `Text extraction failed: ${parseError}`;
      }
      
      return NextResponse.json(
        { success: false, message: errorMessage }, 
        { status: 500 }
      );
    }

    // --- Call Service --- (Skipped as DB is removed)
    // logger.debug('Calling documentService.processUpload');
    // const document = await documentService.processUpload( ... );
    // logger.info(`Document record created in DB: ${document._id}`);

    // --- Placeholder for Document ID ---
    const mockDocumentId = `temp-id-${Date.now()}`;
    logger.info(`Using placeholder Document ID: ${mockDocumentId}`);

    // --- *** NEW: Call Gemini Analysis *** ---
    let analysisResult: ComplianceAnalysisResult | null = null;
    let analysisError: string | null = null;

    if (extractedText && extractedText.trim().length > 0) {
      logger.info(`Calling Gemini service for document ${mockDocumentId}`);
      try {
        // Use a default query for now, or adapt to get query from request if needed
        const analysisQuery = "Analyze this document for construction compliance issues, summarizing key obligations, risks, and recent changes.";
        // Assume default format is 'json' for the analysis result structure
        const responseFormat: ResponseFormat = 'json';

        // Make sure the service method returns the expected structure
        analysisResult = await geminiFormattingService.analyzeComplianceDocument(
          extractedText, // Use extracted text as context
          analysisQuery,
          { format: responseFormat }
        );
        logger.info(`Gemini analysis completed successfully for document ${mockDocumentId}`);

      } catch (geminiError: any) {
        logger.error(`Gemini analysis failed for document ${mockDocumentId}:`, geminiError);
        analysisError = geminiError instanceof Error ? geminiError.message : 'Gemini analysis failed';
        // Decide if failure to analyze should fail the whole request
        // For now, we'll return the error in the response but still succeed overall (200 OK)
        // To fail the request, you could return a 500 error here instead:
        // return NextResponse.json({ success: false, message: `Analysis failed: ${analysisError}` }, { status: 500 });
      }
    } else {
      logger.warn(`Skipping Gemini analysis for document ${mockDocumentId} because extracted text is empty.`);
      analysisError = 'No text content found in the document to analyze.';
    }
    // --- *** END NEW: Call Gemini Analysis *** ---

    // --- Format Response (Now includes analysis) ---
    return NextResponse.json(
      {
        success: true,
        message: analysisError
          ? `Document processed with analysis errors: ${analysisError}`
          : 'Document processed and analyzed successfully (DB storage skipped)',
        data: {
          documentId: mockDocumentId,
          filename: file.name,
          // extractedText: extractedText, // Optionally remove text from response if large
          analysis: analysisResult, // Include analysis results
          analysisError: analysisError, // Include any analysis error message
          processingStatus: analysisResult ? 'ANALYZED_NO_DB' : 'TEXT_EXTRACTED_NO_ANALYSIS_NO_DB',
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    logger.error('Error handling document upload in API route:', error);
    // Ensure consistent error response format
    const message = error.message || 'Internal Server Error during upload';
    const status = error.status || 500; 
    return NextResponse.json(
      { success: false, message },
      { status }
    );
  }
}

// Optional: Add handler for other methods if needed, e.g., GET
// export async function GET(request: NextRequest) { ... } 