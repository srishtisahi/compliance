import axios from 'axios';
import { logger } from '../utils/logger';
import { GeminiWebSearchApiError, createApiErrorFromAxiosError } from '../api/middlewares/errorHandler';
import { 
  GeminiWebSearchRequestOptions, 
  GeminiWebSearchResponse, 
  GeminiWebSearchProcessedSource,
  GeminiWebSearchRequest,
  GeminiWebSearchApiResponse,
  GeminiWebSearchSource,
  ComplianceSearchOptions
} from '../types/geminiWebSearch.types';
import { queryOptimizerService, QueryOptimizerOptions } from './queryOptimizer.service';

/**
 * Service for web search using Google Gemini 2.5 Flash API
 */
export class GeminiWebSearchService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-2.5-flash'; // Updated to use 2.5 Flash
    
    if (!this.apiKey) {
      logger.warn('Google Gemini API key is not set. API calls will fail.');
    }
  }

  /**
   * Perform web search using Gemini API
   * This is the core method that performs the search and processes results
   */
  private async searchWeb(query: string, options: {
    maxResults?: number;
    temperature?: number;
    maxOutputTokens?: number;
    timeoutMs?: number;
  } = {}): Promise<GeminiWebSearchApiResponse> {
    try {
      const { 
        maxResults = 10,
        temperature = 0.2,
        maxOutputTokens = 2048,
        timeoutMs
      } = options;
      
      // Check if API key is set
      if (!this.apiKey) {
        throw new GeminiWebSearchApiError('Google Gemini API key is not set', 500, 'API_KEY_MISSING');
      }

      // Adapt query based on maxResults
      const enhancedQuery = `Use web search to find ${maxResults} relevant results about: ${query}`;
      
      // Build the API URL with API key
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      // Prepare request body
      const requestBody: GeminiWebSearchRequest = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: enhancedQuery
              }
            ]
          }
        ],
        generationConfig: {
          temperature,
          maxOutputTokens,
          topK: 40,
          topP: 0.95
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };
      
      // Configure request with timeout if specified
      const config: any = {};
      if (timeoutMs) {
        config.timeout = timeoutMs;
      }
      
      // Make API request
      const response = await axios.post<GeminiWebSearchApiResponse>(url, requestBody, config);
      return response.data;
      
    } catch (error) {
      logger.error('Error searching with Gemini API:', error);
      throw createApiErrorFromAxiosError(error, 'geminiWebSearch');
    }
  }

  /**
   * Process web search results to maintain consistency between API versions
   * This analyzes domains and categorizes sources based on their characteristics
   */
  private processSources(sources: GeminiWebSearchSource[]): GeminiWebSearchProcessedSource[] {
    return sources.map(source => {
      // Extract domain from URL
      const urlObj = new URL(source.url);
      const domain = urlObj.hostname;
      
      // Determine if it's a government source
      const isGovernment = this.isGovernmentDomain(domain);
      
      // Determine if it's a primary authority
      const isPrimaryAuthority = this.isPrimaryAuthority(domain);
      
      // Categorize domain
      const domainCategory = this.categorizeDomain(domain);
      
      // Calculate domain authority based on our heuristics
      const domainAuthority = this.calculateDomainAuthority(source, {
        isGovernment,
        isPrimaryAuthority,
        domainCategory
      });

      // Extract publication date from metadata if available
      const publishedDate = source.metadata?.publishedDate || '';
      
      // Create processed source object
      return {
        title: source.title,
        url: source.url,
        snippet: source.snippet,
        publishedDate,
        source: domain,
        isGovernment,
        isPrimaryAuthority,
        domainCategory,
        domainAuthority,
        relevanceScore: 1.0, // Gemini doesn't provide a relevance score, so we set a default
        contentType: 'html' // Default content type
      };
    });
  }

  /**
   * Check if a domain is a government website
   */
  private isGovernmentDomain(domain: string): boolean {
    // Government domains usually end with .gov, .mil, or country-specific government domains
    const governmentDomains = [
      '.gov', '.mil', '.fed.us', 
      '.gc.ca', '.gouv.fr', '.gov.uk', '.gov.au',
      '.gob.mx', '.admin.ch', '.govt.nz', '.gov.in'
    ];
    
    return governmentDomains.some(govDomain => domain.endsWith(govDomain));
  }

  /**
   * Check if a domain is a primary authority
   */
  private isPrimaryAuthority(domain: string): boolean {
    // Core government regulatory agencies
    const primaryAuthorities = [
      'osha.gov', 'epa.gov', 'dol.gov', 'irs.gov', 'cdc.gov',
      'nist.gov', 'fda.gov', 'cpsc.gov', 'nrc.gov', 'eeoc.gov',
      'ada.gov', 'justice.gov', 'energy.gov', 'hud.gov'
    ];
    
    return primaryAuthorities.some(authority => domain.includes(authority));
  }

  /**
   * Categorize a domain based on its TLD and characteristics
   */
  private categorizeDomain(domain: string): string {
    // Government domains
    if (this.isGovernmentDomain(domain)) {
      return 'government';
    }
    
    // Educational institutions
    if (domain.endsWith('.edu') || domain.includes('university') || domain.includes('college')) {
      return 'educational';
    }
    
    // News sources
    const newsDomains = [
      'news', 'times', 'post', 'herald', 'tribune', 'journa', 
      'reuters', 'bloomberg', 'cnn', 'bbc', 'nytimes', 'wsj',
      'washingtonpost', 'npr', 'forbes', 'apnews'
    ];
    if (newsDomains.some(term => domain.includes(term))) {
      return 'news';
    }
    
    // Legal sources
    const legalDomains = [
      'law', 'legal', 'lexis', 'westlaw', 'justia', 'findlaw',
      'lawyer', 'attorney', 'court', 'justice', 'code'
    ];
    if (legalDomains.some(term => domain.includes(term))) {
      return 'legal';
    }
    
    // Organizations (typically non-profits or industry associations)
    if (domain.endsWith('.org') || domain.includes('association') || domain.includes('institute')) {
      return 'organization';
    }
    
    // Default to other
    return 'other';
  }

  /**
   * Calculate domain authority based on source data and our own heuristics
   */
  private calculateDomainAuthority(source: any, sourceData: { 
    isGovernment: boolean; 
    isPrimaryAuthority: boolean;
    domainCategory: string;
  }): number {
    // Start with a base authority score
    let authority = 50; // Default middle score
    
    // Apply our own heuristics
    if (sourceData.isPrimaryAuthority) {
      // Primary government authorities get highest score
      authority = 95;
    } else if (sourceData.isGovernment) {
      // Government sources get high score
      authority = 85;
    } else if (sourceData.domainCategory === 'educational') {
      // Educational sources get good score
      authority = 75;
    } else if (sourceData.domainCategory === 'legal') {
      // Legal sources get good score
      authority = 70;
    } else if (sourceData.domainCategory === 'organization') {
      // Organizational sources get decent score
      authority = 65;
    } else if (sourceData.domainCategory === 'news') {
      // News sources get medium score
      authority = 50;
    }
    
    return authority;
  }

  /**
   * Generate a summary of search results using Gemini
   */
  private async generateSearchSummary(query: string, sources: GeminiWebSearchProcessedSource[]): Promise<string> {
    try {
      // Create a prompt for summarization
      const prompt = `
Summarize the key information about "${query}" based on these search results:

${sources.slice(0, 5).map((source, index) => 
  `[${index + 1}] ${source.title}
URL: ${source.url}
Snippet: ${source.snippet}
${source.isGovernment ? 'GOVERNMENT SOURCE' : ''}
`).join('\n')}

Provide a concise 2-4 sentence summary focusing on the most important compliance information.
Prioritize information from government sources if available.
Highlight any key regulatory requirements, changes, or deadlines.
`;

      // Make API request
      const url = `${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200
        }
      };
      
      const response = await axios.post(url, requestBody);
      if (response.data && 
          response.data.candidates && 
          response.data.candidates.length > 0 &&
          response.data.candidates[0].content &&
          response.data.candidates[0].content.parts &&
          response.data.candidates[0].content.parts.length > 0) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        return "No summary available.";
      }
    } catch (error) {
      logger.error('Error generating search summary:', error);
      return "Summary generation failed due to an error.";
    }
  }

  /**
   * Search for compliance information using Gemini Web Search API
   */
  async searchCompliance(options: GeminiWebSearchRequestOptions): Promise<GeminiWebSearchResponse> {
    try {
      const { query, focus = 'all', maxResults = 10, timeoutMs } = options;
      
      // Adapt query based on focus
      let enhancedQuery = query;
      if (focus === 'government') {
        enhancedQuery = `${query} site:.gov OR site:.mil`;
      } else if (focus === 'news') {
        enhancedQuery = `${query} recent news`;
      }
      
      // Call the new web search method
      const response = await this.searchWeb(enhancedQuery, {
        maxResults,
        timeoutMs
      });
      
      // Extract sources from the response
      const webSearchResults = response.candidates?.[0]?.content?.parts?.[0]?.webSearchResults?.results || [];
      
      // Process sources to match Perplexity format
      const processedSources = this.processSources(webSearchResults);
      
      // Generate a summary of the results
      const summary = await this.generateSearchSummary(query, processedSources);
      
      // Create usage information
      const usage = response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount,
        completionTokens: response.usageMetadata.candidatesTokenCount,
        totalTokens: response.usageMetadata.totalTokenCount
      } : undefined;
      
      // Return in Perplexity-compatible format
      return {
        query,
        sources: processedSources,
        summary,
        usage
      };
    } catch (error) {
      logger.error('Error in Gemini web search:', error);
      throw createApiErrorFromAxiosError(error, 'geminiWebSearch');
    }
  }

  /**
   * Search for compliance information with optimized query generation
   */
  async searchComplianceWithOptimizedQuery(options: QueryOptimizerOptions & Omit<GeminiWebSearchRequestOptions, 'query'>): Promise<GeminiWebSearchResponse> {
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
   * Enhanced compliance search with advanced filtering options
   */
  async complianceSearch(options: ComplianceSearchOptions): Promise<GeminiWebSearchResponse> {
    try {
      const { 
        query, 
        domainCategories, 
        governmentSourcesOnly = false, 
        maxResults = 15, 
        minAuthorityScore = 0,
        timeoutMs 
      } = options;
      
      // Adapt query based on search preferences
      let enhancedQuery = query;
      if (governmentSourcesOnly) {
        enhancedQuery = `${query} site:.gov OR site:.mil`;
      }
      
      // Perform basic search
      const searchResults = await this.searchCompliance({
        query: enhancedQuery,
        focus: governmentSourcesOnly ? 'government' : 'all',
        maxResults: maxResults * 2, // Get more results than needed for filtering
        timeoutMs
      });
      
      // Apply filtering
      let filteredSources = searchResults.sources;
      
      // Filter by domain category if specified
      if (domainCategories && domainCategories.length > 0) {
        filteredSources = filteredSources.filter(source => 
          domainCategories.includes(source.domainCategory as any)
        );
      }
      
      // Filter by authority score if specified
      if (minAuthorityScore > 0) {
        filteredSources = filteredSources.filter(source => 
          (source.domainAuthority || 0) >= minAuthorityScore
        );
      }
      
      // Enforce government sources only if specified
      if (governmentSourcesOnly) {
        filteredSources = filteredSources.filter(source => source.isGovernment);
      }
      
      // Prioritize sources by authority and limit to requested number
      filteredSources = filteredSources
        .sort((a, b) => (b.domainAuthority || 0) - (a.domainAuthority || 0))
        .slice(0, maxResults);
      
      // Calculate source category counts
      const getSourceCategoryCounts = (sources: GeminiWebSearchProcessedSource[]) => {
        const counts: Record<string, number> = {};
        sources.forEach(source => {
          counts[source.domainCategory] = (counts[source.domainCategory] || 0) + 1;
        });
        return counts;
      };
      
      // Return filtered results
      return {
        query,
        sources: filteredSources,
        summary: searchResults.summary,
        usage: searchResults.usage,
        // Add metadata about search parameters
        searchMetadata: {
          governmentSourcesFocus: governmentSourcesOnly,
          appliedFilters: {
            domainCategories: domainCategories || [],
            minAuthorityScore: minAuthorityScore || 0
          },
          totalResultsBeforeFiltering: searchResults.sources.length,
          governmentSourcesCount: filteredSources.filter(s => s.isGovernment).length,
          sourceCategoryCounts: getSourceCategoryCounts(filteredSources)
        }
      };
    } catch (error) {
      logger.error('Error in enhanced compliance search:', error);
      throw createApiErrorFromAxiosError(error, 'geminiWebSearch');
    }
  }

  /**
   * Get source category counts for metadata
   */
  private getSourceCategoryCounts(sources: GeminiWebSearchProcessedSource[]): Record<string, number> {
    const counts: Record<string, number> = {};
    sources.forEach(source => {
      counts[source.domainCategory] = (counts[source.domainCategory] || 0) + 1;
    });
    return counts;
  }
}

// Export singleton instance
export const geminiWebSearchService = new GeminiWebSearchService(); 