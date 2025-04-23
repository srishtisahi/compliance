# Migration to Gemini 2.5 Flash Web Search

This document outlines the migration from Perplexity Sonar API to Google Gemini 2.5 Flash Web Search API for the legal compliance system.

## Changes Made

1. Updated `geminiWebSearch.service.ts` to use Gemini 2.5 Flash model (previously using 1.5)
2. Removed Perplexity API key from `.env.example`
3. Updated API routes to use Gemini Web Search endpoints
4. Updated documentation and README to reflect the change
5. Added a deprecation notice to Perplexity service
6. Updated JobType enum in ComplianceJob model

## API Structure

The web search functionality is now available through the following endpoints:

- `POST /api/v1/search/search` - Basic web search
- `POST /api/v1/search/optimized-search` - Search with optimized queries
- `POST /api/v1/search/compliance-search` - Enhanced compliance search with source filtering

## Environment Variables

Only one API key is required for both Gemini features:

```
GEMINI_API_KEY=your_gemini_api_key
```

This key is used for both:
- Gemini 2.5 Flash web search functionality
- Gemini Pro for analysis and summaries

## Implementation Details

The Gemini Web Search service maintains the same interface as the previous Perplexity service, allowing for a seamless transition. Key features include:

- Government source prioritization
- Domain authority scoring
- Source categorization
- Enhanced filtering options
- Query optimization

## New Features with Gemini 2.5 Flash

Gemini 2.5 Flash offers several advantages over the previous implementation:

1. Improved search quality and relevance
2. Better understanding of legal and regulatory content
3. Advanced web search capabilities with better source attribution
4. Consistent API interface with other Gemini functionality
5. Simplified API key management (one key for all Gemini services) 