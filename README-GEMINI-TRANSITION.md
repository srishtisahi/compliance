# Transition from Perplexity to Gemini Web Search (COMPLETED)

## Overview

This document explains the completed transition from Perplexity Sonar API to Google Gemini 2.5 Flash for web search functionality in our legal compliance system. The change was necessary because we could not obtain a Perplexity API key.

## Key Changes

1. Created a drop-in replacement for the Perplexity service using Gemini 2.5 Flash Web Search
2. Updated all API endpoints, services, and controllers to use Gemini instead of Perplexity
3. Maintained the same response structure for backward compatibility with existing code
4. Changed API routes from `/api/perplexity/*` to `/api/search/*`

## Setup Instructions

1. **API Key**: You need a valid Google Gemini API key. Set it in your environment variables as `GEMINI_API_KEY`.

2. **Environment Variables**:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Dependency**: No additional dependencies are required since we already use Gemini for other functionality.

## API Endpoints

The following endpoints have been implemented:

1. `/api/search/search` - Basic web search functionality
2. `/api/search/compliance-search` - Enhanced search with government source prioritization
3. `/api/search/optimized-search` - Search with query optimization

## Migration Guide

### For Frontend Developers

1. Update API endpoints from `/api/perplexity/*` to `/api/search/*`
2. No changes needed to request or response handling as the structure remains the same

### For Backend Developers

1. Use `GeminiWebSearchService` instead of `PerplexityService`
2. Import from `geminiWebSearch.service.ts` instead of `perplexity.service.ts`
3. Response structure is compatible with previous Perplexity responses

## Implementation Details

### Services

- `GeminiWebSearchService`: Replaces `PerplexityService` with the same interface
- Uses Gemini 2.5 Flash (COMPLETED - upgrade from 1.5 to 2.5)
- Implements domain categorization and government source prioritization similar to the original service

### Type Definitions

- `GeminiWebSearchRequest`: Request structure for Gemini API
- `GeminiWebSearchResponse`: Response structure that maintains compatibility with `PerplexityResponse`

### Controllers

- `GeminiWebSearchController`: Replaces `PerplexityController` with identical endpoints and validation
- `OrchestrationController` and `TextPromptController` updated to use the new service

## Testing

Make sure to test the following scenarios:

1. Basic search functionality
2. Government-focused searches
3. Optimized queries
4. Integration with the orchestration service
5. Error handling when API limits are reached

## Limitations and Known Issues

1. Search quality may differ from Perplexity, particularly for regulatory content
2. Response structure is simulated to match Perplexity, so some fields may have default values

## Monitoring and Logging

All API calls to Gemini are logged with the appropriate service name for monitoring:

```
logger.error('Error in Gemini web search:', error);
throw createApiErrorFromAxiosError(error, 'geminiWebSearch');
```

## Future Improvements

1. Refine the web search prompt to improve result quality
2. Add more sophisticated domain categorization
3. Implement more advanced source scoring
4. Add caching to reduce API costs 