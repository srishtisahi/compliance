/**
 * Example usage of Mistral OCR service
 */
import { mistralOcrService } from '../services/mistralOcr.service';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * Process a document using a URL
 */
async function processDocumentFromUrl() {
  try {
    // Example PDF URL
    const documentUrl = 'https://arxiv.org/pdf/2201.04234';
    
    // Process the document
    const ocrResult = await mistralOcrService.processDocumentFromUrl(documentUrl);
    
    // Log the extracted text from the first page
    logger.info(`First page content:\n${ocrResult.pages[0].markdown.substring(0, 500)}...`);
    
    // Return full result
    return ocrResult;
  } catch (error) {
    logger.error('Error processing document from URL:', error);
    throw error;
  }
}

/**
 * Process an image using a URL
 */
async function processImageFromUrl() {
  try {
    // Example image URL
    const imageUrl = 'https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png';
    
    // Process the image
    const ocrResult = await mistralOcrService.processImageFromUrl(imageUrl);
    
    // Log the extracted text
    logger.info(`Extracted text from image:\n${ocrResult.pages[0].markdown}`);
    
    return ocrResult;
  } catch (error) {
    logger.error('Error processing image from URL:', error);
    throw error;
  }
}

/**
 * Process a local document using base64 encoding
 */
async function processLocalDocument(filePath: string) {
  try {
    // Read file to Base64
    const fileContent = fs.readFileSync(filePath);
    const base64Content = fileContent.toString('base64');
    
    // Process document
    const ocrResult = await mistralOcrService.processDocumentFromBase64(base64Content);
    
    // Log number of pages processed
    logger.info(`Processed ${ocrResult.pages.length} pages from local document`);
    
    return ocrResult;
  } catch (error) {
    logger.error('Error processing local document:', error);
    throw error;
  }
}

/**
 * Ask a question about a document
 */
async function queryDocument() {
  try {
    // Example document URL
    const documentUrl = 'https://arxiv.org/pdf/1805.04770';
    
    // Question about the document
    const question = 'What is the main topic of this paper?';
    
    // Query the document
    const response = await mistralOcrService.queryDocument(documentUrl, question);
    
    // Log the answer
    const answer = response.choices[0].message.content;
    logger.info(`Answer: ${answer}`);
    
    return response;
  } catch (error) {
    logger.error('Error querying document:', error);
    throw error;
  }
}

/**
 * Main function to run examples
 */
async function runExamples() {
  logger.info('Running Mistral OCR examples...');
  
  // Example 1: Process document from URL
  logger.info('\n=== Example 1: Process document from URL ===');
  await processDocumentFromUrl();
  
  // Example 2: Process image from URL
  logger.info('\n=== Example 2: Process image from URL ===');
  await processImageFromUrl();
  
  // Example 3: Query a document
  logger.info('\n=== Example 3: Query a document ===');
  await queryDocument();
  
  // Example 4: Process local document (uncomment and provide path)
  // const localFilePath = path.resolve(__dirname, '../documents/sample.pdf');
  // logger.info('\n=== Example 4: Process local document ===');
  // await processLocalDocument(localFilePath);
  
  logger.info('All examples completed.');
}

// Run the examples when this file is executed directly
if (require.main === module) {
  runExamples().catch(error => {
    logger.error('Error running examples:', error);
    process.exit(1);
  });
}

// Export functions for use in other files
export {
  processDocumentFromUrl,
  processImageFromUrl,
  processLocalDocument,
  queryDocument,
  runExamples
}; 