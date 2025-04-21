# Document Processing Cache

This document explains the caching mechanism implemented for document processing in the compliance system.

## Overview

The caching system is designed to:

1. Reduce redundant API calls to external OCR services
2. Speed up document processing by reusing previous results
3. Provide both document ID-based and content-based caching
4. Lower operational costs by minimizing API usage

## Cache Implementation

The caching system uses Redis as the backend storage with the following features:

- **Key-based caching**: Storing results by document and user IDs
- **Content-based caching**: Detecting duplicate documents via content hashing
- **Configurable TTL**: Different expiration times for different cache types
- **Automatic cleanup**: Redis handles expiration of old entries

## Cache Types

### Document ID Cache

- **Key format**: `doc:{documentId}:user:{userId}`
- **Contents**: Complete OCR processing results
- **TTL**: Configurable via `DOCUMENT_CACHE_TTL` (default: 7 days)
- **Purpose**: Fast retrieval of previously processed documents

### Content Hash Cache

- **Key format**: `hash:{contentHash}`
- **Contents**: Document processing results indexed by content fingerprint
- **TTL**: Same as document cache
- **Purpose**: Detect and reuse results for duplicate documents

## Configuration

The caching system can be configured using environment variables:

```env
# Enable/disable caching
CACHE_ENABLED=true

# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Cache TTLs (in seconds)
REDIS_CACHE_TTL=86400          # Default TTL (1 day)
DOCUMENT_CACHE_TTL=604800      # Document cache TTL (7 days)
```

## Implementation Details

### Cache Service

The `CacheService` provides the following functionality:

- Connection management to Redis
- Methods for CRUD operations on cache entries
- Content hash generation for duplicate detection
- Graceful handling of Redis connectivity issues

### Document Service Integration

The document processing workflow integrates caching at these points:

1. **Before processing**: Check if document is already in cache
2. **Content hash check**: Check if identical document has been processed
3. **After processing**: Store results in both document and content caches
4. **Error handling**: Cache negative results (errors) to avoid retrying
5. **Cleanup**: Remove cache entries when documents are deleted

## Performance Considerations

- Cache hit rate can be monitored via logs
- OCR processing is CPU and memory intensive
- Redis instance should be sized appropriately for expected document volume
- Consider using Redis Cluster for high-availability in production

## Testing

To test the caching mechanism:

```bash
npm run test:cache
```

This will run a test script that verifies basic cache operations and document caching. 