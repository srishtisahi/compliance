/**
 * Type guards for Perplexity API responses
 * These functions help with runtime type checking
 */

import { 
  PerplexitySonarResponse, 
  PerplexitySonarSource,
  PerplexitySonarError 
} from '../types/perplexity.types';

/**
 * Type guard to check if an object is a valid PerplexitySonarSource
 */
export function isPerplexitySonarSource(obj: unknown): obj is PerplexitySonarSource {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'title' in obj &&
    typeof (obj as PerplexitySonarSource).title === 'string' &&
    'url' in obj &&
    typeof (obj as PerplexitySonarSource).url === 'string' &&
    'snippet' in obj &&
    typeof (obj as PerplexitySonarSource).snippet === 'string'
  );
}

/**
 * Type guard to check if an object is a valid PerplexitySonarResponse
 */
export function isPerplexitySonarResponse(obj: unknown): obj is PerplexitySonarResponse {
  if (
    typeof obj !== 'object' ||
    obj === null ||
    !('query' in obj) ||
    typeof (obj as PerplexitySonarResponse).query !== 'string' ||
    !('sources' in obj) ||
    !Array.isArray((obj as PerplexitySonarResponse).sources)
  ) {
    return false;
  }

  // Check if all sources are valid
  for (const source of (obj as PerplexitySonarResponse).sources) {
    if (!isPerplexitySonarSource(source)) {
      return false;
    }
  }

  // Summary is optional but should be string if present
  if (
    'summary' in obj &&
    (obj as PerplexitySonarResponse).summary !== undefined &&
    typeof (obj as PerplexitySonarResponse).summary !== 'string'
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard to check if an object is a valid PerplexitySonarError
 */
export function isPerplexitySonarError(obj: unknown): obj is PerplexitySonarError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    typeof (obj as PerplexitySonarError).code === 'string' &&
    'message' in obj &&
    typeof (obj as PerplexitySonarError).message === 'string' &&
    'status' in obj &&
    typeof (obj as PerplexitySonarError).status === 'number'
  );
}

/**
 * Extract government sources from a list of sources
 */
export function extractGovernmentSources(sources: PerplexitySonarSource[]): PerplexitySonarSource[] {
  return sources.filter(source => {
    try {
      const url = new URL(source.url);
      return (
        url.hostname.endsWith('.gov') ||
        url.hostname.endsWith('.mil') ||
        url.hostname.includes('government') ||
        url.hostname.includes('official')
      );
    } catch {
      return false;
    }
  });
}

/**
 * Validate a URL string
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
} 