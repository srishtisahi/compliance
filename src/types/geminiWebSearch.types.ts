/**
 * Type definitions for Gemini 2.5 Flash Web Search API
 */

/**
 * Request options for Gemini Web Search
 */
export interface GeminiWebSearchRequestOptions {
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
 * Gemini Web Search request for API
 */
export interface GeminiWebSearchRequest {
  /** Content parts for the request */
  contents: {
    /** The role of the content */
    role: 'user';
    /** Parts of the content */
    parts: {
      /** Text content */
      text: string;
    }[];
  }[];
  /** Generation configuration */
  generationConfig?: {
    /** Temperature for generation */
    temperature?: number;
    /** Maximum output tokens */
    maxOutputTokens?: number;
    /** Top-k sampling */
    topK?: number;
    /** Top-p sampling */
    topP?: number;
  };
  /** Safety settings */
  safetySettings?: {
    /** The harm category */
    category: string;
    /** The threshold level */
    threshold: string;
  }[];
}

/**
 * Gemini Web Search response source
 */
export interface GeminiWebSearchSource {
  /** Title of the source */
  title: string;
  /** URL of the source */
  url: string;
  /** Text snippet from the source */
  snippet: string;
  /** Source metadata */
  metadata?: {
    /** Publication date (ISO format) if available */
    publishedDate?: string;
    /** Domain name */
    domain?: string;
    /** Source type if determined */
    sourceType?: string;
  };
}

/**
 * Processed source with additional metadata
 */
export interface GeminiWebSearchProcessedSource {
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
 * Gemini Web Search API response
 */
export interface GeminiWebSearchApiResponse {
  /** The candidates returned */
  candidates: {
    /** Content of the response */
    content: {
      /** Parts of the content */
      parts: {
        /** Text content */
        text: string;
        /** Structured web search results if available */
        webSearchResults?: {
          /** Results from the web search */
          results: GeminiWebSearchSource[];
          /** Snippet quote blocks */
          snippetSourceCitations?: any[];
          /** Inline citations */
          inlineCitations?: any[];
          /** Search query used */
          searchQuery?: string;
        };
      }[];
    };
    /** Safety ratings */
    safetyRatings?: {
      /** The harm category that was rated */
      category: string;
      /** Probability score */
      probability: string;
    }[];
    /** Finish details */
    finishReason?: string;
    /** Index of the candidate */
    index?: number;
  }[];
  /** Prompt feedback */
  promptFeedback?: any;
  /** Usage metadata */
  usageMetadata?: {
    /** Prompt token count */
    promptTokenCount: number;
    /** Candidates token count */
    candidatesTokenCount: number;
    /** Total token count */
    totalTokenCount: number;
  };
}

/**
 * Processed Gemini Web Search response
 */
export interface GeminiWebSearchResponse {
  /** The query that was used for the search */
  query: string;
  /** Processed and prioritized sources */
  sources: GeminiWebSearchProcessedSource[];
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
  optimizationMetadata?: any;
  /** Metadata about search parameters for enhanced compliance search */
  searchMetadata?: {
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
  };
}

/**
 * Enhanced compliance search options with source prioritization
 */
export interface ComplianceSearchOptions extends GeminiWebSearchRequestOptions {
  /** Filter results to specific domain categories */
  domainCategories?: Array<'government' | 'news' | 'educational' | 'organization' | 'legal' | 'other'>;
  /** Return only government sources */
  governmentSourcesOnly?: boolean;
  /** Minimum domain authority score (0-100) */
  minAuthorityScore?: number;
} 