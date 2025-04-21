/**
 * TypeScript interfaces for Perplexity Sonar API
 */

/**
 * Perplexity Sonar API request options
 */
export interface PerplexityRequestOptions {
  /** The search query text */
  query: string;
  /** Focus area for search results */
  focus?: 'government' | 'news' | 'all';
  /** Maximum number of results to return (default: 10) */
  maxResults?: number;
  /** Optional timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Perplexity Sonar API request body
 */
export interface PerplexitySonarRequest {
  /** The search query text */
  query: string;
  /** Additional search options */
  options?: {
    /** Maximum number of results to return */
    max_results?: number;
    /** Focus type for search results */
    focus_type?: 'government' | 'news' | 'all';
    /** Timeout in milliseconds */
    timeout_ms?: number;
  };
}

/**
 * Perplexity Sonar API error response
 */
export interface PerplexitySonarError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** HTTP status code */
  status: number;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Perplexity Sonar API source information
 */
export interface PerplexitySonarSource {
  /** Title of the source */
  title: string;
  /** URL of the source */
  url: string;
  /** Text snippet from the source */
  snippet: string;
  /** Source name (e.g., website name) */
  source_name?: string;
  /** Publication date (ISO format) */
  published_date?: string;
  /** Relevance score (0-1) */
  relevance_score?: number;
  /** Domain authority score (0-100) */
  domain_authority?: number;
}

/**
 * Processed source with additional metadata
 */
export interface PerplexitySource {
  /** Title of the source */
  title: string;
  /** URL of the source */
  url: string;
  /** Text snippet from the source */
  snippet: string;
  /** Publication date (ISO format) */
  publishedDate?: string;
  /** Source name (e.g., website name) */
  source: string;
  /** Whether the source is a government website */
  isGovernment: boolean;
  /** Whether the source is a primary authority (official government source) */
  isPrimaryAuthority: boolean;
  /** Domain category (government, news, educational, organization, legal, other) */
  domainCategory: string;
  /** Domain authority score (0-100) */
  domainAuthority?: number;
  /** Relevance score (0-1) */
  relevanceScore?: number;
  /** Content type (HTML, PDF, etc.) */
  contentType?: string;
  /** Last updated date (if available) */
  lastUpdated?: string;
}

/**
 * Enhanced compliance search options with source prioritization
 */
export interface ComplianceSearchOptions extends PerplexityRequestOptions {
  /** Filter results to specific domain categories */
  domainCategories?: Array<'government' | 'news' | 'educational' | 'organization' | 'legal' | 'other'>;
  /** Return only government sources */
  governmentSourcesOnly?: boolean;
  /** Minimum domain authority score (0-100) */
  minAuthorityScore?: number;
}

/**
 * Optimization metadata for enhanced search
 */
export interface OptimizationMetadata {
  /** The original user prompt */
  originalPrompt: string;
  /** The optimized search query */
  optimizedQuery: string;
  /** Alternative queries for follow-up searches */
  alternativeQueries: string[];
  /** Entities extracted from the prompt */
  extractedEntities: {
    regulations?: string[];
    locations?: string[];
    organizations?: string[];
    dates?: string[];
    other?: string[];
  };
}

/**
 * Search metadata for enhanced compliance search
 */
export interface SearchMetadata {
  /** Whether government sources were specifically focused on */
  governmentSourcesFocus: boolean;
  /** Applied filters in the search */
  appliedFilters: {
    /** Domain categories filtered */
    domainCategories: string[];
    /** Minimum authority score required */
    minAuthorityScore: number;
  };
  /** Total number of results before filtering */
  totalResultsBeforeFiltering: number;
  /** Number of government sources in results */
  governmentSourcesCount: number;
  /** Count of sources by category */
  sourceCategoryCounts: Record<string, number>;
}

/**
 * Perplexity Sonar API response
 */
export interface PerplexitySonarResponse {
  /** The query that was used for the search */
  query: string;
  /** Search results */
  sources: PerplexitySonarSource[];
  /** Summary of search results */
  summary?: string;
  /** Token usage information */
  usage?: {
    /** Number of tokens used in the prompt */
    prompt_tokens: number;
    /** Number of tokens used in the completion */
    completion_tokens: number;
    /** Total number of tokens used */
    total_tokens: number;
  };
}

/**
 * Processed Perplexity response
 */
export interface PerplexityResponse {
  /** The query that was used for the search */
  query: string;
  /** Processed and prioritized sources */
  sources: PerplexitySource[];
  /** Summary of search results */
  summary: string;
  /** Citation information */
  citations?: {
    /** Citation text */
    text: string;
    /** Source index */
    sourceIndex: number;
  }[];
  /** Token usage information */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Metadata about query optimization when using optimized search */
  optimizationMetadata?: OptimizationMetadata;
  /** Metadata about search parameters for enhanced compliance search */
  searchMetadata?: SearchMetadata;
} 