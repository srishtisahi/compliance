/**
 * Type definitions for Google Gemini API
 */

/**
 * Request options for Gemini API
 */
export interface GeminiRequestOptions {
  /** The prompt text to send to Gemini */
  prompt: string;
  /** Maximum number of tokens to generate in the response */
  maxOutputTokens?: number;
  /** Controls randomness: 0.0 means deterministic, higher values increase randomness */
  temperature?: number;
  /** Controls diversity via nucleus sampling */
  topP?: number;
  /** Controls diversity via top-k sampling */
  topK?: number;
  /** The model to use (defaults to gemini-2.5-flash-preview-04-17) */
  model?: string;
}

/**
 * Structured content part for Gemini API requests
 */
export interface GeminiContentPart {
  /** Text content */
  text?: string;
  /** Inline data for the content part (for multimodal inputs) */
  inlineData?: {
    /** MIME type of the data */
    mimeType: string;
    /** Base64 encoded data */
    data: string;
  };
}

/**
 * Safety category for content filtering
 */
export type GeminiHarmCategory =
  | 'HARM_CATEGORY_HARASSMENT'
  | 'HARM_CATEGORY_HATE_SPEECH'
  | 'HARM_CATEGORY_SEXUALLY_EXPLICIT'
  | 'HARM_CATEGORY_DANGEROUS_CONTENT';

/**
 * Safety threshold levels
 */
export type GeminiSafetyThreshold =
  | 'BLOCK_NONE'
  | 'BLOCK_LOW_AND_ABOVE'
  | 'BLOCK_MEDIUM_AND_ABOVE'
  | 'BLOCK_HIGH_AND_ABOVE'
  | 'BLOCK_ONLY_HIGH';

/**
 * Safety setting for content filtering
 */
export interface GeminiSafetySetting {
  /** The harm category to apply the threshold to */
  category: GeminiHarmCategory;
  /** The threshold level for blocking content */
  threshold: GeminiSafetyThreshold;
}

/**
 * Generation configuration for Gemini API requests
 */
export interface GeminiGenerationConfig {
  /** Controls randomness: 0.0 means deterministic, higher values increase randomness */
  temperature?: number;
  /** Controls diversity via top-k sampling */
  topK?: number;
  /** Controls diversity via nucleus sampling */
  topP?: number;
  /** Maximum number of tokens to generate in the response */
  maxOutputTokens?: number;
  /** List of strings that stop generation if generated */
  stopSequences?: string[];
}

/**
 * Complete request structure for Gemini generateContent API
 */
export interface GeminiGenerateContentRequest {
  /** Content parts to send */
  contents: {
    /** The role of the content, either 'user' or 'model' */
    role?: 'user' | 'model';
    /** Array of content parts */
    parts: GeminiContentPart[];
  }[];
  /** Generation configuration */
  generationConfig?: GeminiGenerationConfig;
  /** Safety settings for content filtering */
  safetySettings?: GeminiSafetySetting[];
}

/**
 * Safety rating in response
 */
export interface GeminiSafetyRating {
  /** The harm category that was rated */
  category: GeminiHarmCategory;
  /** Whether the content was blocked because of this harm category */
  blocked: boolean;
  /** Probability score for this category, ranges from 0 to 1 */
  score: number;
}

/**
 * Content part in Gemini API response
 */
export interface GeminiResponsePart {
  /** Text content in the response */
  text?: string;
}

/**
 * Candidate response from Gemini API
 */
export interface GeminiResponseCandidate {
  /** The generated content */
  content: {
    /** Array of content parts */
    parts: GeminiResponsePart[];
    /** Role of the content */
    role?: 'model';
  };
  /** The reason why the candidate finished generating */
  finishReason?: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
  /** The safety ratings for this candidate */
  safetyRatings?: GeminiSafetyRating[];
  /** Token counts for this candidate */
  tokenCount?: {
    /** Number of tokens in the generated content */
    totalTokens: number;
    /** Number of billable tokens used */
    totalBillableCharacters: number;
  };
}

/**
 * Usage metadata for token accounting
 */
export interface GeminiUsageMetadata {
  /** Number of tokens in the prompt */
  promptTokenCount: number;
  /** Number of tokens in the response */
  candidatesTokenCount: number;
  /** Total number of tokens used */
  totalTokenCount: number;
}

/**
 * Complete Gemini API response structure
 */
export interface GeminiApiResponse {
  /** Array of generated candidates */
  candidates: GeminiResponseCandidate[];
  /** The prompt feedback */
  promptFeedback?: {
    /** The safety ratings for the prompt */
    safetyRatings: GeminiSafetyRating[];
    /** Whether the prompt was blocked */
    blockReason?: string;
  };
  /** Usage metadata for token accounting */
  usageMetadata?: GeminiUsageMetadata;
}

/**
 * Simplified response format used in the application
 */
export interface GeminiResponse {
  /** The generated text */
  text: string;
  /** Safety attributes of the response */
  safetyAttributes?: {
    /** List of safety categories found in the response */
    categories: string[];
    /** Whether the content was blocked */
    blocked: boolean;
    /** Safety scores for each category */
    scores: number[];
  };
  /** Token usage information if available */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Response for compliance analysis
 */
export interface GeminiComplianceAnalysisResponse extends GeminiResponse {
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
  /** Notes on jurisdictional differences in regulations */
  jurisdictionalNotes?: string;
  /** Metadata specific to document analysis */
  documentMetadata?: {
    /** Type and authority of the document */
    documentType: string;
    /** Entities responsible for compliance and enforcement */
    responsibleParties: string;
    /** Implementation timeline information */
    timeline: string;
    /** Information about penalties and enforcement */
    penalties: string;
  };
  /** Metadata for regulatory source comparison */
  comparisonMetadata?: {
    /** Hierarchy of regulatory authorities */
    regulatoryHierarchy: string;
    /** Key conflicts between sources */
    keyConflicts: string;
    /** Harmonized requirements across sources */
    harmonizedRequirements: string;
    /** Government enforcement priorities */
    governmentPriorities: string;
    /** Implementation strategy recommendations */
    implementationStrategy: string;
  };
  /** Metadata for compliance timelines and deadlines */
  timelineMetadata?: {
    /** Deadlines within the next 30 days */
    imminentDeadlines: string;
    /** Deadlines within 31-90 days */
    upcomingDeadlines: string;
    /** Deadlines beyond 90 days */
    futureDeadlines: string;
    /** Recurring compliance obligations */
    recurringObligations: string;
    /** Implementation and grace periods */
    implementationPeriods: string;
    /** Chronological list of key dates */
    timelineVisualization: string;
    /** Recommendations for deadline preparation */
    preparationRecommendations: string;
  };
} 