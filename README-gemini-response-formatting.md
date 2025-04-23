# Gemini Response Formatter for Compliance Information

This utility enhances Google Gemini API responses with source attribution and confidence levels for legal compliance information. It provides structured, attributed data with confidence indicators to help construction industry professionals make informed decisions.

## Features

- **Source Attribution**: Properly tracks and displays the origin of each piece of information
- **Confidence Levels**: Assigns confidence ratings (HIGH, MEDIUM, LOW, UNCERTAIN) based on source quality
- **Multiple Export Formats**: Outputs in JSON, HTML, and Markdown formats
- **Risk Severity Assessment**: Analyzes and assigns severity levels to compliance risks
- **Jurisdictional Context**: Preserves important jurisdictional information
- **Government Source Prioritization**: Assigns higher confidence to government sources
- **Audit Trail**: Maintains clear records of information sources

## Usage

### Basic Usage

```typescript
import { GeminiFormattingService } from './services/geminiFormatting.service';

// Create formatter service
const formattingService = new GeminiFormattingService();

// Example query and context
const query = "What are the latest OSHA requirements for fall protection?";
const context = "Context information from searches or documents...";

// Get formatted response with confidence levels (JSON format)
const response = await formattingService.analyzeComplianceInfo(
  context,
  query,
  {
    format: 'json',
    exportOptions: {
      includeMetadata: true,
      includeDisclaimer: true,
      includeSources: true,
      includeConfidenceIndicators: true
    }
  }
);

// Process the structured data
console.log(`Overall confidence: ${response.overallConfidence}`);
console.log(`Key findings: ${response.keyFindings.length}`);
console.log(`Legal obligations: ${response.obligations.length}`);
```

### API Integration

```typescript
// In your API controller
app.post('/api/compliance/analyze', async (req, res) => {
  const { query, context, responseFormat } = req.body;
  
  const formattingService = new GeminiFormattingService();
  
  const analysis = await formattingService.analyzeComplianceInfo(
    context,
    query,
    {
      format: responseFormat || 'json',
      exportOptions: {
        includeMetadata: true,
        includeDisclaimer: true
      }
    }
  );
  
  // For HTML or Markdown formats, return text directly
  if (responseFormat === 'html' || responseFormat === 'markdown') {
    res.setHeader('Content-Type', 
      responseFormat === 'html' ? 'text/html' : 'text/markdown');
    return res.send(analysis);
  }
  
  // For JSON, wrap in standard API response
  return res.json({
    success: true,
    data: {
      analysis,
      format: responseFormat || 'json'
    }
  });
});
```

### Frontend Rendering

```typescript
import { useComplianceAnalysis } from '../hooks/useComplianceAnalysis';

const ComplianceResults = () => {
  const { result, isLoading, error, analyzeText } = useComplianceAnalysis();
  
  // Submit a query with a specific format
  const handleSubmit = async (query, context) => {
    await analyzeText({
      query,
      context,
      responseFormat: 'html' // or 'json', 'markdown', 'raw'
    });
  };
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // Display the results based on format
  if (result?.format === 'html') {
    return <div dangerouslySetInnerHTML={{ __html: result.data }} />;
  } else if (result?.format === 'markdown') {
    // Use a markdown renderer component
    return <MarkdownRenderer content={result.data} />;
  } else if (result?.format === 'json') {
    // Render the structured JSON data
    return (
      <div>
        <h2>Compliance Analysis</h2>
        <div className="summary">{result.data.summary}</div>
        <h3>Legal Obligations</h3>
        <ul>
          {result.data.obligations.map((obligation, i) => (
            <li key={i}>
              {obligation.text}
              <ConfidenceBadge level={obligation.confidence} />
            </li>
          ))}
        </ul>
        {/* Render other sections */}
      </div>
    );
  }
  
  return null;
};
```

## Core Components

### 1. Response Formatter

The `formatComplianceResponse` function in `geminiResponseFormatter.ts` processes raw Gemini API responses and adds:

- Source attribution based on citation matching
- Confidence levels based on source types and corroboration
- Structured sections (obligations, risks, etc.)
- Key findings extraction
- Risk severity assessment

### 2. Response Exporters

Exporters in `geminiResponseExporter.ts` convert the structured data to different formats:

- **HTML**: Visually formatted with confidence badges, proper styling, and source citations
- **Markdown**: Portable text format with structured headings and formatting
- **JSON**: Simplified client-friendly JSON format for frontend consumption

### 3. Formatting Service

The `GeminiFormattingService` class handles interaction with the core Gemini API service and applies formatting utilities. It provides a clean interface for:

- Compliance information analysis with attribution
- Document-specific compliance analysis
- Format selection and export options

## Configuration Options

### Export Options

```typescript
interface ExportOptions {
  includeMetadata?: boolean;     // Include generation timestamps, model info
  includeDisclaimer?: boolean;   // Include legal disclaimer
  includeSources?: boolean;      // Include source citations
  includeConfidenceIndicators?: boolean; // Include confidence level badges
  format?: 'html' | 'json' | 'markdown'; // Output format
}
```

### Response Format Types

```typescript
type ResponseFormat = 'json' | 'html' | 'markdown' | 'raw';
```

## Best Practices

1. **Always include confidence indicators** in user-facing interfaces to help users gauge reliability
2. **Provide source links** whenever possible to allow users to verify information
3. **Consider using HTML format** for direct user viewing, as it includes proper styling and confidence badges
4. **For programmatic use**, select JSON format for structured data processing
5. **Include disclaimers** in user-facing reports to clarify legal liability
6. **Use formatted responses** for all compliance information to maintain consistent attribution

## Example

See `src/examples/GeminiFormattingExample.ts` for comprehensive examples of usage patterns. 