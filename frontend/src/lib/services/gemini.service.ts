import axios from 'axios';
import { logger } from '@/lib/utils/logger'; // Updated path
import { GeminiApiError, createApiErrorFromAxiosError } from '@/lib/errors/errorHandler'; // Updated path

// Define types for Gemini API (Internal to this service)
interface GeminiRequestOptions {
  prompt: string;
  maxOutputTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
}

interface GeminiResponse {
  text: string;
  safetyAttributes?: {
    categories: string[];
    blocked: boolean;
    scores: number[];
  };
}

/**
 * Service for interacting with Google Gemini Pro API
 */
export class GeminiService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  
  constructor() {
    // Use process.env directly for Next.js environment variables
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-1.5-pro-latest';
    
    if (!this.apiKey) {
      logger.warn('Google Gemini API key (GEMINI_API_KEY) is not set. API calls will fail.');
    }
  }
  
  /**
   * Generate a summary or analysis using Google Gemini
   */
  async generateContent(options: GeminiRequestOptions): Promise<GeminiResponse> {
    try {
      const { 
        prompt, 
        maxOutputTokens = 1024, 
        temperature = 0.7,
        topK = 40,
        topP = 0.95
      } = options;
      
      if (!this.apiKey) {
        throw new GeminiApiError('Google Gemini API key is not set', 500, 'API_KEY_MISSING');
      }
      
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature,
          topK,
          topP,
          maxOutputTokens,
          stopSequences: []
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };
      
      const response = await axios.post(url, requestBody);
      
      let outputText = '';
      let safetyAttributes = undefined;
      
      // Safely access nested properties
      const candidate = response.data?.candidates?.[0];
      if (candidate) {
        outputText = candidate.content?.parts?.[0]?.text || '';
        
        logger.debug('Received raw text from Gemini:', outputText.substring(0, 200) + (outputText.length > 200 ? '...' : '')); // Log snippet
        
        if (candidate.safetyRatings) {
           safetyAttributes = {
             categories: candidate.safetyRatings.map((rating: any) => rating.category),
             // Check if any rating was blocked
             blocked: candidate.finishReason === 'SAFETY', 
             scores: candidate.safetyRatings.map((rating: any) => rating.score) // Assuming score exists
           };
         } else {
           // If safetyRatings is not present, assume not blocked based on finishReason
           safetyAttributes = {
             categories: [],
             blocked: candidate.finishReason === 'SAFETY', 
             scores: []
           };
         }
      }
      
      // Handle cases where the response might be blocked due to safety settings
      if (safetyAttributes?.blocked) {
        logger.warn('Gemini response was blocked due to safety settings.');
        // Decide how to handle blocked content (e.g., return empty string or specific message)
        // outputText = '[Content blocked due to safety settings]'; 
      }
      
      return {
        text: outputText,
        safetyAttributes
      };
    } catch (error) {
      logger.error('Error generating content with Gemini:', error);
      // Use the factory function to create the appropriate error
      throw createApiErrorFromAxiosError(error, 'gemini');
    }
  }
  
  /**
   * Analyze and summarize compliance information
   * NOTE: This specific method might be better placed in a dedicated compliance analysis service
   *      or called by the formatting service.
   */
  async analyzeComplianceInfo(context: string, query: string): Promise<string> {
    try {
      logger.debug('Context provided to analyzeComplianceInfo:', context.substring(0, 500) + (context.length > 500 ? '...' : '')); // Log snippet of context

      const prompt = `
As a legal compliance expert, analyze the following information related to construction industry regulations:

CONTEXT:
${context}

QUERY:
${query}

Please provide:
1. A concise summary of the relevant compliance requirements
2. Key legal obligations that construction companies must follow
3. Recent or upcoming changes in regulations
4. Citations to specific legal sources when possible
5. Potential risks of non-compliance

Format the response in a clear, structured manner that a legal professional would find helpful.
`;
      
      const result = await this.generateContent({ prompt });
      
      return result.text;
    } catch (error) {
      logger.error('Error analyzing compliance information:', error);
      if (error instanceof GeminiApiError) {
        throw error;
      }
      // Create a specific error or wrap the original
      throw new GeminiApiError(`Failed to analyze compliance information: ${error instanceof Error ? error.message : String(error)}`, 500);
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService(); 