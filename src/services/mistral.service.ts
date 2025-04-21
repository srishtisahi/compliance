import axios from 'axios';
import { logger } from '../utils/logger';
import fs from 'fs';
import FormData from 'form-data';
import { MistralApiError, createApiErrorFromAxiosError } from '../api/middlewares/errorHandler';

// Define types for Mistral OCR API
interface MistralOCROptions {
  filePath: string;
  language?: string;
  outputFormat?: 'text' | 'json';
}

interface MistralOCRResponse {
  text: string;
  metadata?: {
    pageCount?: number;
    title?: string;
    author?: string;
    creationDate?: string;
  };
  confidence?: number;
}

/**
 * Service for interacting with Mistral OCR API
 */
export class MistralService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || '';
    this.baseUrl = 'https://api.mistral.ai/v1/ocr';
    
    if (!this.apiKey) {
      logger.warn('Mistral API key is not set. API calls will fail.');
    }
  }
  
  /**
   * Extract text from a document using Mistral OCR API
   */
  async extractText(options: MistralOCROptions): Promise<MistralOCRResponse> {
    try {
      const { filePath, language = 'en', outputFormat = 'text' } = options;
      
      // Check if API key is set
      if (!this.apiKey) {
        throw new MistralApiError('Mistral API key is not set', 500, 'API_KEY_MISSING');
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new MistralApiError(`File not found: ${filePath}`, 400, 'FILE_NOT_FOUND');
      }
      
      // Prepare form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('language', language);
      formData.append('output_format', outputFormat);
      
      // Configure request for Mistral API
      const config = {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      };
      
      // Make API request
      const response = await axios.post(this.baseUrl, formData, config);
      
      // Process response
      const result: MistralOCRResponse = {
        text: response.data.text || '',
        metadata: response.data.metadata || {},
        confidence: response.data.confidence || 0
      };
      
      // Log success
      logger.info(`Successfully extracted text from document: ${filePath}`);
      
      return result;
    } catch (error) {
      logger.error('Error extracting text with Mistral OCR:', error);
      throw createApiErrorFromAxiosError(error, 'mistral');
    }
  }
  
  /**
   * Process legal documents to extract structured information
   */
  async processLegalDocument(filePath: string): Promise<any> {
    try {
      // First extract text from document
      const extractedText = await this.extractText({ filePath });
      
      // Here we would implement additional processing logic for legal documents
      // Like identifying sections, citations, key provisions, etc.
      
      // For now, return a simple structure
      return {
        text: extractedText.text,
        metadata: extractedText.metadata,
        sections: this.identifySections(extractedText.text)
      };
    } catch (error) {
      logger.error('Error processing legal document:', error);
      // If it's already a MistralApiError, just rethrow it
      if (error instanceof MistralApiError) {
        throw error;
      }
      throw new MistralApiError('Failed to process legal document', 500);
    }
  }
  
  /**
   * Identify sections in legal text (simplified implementation)
   */
  private identifySections(text: string): { title: string; content: string }[] {
    // This is a simplified implementation
    // A more sophisticated version would use regex patterns or ML to identify sections
    
    const sections: { title: string; content: string }[] = [];
    const lines = text.split('\n');
    
    let currentSection = { title: 'General', content: '' };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Simple heuristic: lines with less than 50 chars that are uppercase might be section titles
      if (trimmedLine.length < 50 && 
          trimmedLine.length > 0 && 
          trimmedLine === trimmedLine.toUpperCase() && 
          !trimmedLine.endsWith('.')) {
        
        // Save previous section if it has content
        if (currentSection.content.trim().length > 0) {
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = { title: trimmedLine, content: '' };
      } else {
        // Add line to current section
        currentSection.content += line + '\n';
      }
    }
    
    // Add the last section
    if (currentSection.content.trim().length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  }
}

// Export singleton instance
export const mistralService = new MistralService(); 