import axios from 'axios';
import { logger } from '../utils/logger';
import { GeminiApiError, createApiErrorFromAxiosError } from '../api/middlewares/errorHandler';

// Define types for Gemini API
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
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-pro';
    
    if (!this.apiKey) {
      logger.warn('Google Gemini API key is not set. API calls will fail.');
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
      
      // Check if API key is set
      if (!this.apiKey) {
        throw new GeminiApiError('Google Gemini API key is not set', 500, 'API_KEY_MISSING');
      }
      
      // Build the API URL with API key
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      // Prepare request body
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
      
      // Make API request
      const response = await axios.post(url, requestBody);
      
      // Extract relevant information from response
      let outputText = '';
      let safetyAttributes = undefined;
      
      if (response.data && 
          response.data.candidates && 
          response.data.candidates.length > 0) {
        const candidate = response.data.candidates[0];
        
        if (candidate.content && 
            candidate.content.parts && 
            candidate.content.parts.length > 0) {
          outputText = candidate.content.parts[0].text || '';
        }
        
        safetyAttributes = candidate.safetyRatings ? {
          categories: candidate.safetyRatings.map((rating: any) => rating.category),
          blocked: candidate.safetyRatings.some((rating: any) => rating.blocked),
          scores: candidate.safetyRatings.map((rating: any) => rating.score)
        } : undefined;
      }
      
      return {
        text: outputText,
        safetyAttributes
      };
    } catch (error) {
      logger.error('Error generating content with Gemini:', error);
      throw createApiErrorFromAxiosError(error, 'gemini');
    }
  }
  
  /**
   * Analyze and summarize compliance information
   */
  async analyzeComplianceInfo(context: string, query: string): Promise<string> {
    try {
      // Create a prompt specifically for legal compliance analysis
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
      
      // Generate the analysis
      const result = await this.generateContent({ prompt });
      
      return result.text;
    } catch (error) {
      logger.error('Error analyzing compliance information:', error);
      // If it's already a GeminiApiError, just rethrow it
      if (error instanceof GeminiApiError) {
        throw error;
      }
      throw new GeminiApiError('Failed to analyze compliance information', 500);
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService(); 