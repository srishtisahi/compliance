# Mistral OCR Integration

This document outlines the Mistral OCR integration in our compliance system, which processes documents to extract and format text content.

## Features

- **Robust Error Handling**: Detailed error messages and logging for easier debugging.
- **Retry Logic**: Implements exponential backoff with jitter for API call stability.
- **Text Formatting**: Cleans and formats extracted text for better readability.
- **Confidence Scoring**: Analyzes OCR quality with improved confidence calculation.

## Usage

### Basic Document Processing

```typescript
import { mistralOcrService } from '../services/mistralOcr.service';

// Process a document from a URL
const ocrResult = await mistralOcrService.processDocumentFromUrl('https://example.com/document.pdf');

// Process a document from base64
const fileBase64 = fs.readFileSync('/path/to/document.pdf').toString('base64');
const ocrResult = await mistralOcrService.processDocumentFromBase64(fileBase64);

// Get formatted text content
const formattedText = mistralOcrService.getFormattedText(ocrResult);
```

### Document Understanding (Question Answering)

```typescript
import { mistralOcrService } from '../services/mistralOcr.service';

const answer = await mistralOcrService.queryDocument(
  'https://example.com/document.pdf',
  'What is the deadline for compliance submissions?'
);

console.log(answer.choices[0].message.content);
```

## Retry Configuration

The service includes built-in retry logic with these default settings:

```typescript
{
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2
}
```

This implements exponential backoff with jitter to handle transient API errors gracefully.

## Error Handling

Specific error handling for different scenarios:

- Authentication failures (401)
- Rate limiting (429)
- Bad requests (400)
- Server errors (500+)

Each error type returns a descriptive message to help with troubleshooting.

## Text Formatting

The OCR service formats extracted text with these enhancements:

1. Clear page separators for multi-page documents
2. Removal of unnecessary markdown artifacts
3. Consistent whitespace normalization

## Confidence Scoring

The system calculates OCR confidence using these metrics:

1. Text length relative to expected content amount
2. Presence of common OCR artifacts and errors
3. Document structure quality

This provides a more accurate assessment of OCR quality beyond simple binary measures.

## Best Practices

1. **Error Handling**: Always handle potential exceptions from OCR processing
2. **Large Documents**: Consider processing large documents in batches
3. **Testing**: Validate OCR results with a variety of document types
4. **Rate Limiting**: Be aware of Mistral API rate limits in production

## Environment Configuration

Ensure your `.env` file includes the required Mistral API key:

```
MISTRAL_API_KEY=your_mistral_api_key
```

## Related Services

- `DocumentService`: Manages the document upload and processing lifecycle
- `GeminiService`: Uses processed text for AI analysis and summaries

## Testing

Unit tests are available in `tests/unit/services/mistralOcr.service.test.ts` 