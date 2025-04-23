/**
 * Request type for text compliance analysis
 */
export interface TextAnalysisRequest {
  /** The query for compliance analysis */
  query: string;
  /** Supporting context information */
  context?: string;
  /** Desired response format (json, html, markdown, raw) */
  responseFormat?: string;
}

/**
 * Request type for document compliance analysis
 */
export interface DocumentAnalysisRequest {
  /** ID of the document to analyze */
  documentId: string;
  /** The query for compliance analysis */
  query: string;
  /** Optional search results to include as context */
  searchResults?: string[];
  /** Optional document text (if already extracted) */
  documentText?: string;
  /** Desired response format (json, html, markdown, raw) */
  responseFormat?: string;
}

/**
 * Compliance analysis result
 */
export interface ComplianceAnalysisResult {
  /** Raw text response */
  text: string;
  /** Summary of compliance requirements */
  summary?: string;
  /** Key legal obligations */
  obligations?: string[];
  /** Recent regulatory changes */
  recentChanges?: string[];
  /** Legal sources cited in the analysis */
  citations?: {
    /** Citation text */
    text: string;
    /** Source description */
    source: string;
  }[];
  /** Potential risks of non-compliance */
  risks?: string[];
}

/**
 * Token usage information
 */
export interface TokenUsage {
  /** Number of tokens in the prompt */
  promptTokens: number;
  /** Number of tokens in the completion */
  completionTokens: number;
  /** Total number of tokens used */
  totalTokens: number;
}

/**
 * Response type for text compliance analysis
 */
export interface TextAnalysisResponse {
  /** Success indicator */
  success: boolean;
  /** Response data */
  data?: {
    /** Analysis results */
    analysis: ComplianceAnalysisResult;
    /** Token usage information */
    usage?: TokenUsage;
    /** Response format used */
    format?: string;
  };
  /** Error message if applicable */
  message?: string;
  /** Detailed error information (only present in error responses) */
  error?: string;
}

/**
 * Response type for document compliance analysis
 */
export interface DocumentAnalysisResponse {
  /** Success indicator */
  success: boolean;
  /** Response data */
  data?: {
    /** Document ID */
    documentId: string;
    /** Analysis results */
    analysis: ComplianceAnalysisResult;
    /** Token usage information */
    usage?: TokenUsage;
    /** Response format used */
    format?: string;
  };
  /** Error message if applicable */
  message?: string;
  /** Detailed error information (only present in error responses) */
  error?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction: 'asc' or 'desc' */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Success indicator */
  success: boolean;
  /** Response data */
  data?: {
    /** Array of items */
    items: T[];
    /** Pagination metadata */
    pagination: {
      /** Total number of items */
      total: number;
      /** Current page */
      page: number;
      /** Number of items per page */
      limit: number;
      /** Total number of pages */
      totalPages: number;
      /** Has more pages */
      hasNext: boolean;
      /** Has previous pages */
      hasPrev: boolean;
    }
  };
  /** Error message if applicable */
  message?: string;
}

/**
 * Query parameters for compliance analysis results
 */
export interface ComplianceAnalysisQueryParams extends PaginationParams {
  /** Filter by userId */
  userId?: string;
  /** Filter by tags (comma separated) */
  tags?: string;
  /** Filter by jurisdiction */
  jurisdiction?: string;
  /** Filter by category */
  category?: string;
  /** Filter by document ID */
  documentId?: string;
  /** Search term for text search */
  search?: string;
  /** Date range start */
  startDate?: string;
  /** Date range end */
  endDate?: string;
}

/**
 * Response type for compliance analysis results list
 */
export interface ComplianceAnalysisListItem {
  /** Analysis ID */
  id: string;
  /** The query that generated this analysis */
  query: string;
  /** Document ID if applicable */
  documentId?: string;
  /** Summary of compliance requirements */
  summary?: string;
  /** Jurisdiction */
  jurisdiction?: string;
  /** Category */
  category?: string;
  /** Tags */
  tags?: string[];
  /** Created date */
  createdAt: string;
  /** User ID */
  userId?: string;
}

/**
 * Response type for compliance analysis results list
 */
export type ComplianceAnalysisListResponse = PaginatedResponse<ComplianceAnalysisListItem>;

/**
 * Job status response
 */
export interface JobStatusResponse {
  /** Success indicator */
  success: boolean;
  /** Response data */
  data?: {
    /** Job ID */
    jobId: string;
    /** Current status */
    status: string;
    /** Progress percentage (0-100) */
    progress: number;
    /** Job type */
    jobType: string;
    /** Original query */
    query: string;
    /** Document ID if applicable */
    documentId?: string;
    /** Start time */
    startTime: Date;
    /** End time if completed or failed */
    endTime?: Date;
    /** Creation date */
    createdAt: Date;
    /** Last update date */
    updatedAt: Date;
    /** Results if job is completed */
    result?: Record<string, any>;
    /** Error details if job failed */
    error?: string;
  };
  /** Error message if applicable */
  message?: string;
}

/**
 * Job list item
 */
export interface JobListItem {
  /** Job ID */
  jobId: string;
  /** Current status */
  status: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Job type */
  jobType: string;
  /** Original query */
  query: string;
  /** Document ID if applicable */
  documentId?: string;
  /** Start time */
  startTime: Date;
  /** End time if completed or failed */
  endTime?: Date;
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt: Date;
}

/**
 * Job list query parameters
 */
export interface JobListQueryParams extends PaginationParams {
  /** Filter by status */
  status?: string;
  /** Filter by job type */
  jobType?: string;
  /** Filter by userId */
  userId?: string;
  /** Search term for job query or document ID */
  search?: string;
}

/**
 * Job list response
 */
export interface JobListResponse {
  /** Success indicator */
  success: boolean;
  /** Response data */
  data?: {
    /** Array of job items */
    items: JobListItem[];
    /** Pagination metadata */
    pagination: {
      /** Total number of items */
      total: number;
      /** Current page */
      page: number;
      /** Number of items per page */
      limit: number;
      /** Total number of pages */
      totalPages: number;
      /** Has more pages */
      hasNext: boolean;
      /** Has previous pages */
      hasPrev: boolean;
    }
  };
  /** Error message if applicable */
  message?: string;
}

/**
 * Response type for job cancellation
 */
export interface JobCancelResponse {
  /** Success indicator */
  success: boolean;
  /** Response data */
  data?: {
    /** Job ID */
    jobId?: string;
    /** Current status */
    status?: string;
    /** Result message */
    message: string;
  };
  /** Error message if applicable */
  message?: string;
}

/**
 * Response type for job creation
 */
export interface JobCreationResponse {
  /** Success indicator */
  success: boolean;
  /** Response message */
  message: string;
  /** Response data */
  data?: {
    /** Job ID */
    jobId: string;
    /** Initial status */
    status: string;
  };
} 