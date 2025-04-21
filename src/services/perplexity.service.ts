import axios from 'axios';
import { logger } from '../utils/logger';
import { PerplexityApiError, createApiErrorFromAxiosError } from '../api/middlewares/errorHandler';

// Define types for Perplexity API
interface PerplexityRequestOptions {
  query: string;
  focus?: 'government' | 'news' | 'all';
  maxResults?: number;
}

interface PerplexitySource {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source: string;
  isGovernment: boolean;
}

interface PerplexityResponse {
  query: string;
  sources: PerplexitySource[];
  summary: string;
}

/**
 * Service for interacting with Perplexity Sonar API
 */
export class PerplexityService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    this.baseUrl = 'https://api.perplexity.ai/sonar/v1';
    
    if (!this.apiKey) {
      logger.warn('Perplexity API key is not set. API calls will fail.');
    }
  }
  
  /**
   * Search for compliance information using Perplexity Sonar API
   */
  async searchCompliance(options: PerplexityRequestOptions): Promise<PerplexityResponse> {
    try {
      const { query, focus = 'all', maxResults = 10 } = options;
      
      // Check if API key is set
      if (!this.apiKey) {
        throw new PerplexityApiError('Perplexity API key is not set', 500, 'API_KEY_MISSING');
      }
      
      // Configure request for Perplexity API
      const config = {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Prepare request body
      const requestBody = {
        query,
        options: {
          max_results: maxResults,
          focus_type: focus
        }
      };
      
      // Make API request
      const response = await axios.post(`${this.baseUrl}/search`, requestBody, config);
      
      // Process and prioritize sources (prioritize government sources)
      const processedResponse: PerplexityResponse = {
        query,
        sources: this.processSources(response.data.sources || []),
        summary: response.data.summary || ''
      };
      
      return processedResponse;
    } catch (error) {
      logger.error('Error searching Perplexity API:', error);
      throw createApiErrorFromAxiosError(error, 'perplexity');
    }
  }
  
  /**
   * Process and prioritize sources from Perplexity API
   * Government sources are prioritized over news sources
   */
  private processSources(sources: any[]): PerplexitySource[] {
    // Identify government sources (domains like .gov, .mil, etc.)
    const processedSources = sources.map(source => {
      const url = new URL(source.url);
      const isGovernment = url.hostname.endsWith('.gov') || 
                           url.hostname.endsWith('.mil') ||
                           url.hostname.includes('government') ||
                           url.hostname.includes('official');
                           
      return {
        title: source.title,
        url: source.url,
        snippet: source.snippet,
        publishedDate: source.published_date,
        source: source.source_name || 'Unknown',
        isGovernment
      };
    });
    
    // Sort sources to prioritize government sources
    return processedSources.sort((a, b) => {
      if (a.isGovernment && !b.isGovernment) return -1;
      if (!a.isGovernment && b.isGovernment) return 1;
      return 0;
    });
  }
}

// Export singleton instance
export const perplexityService = new PerplexityService(); 