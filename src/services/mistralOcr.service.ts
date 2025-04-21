import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';
import {
  MistralOCRRequest,
  MistralOCRResponse,
  DocumentUnderstandingRequest,
  DocumentUnderstandingResponse,
  DocumentInput,
  OCRPage
} from '../models/MistralOCR';

/**
 * Configuration for retry logic
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

/**
 * Service for interacting with Mistral OCR API
 */
export class MistralOcrService {
  private apiKey: string;
  private baseUrl: string;
  private client: AxiosInstance;
  private retryConfig: RetryConfig;
  
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || '';
    this.baseUrl = 'https://api.mistral.ai/v1';
    
    if (!this.apiKey) {
      logger.warn('Mistral API key is not set. API calls will fail.');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Configure retry settings
    this.retryConfig = {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffFactor: 2
    };
  }

  /**
   * Execute an API call with retry logic
   * @param apiCall Function that makes the actual API call
   * @returns Promise with the API response
   */
  private async executeWithRetry<T>(apiCall: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // First attempt (attempt=0) or retry attempts
        if (attempt > 0) {
          logger.info(`Retry attempt ${attempt} of ${this.retryConfig.maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Exponential backoff with jitter
          delay = Math.min(
            delay * this.retryConfig.backoffFactor * (1 + 0.2 * Math.random()),
            this.retryConfig.maxDelayMs
          );
        }
        
        return await apiCall();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if it's not a retryable error
        if (!this.isRetryableError(error)) {
          logger.warn('Non-retryable error encountered, aborting retry', { error });
          break;
        }
        
        // If we've used all our retries, we'll fall through to the throw below
        if (attempt === this.retryConfig.maxRetries) {
          logger.error(`All ${this.retryConfig.maxRetries} retry attempts failed`);
        }
      }
    }
    
    // If we got here, all retries failed
    throw lastError || new Error('Unknown error during API call with retry');
  }
  
  /**
   * Determine if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on network errors
    if (!axios.isAxiosError(error)) {
      return true;
    }
    
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    
    // Don't retry on client errors (except 429 too many requests)
    if (status && status >= 400 && status < 500 && status !== 429) {
      return false;
    }
    
    // Retry on all server errors and rate limit errors
    return true;
  }

  /**
   * Format extracted text from OCR pages
   * @param pages Array of OCR pages 
   * @returns Formatted text content
   */
  private formatExtractedText(pages: OCRPage[]): string {
    if (!pages || pages.length === 0) {
      return '';
    }
    
    // Join pages with clear separators
    const formattedText = pages.map((page, index) => {
      // Clean markdown content
      let pageContent = page.markdown || '';
      
      // Normalize whitespace
      pageContent = pageContent.replace(/\s+/g, ' ');
      
      // Remove unnecessary markdown artifacts if needed
      pageContent = pageContent.replace(/\!\[.*?\]\(.*?\)/g, ''); // Remove image references
      
      // Add page information
      return `--- Page ${index + 1} ---\n${pageContent.trim()}`;
    }).join('\n\n');
    
    return formattedText;
  }

  /**
   * Process a document using Mistral OCR API
   * @param document Document input (URL, base64 encoded file)
   * @param includeImageBase64 Whether to include base64 encoded images in response
   * @returns OCR processing results
   */
  async processDocument(
    document: DocumentInput,
    includeImageBase64 = false
  ): Promise<MistralOCRResponse> {
    return this.executeWithRetry(async () => {
      try {
        const requestData: MistralOCRRequest = {
          model: 'mistral-ocr-latest',
          document,
          include_image_base64: includeImageBase64
        };

        const response = await this.client.post<MistralOCRResponse>('/ocr', requestData);
        
        logger.info('Successfully processed document with Mistral OCR');
        return response.data;
      } catch (error) {
        logger.error('Error processing document with Mistral OCR:', error);
        throw this.handleApiError(error);
      }
    });
  }

  /**
   * Process a document via URL
   * @param documentUrl URL of the document to process
   * @param includeImageBase64 Whether to include base64 encoded images in response
   * @returns OCR processing results
   */
  async processDocumentFromUrl(
    documentUrl: string,
    includeImageBase64 = false
  ): Promise<MistralOCRResponse> {
    return this.processDocument(
      {
        type: 'document_url',
        document_url: documentUrl
      },
      includeImageBase64
    );
  }

  /**
   * Process an image via URL
   * @param imageUrl URL of the image to process
   * @param includeImageBase64 Whether to include base64 encoded images in response
   * @returns OCR processing results
   */
  async processImageFromUrl(
    imageUrl: string,
    includeImageBase64 = false
  ): Promise<MistralOCRResponse> {
    return this.processDocument(
      {
        type: 'image_url',
        image_url: imageUrl
      },
      includeImageBase64
    );
  }

  /**
   * Process a document with base64 encoding
   * @param documentBase64 Base64 encoded document
   * @param includeImageBase64 Whether to include base64 encoded images in response
   * @returns OCR processing results
   */
  async processDocumentFromBase64(
    documentBase64: string,
    includeImageBase64 = false
  ): Promise<MistralOCRResponse> {
    return this.processDocument(
      {
        type: 'document_base64',
        document_base64: documentBase64
      },
      includeImageBase64
    );
  }

  /**
   * Process an image with base64 encoding
   * @param imageBase64 Base64 encoded image
   * @param includeImageBase64 Whether to include base64 encoded images in response
   * @returns OCR processing results
   */
  async processImageFromBase64(
    imageBase64: string,
    includeImageBase64 = false
  ): Promise<MistralOCRResponse> {
    return this.processDocument(
      {
        type: 'image_base64',
        image_base64: imageBase64
      },
      includeImageBase64
    );
  }

  /**
   * Get formatted text content from OCR response
   * @param ocrResponse The OCR response
   * @returns Formatted text content
   */
  getFormattedText(ocrResponse: MistralOCRResponse): string {
    return this.formatExtractedText(ocrResponse.pages);
  }

  /**
   * Ask questions about a document using the document understanding capability
   * @param documentUrl URL of the document to analyze
   * @param question Question to ask about the document
   * @param model Model to use for document understanding
   * @returns Response from the model with answer to the question
   */
  async queryDocument(
    documentUrl: string,
    question: string,
    model = 'mistral-small-latest'
  ): Promise<DocumentUnderstandingResponse> {
    return this.executeWithRetry(async () => {
      try {
        const requestData: DocumentUnderstandingRequest = {
          model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: question
                },
                {
                  type: 'document_url',
                  document_url: documentUrl
                }
              ]
            }
          ]
        };

        const response = await this.client.post<DocumentUnderstandingResponse>(
          '/chat/completions',
          requestData
        );
        
        logger.info('Successfully queried document with Mistral');
        return response.data;
      } catch (error) {
        logger.error('Error querying document with Mistral:', error);
        throw this.handleApiError(error);
      }
    });
  }

  /**
   * Handle API errors
   * @param error Error from API call
   * @returns Formatted error
   */
  private handleApiError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      const requestId = error.response?.headers['x-request-id'];
      
      // Add more detailed information for debugging
      const errorDetails = {
        status,
        message,
        requestId,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      };
      
      logger.error('Detailed API error information:', errorDetails);
      
      // More specific error messages based on status code
      if (status === 401) {
        return new Error('Mistral API authentication failed: Please check your API key');
      } else if (status === 400) {
        return new Error(`Mistral API Bad Request: ${message}`);
      } else if (status === 429) {
        return new Error('Mistral API rate limit exceeded: Please try again later');
      } else if (status >= 500) {
        return new Error(`Mistral API Server Error (${status}): ${message}`);
      }
      
      return new Error(`Mistral API Error (${status}): ${message}`);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}

// Export singleton instance
export const mistralOcrService = new MistralOcrService(); 