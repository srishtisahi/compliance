import axios from 'axios';
import { logger } from '../utils/logger';
import { PerplexityApiError, createApiErrorFromAxiosError } from '../api/middlewares/errorHandler';
import { 
  PerplexityRequestOptions, 
  PerplexityResponse, 
  PerplexitySource,
  PerplexitySonarRequest,
  PerplexitySonarResponse,
  ComplianceSearchOptions
} from '../types/perplexity.types';
import { queryOptimizerService, QueryOptimizerOptions } from './queryOptimizer.service';

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
   * with query optimization
   */
  async searchComplianceWithOptimizedQuery(options: QueryOptimizerOptions & Omit<PerplexityRequestOptions, 'query'>): Promise<PerplexityResponse> {
    try {
      // Optimize the search query based on user prompt and context
      const optimizedQuery = await queryOptimizerService.optimizeQuery(options);
      
      // Use the optimized primary query for the search
      const searchResult = await this.searchCompliance({
        query: optimizedQuery.primaryQuery,
        focus: optimizedQuery.recommendedFocus,
        maxResults: options.maxResults,
        timeoutMs: options.timeoutMs
      });
      
      // Add metadata about the query optimization
      return {
        ...searchResult,
        optimizationMetadata: {
          originalPrompt: options.userPrompt,
          optimizedQuery: optimizedQuery.primaryQuery,
          alternativeQueries: optimizedQuery.alternativeQueries,
          extractedEntities: optimizedQuery.extractedEntities
        }
      };
    } catch (error) {
      logger.error('Error searching with optimized query:', error);
      // Fallback to searching with the original prompt
      return this.searchCompliance({
        query: options.userPrompt,
        maxResults: options.maxResults,
        timeoutMs: options.timeoutMs
      });
    }
  }
  
  /**
   * Search for compliance information using Perplexity Sonar API
   */
  async searchCompliance(options: PerplexityRequestOptions): Promise<PerplexityResponse> {
    try {
      const { query, focus = 'all', maxResults = 10, timeoutMs } = options;
      
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
      const requestBody: PerplexitySonarRequest = {
        query,
        options: {
          max_results: maxResults,
          focus_type: focus
        }
      };
      
      // Add timeout if specified
      if (timeoutMs) {
        requestBody.options!.timeout_ms = timeoutMs;
      }
      
      // Make API request
      const response = await axios.post<PerplexitySonarResponse>(`${this.baseUrl}/search`, requestBody, config);
      
      // Process and prioritize sources (prioritize government sources)
      const processedResponse: PerplexityResponse = {
        query,
        sources: this.processSources(response.data.sources || []),
        summary: response.data.summary || '',
        usage: response.data.usage ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens
        } : undefined
      };
      
      return processedResponse;
    } catch (error) {
      logger.error('Error searching Perplexity API:', error);
      throw createApiErrorFromAxiosError(error, 'perplexity');
    }
  }
  
  /**
   * Execute follow-up searches with alternative queries
   * Returns an array of search results for each alternative query
   */
  async executeFollowUpSearches(alternativeQueries: string[], maxResults = 5): Promise<PerplexityResponse[]> {
    try {
      // Execute searches for all alternative queries in parallel
      const searchPromises = alternativeQueries.map(query => 
        this.searchCompliance({
          query,
          maxResults,
          focus: 'government' // Default to government sources for follow-up searches
        })
      );
      
      // Wait for all searches to complete
      return await Promise.all(searchPromises);
    } catch (error) {
      logger.error('Error executing follow-up searches:', error);
      return [];
    }
  }
  
  /**
   * Process and prioritize sources from Perplexity API
   * Government sources are prioritized over news sources with advanced ranking
   */
  private processSources(sources: any[]): PerplexitySource[] {
    // Map sources to our internal format with priority attributes
    const processedSources = sources.map(source => {
      // Extract metadata about the source
      const sourceData = this.extractSourceMetadata(source);
      
      return {
        title: source.title,
        url: source.url,
        snippet: source.snippet,
        publishedDate: source.published_date,
        source: source.source_name || this.getSourceNameFromUrl(source.url),
        isGovernment: sourceData.isGovernment,
        isPrimaryAuthority: sourceData.isPrimaryAuthority,
        domainCategory: sourceData.domainCategory,
        domainAuthority: this.calculateDomainAuthority(source, sourceData),
        relevanceScore: source.relevance_score || 0.5,
        contentType: this.detectContentType(source.url),
        lastUpdated: source.last_updated || source.published_date
      };
    });
    
    // Sort sources based on multiple factors
    return processedSources.sort((a, b) => {
      // Primary ranking: Government sources come first
      if (a.isGovernment && !b.isGovernment) return -1;
      if (!a.isGovernment && b.isGovernment) return 1;
      
      // Secondary ranking: Primary authority sources (official government sites) come first
      if (a.isPrimaryAuthority && !b.isPrimaryAuthority) return -1;
      if (!a.isPrimaryAuthority && b.isPrimaryAuthority) return 1;
      
      // Tertiary ranking: Domain authority score
      if ((a.domainAuthority || 0) > (b.domainAuthority || 0)) return -1;
      if ((a.domainAuthority || 0) < (b.domainAuthority || 0)) return 1;
      
      // Quaternary ranking: Relevance score
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    });
  }
  
  /**
   * Extract metadata about the source, including government classification
   */
  private extractSourceMetadata(source: any): {
    isGovernment: boolean;
    isPrimaryAuthority: boolean;
    domainCategory: string;
  } {
    try {
      const url = new URL(source.url);
      const hostname = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      
      // Government domain detection
      const isGovernmentDomain = 
        hostname.endsWith('.gov') || 
        hostname.endsWith('.mil') ||
        hostname.includes('.gov.') ||
        hostname.includes('government') ||
        hostname.includes('official') ||
        hostname.endsWith('.gc.ca') || // Canadian government
        hostname.endsWith('.europa.eu') || // EU government
        hostname.endsWith('.parliament.uk'); // UK government
      
      // Primary authority detection (direct government sources)
      const isPrimaryAuthority = 
        isGovernmentDomain &&
        (hostname.includes('senate') ||
         hostname.includes('house.gov') ||
         hostname.includes('whitehouse.gov') ||
         hostname.includes('congress.gov') ||
         hostname.includes('regulations.gov') ||
         hostname.includes('federalregister.gov') ||
         path.includes('/regulations/') ||
         path.includes('/laws/') ||
         path.includes('/statutes/'));
      
      // Categorize domain type
      let domainCategory = 'other';
      if (isGovernmentDomain) {
        domainCategory = 'government';
      } else if (
        hostname.includes('news') ||
        hostname.includes('times') ||
        hostname.includes('post') ||
        hostname.includes('tribune') ||
        hostname.includes('cnn') ||
        hostname.includes('bbc') ||
        hostname.includes('reuters') ||
        hostname.includes('associated-press') ||
        hostname.includes('ap.org')
      ) {
        domainCategory = 'news';
      } else if (
        hostname.includes('edu') ||
        hostname.includes('university') ||
        hostname.includes('college')
      ) {
        domainCategory = 'educational';
      } else if (
        hostname.includes('org') ||
        hostname.includes('foundation') ||
        hostname.includes('institute') ||
        hostname.includes('association')
      ) {
        domainCategory = 'organization';
      } else if (
        hostname.includes('law') ||
        hostname.includes('legal') ||
        hostname.includes('lexis') ||
        hostname.includes('westlaw')
      ) {
        domainCategory = 'legal';
      }
      
      return {
        isGovernment: isGovernmentDomain,
        isPrimaryAuthority,
        domainCategory
      };
    } catch (error) {
      logger.warn(`Error extracting source metadata for: ${source.url}`, error);
      return {
        isGovernment: false,
        isPrimaryAuthority: false,
        domainCategory: 'unknown'
      };
    }
  }
  
  /**
   * Calculate domain authority based on source data and our own heuristics
   */
  private calculateDomainAuthority(source: any, sourceData: { 
    isGovernment: boolean; 
    isPrimaryAuthority: boolean;
    domainCategory: string;
  }): number {
    // Start with the source's domain authority if available
    let authority = source.domain_authority || 0;
    
    // Apply our own heuristics
    if (sourceData.isPrimaryAuthority) {
      // Primary government authorities get highest score
      authority = Math.max(authority, 95);
    } else if (sourceData.isGovernment) {
      // Government sources get high score
      authority = Math.max(authority, 85);
    } else if (sourceData.domainCategory === 'educational') {
      // Educational sources get good score
      authority = Math.max(authority, 75);
    } else if (sourceData.domainCategory === 'legal') {
      // Legal sources get good score
      authority = Math.max(authority, 70);
    } else if (sourceData.domainCategory === 'organization') {
      // Organizational sources get decent score
      authority = Math.max(authority, 65);
    } else if (sourceData.domainCategory === 'news') {
      // News sources get medium score
      authority = Math.max(authority, 50);
    }
    
    return authority;
  }
  
  /**
   * Extract source name from URL if not provided
   */
  private getSourceNameFromUrl(url: string): string {
    try {
      const { hostname } = new URL(url);
      // Remove www. and get domain name
      const domainParts = hostname.replace(/^www\./, '').split('.');
      
      // Return the main domain name (e.g., 'example' from 'example.com')
      return domainParts[domainParts.length - 2] || hostname;
    } catch {
      return 'Unknown Source';
    }
  }
  
  /**
   * Detect content type based on URL
   */
  private detectContentType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return 'Word';
      case 'ppt':
      case 'pptx':
        return 'PowerPoint';
      case 'xls':
      case 'xlsx':
        return 'Excel';
      default:
        return 'HTML';
    }
  }

  /**
   * Enhanced compliance search with advanced government source prioritization
   */
  async complianceSearch(options: ComplianceSearchOptions): Promise<PerplexityResponse> {
    try {
      const { 
        query, 
        focus = 'all', 
        maxResults = 15, 
        timeoutMs,
        domainCategories,
        governmentSourcesOnly,
        minAuthorityScore
      } = options;
      
      // Always include more results initially, as we'll filter later
      const searchMaxResults = Math.max(maxResults * 2, 30);
      
      // Set focus to government if governmentSourcesOnly is true
      const searchFocus = governmentSourcesOnly ? 'government' : focus;
      
      // First, perform the basic search with more results
      const searchResults = await this.searchCompliance({
        query,
        focus: searchFocus,
        maxResults: searchMaxResults,
        timeoutMs
      });
      
      // Apply advanced filtering
      let filteredSources = searchResults.sources;
      
      // Filter by government sources only if requested
      if (governmentSourcesOnly) {
        filteredSources = filteredSources.filter(source => source.isGovernment);
      }
      
      // Filter by domain categories if specified
      if (domainCategories && domainCategories.length > 0) {
        filteredSources = filteredSources.filter(source => 
          domainCategories.includes(source.domainCategory as any)
        );
      }
      
      // Filter by minimum authority score if specified
      if (minAuthorityScore !== undefined) {
        filteredSources = filteredSources.filter(source => 
          (source.domainAuthority || 0) >= minAuthorityScore
        );
      }
      
      // Limit to requested max results
      filteredSources = filteredSources.slice(0, maxResults);
      
      // Return filtered results
      return {
        query,
        sources: filteredSources,
        summary: searchResults.summary,
        usage: searchResults.usage,
        /* <-- Comment out start
        // Add metadata about search parameters
        searchMetadata: {
          // TODO: Add more specific parameters based on user input
          // Example: 
          // use_case: 'research_assistant',
          // language: 'en', 
          // max_tokens: 512,
          // governmentSourcesFocus: governmentSourcesOnly, // <-- Comment this line
        }
        */ // <-- Comment out end
      };
    } catch (error) {
      logger.error('Error in enhanced compliance search:', error);
      throw createApiErrorFromAxiosError(error, 'perplexity');
    }
  }
  
  /**
   * Get counts of sources by category
   */
  private getSourceCategoryCounts(sources: PerplexitySource[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const source of sources) {
      const category = source.domainCategory || 'unknown';
      counts[category] = (counts[category] || 0) + 1;
    }
    
    return counts;
  }
}

// Export singleton instance
export const perplexityService = new PerplexityService(); 