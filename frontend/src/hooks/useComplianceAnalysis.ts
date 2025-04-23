import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

// TODO: Define more specific types based on actual API response
interface AnalysisResultData {
  [key: string]: any; // Placeholder for the analysis result structure
}

interface AnalysisResult {
  data: AnalysisResultData | string; // Can be object or raw HTML/Markdown
  format: 'json' | 'html' | 'markdown' | 'raw';
}

interface TextAnalysisRequest {
  query: string;
  context?: string;
  responseFormat?: 'json' | 'html' | 'markdown' | 'raw';
}

interface DocumentAnalysisRequest {
  documentId: string;
  query: string;
  searchResults?: string[]; // Context from search results if available
  documentText?: string; // Optional pre-extracted text
  responseFormat?: 'json' | 'html' | 'markdown' | 'raw';
}

// Define API response types (matching backend)
interface TextAnalysisResponse {
  success: boolean;
  data?: {
    analysis: AnalysisResultData;
    format?: string;
  };
  message?: string;
}

interface DocumentAnalysisResponse {
  success: boolean;
  data?: {
    documentId: string;
    analysis: AnalysisResultData;
    format?: string;
  };
  message?: string;
}

interface UseComplianceAnalysisReturn {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  analyzeText: (data: TextAnalysisRequest) => Promise<void>;
  analyzeDocument: (data: DocumentAnalysisRequest) => Promise<void>;
  reset: () => void;
}

export function useComplianceAnalysis(): UseComplianceAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setResult(null);
    setIsLoading(false);
    setError(null);
  };

  const analyzeText = async (data: TextAnalysisRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const responseFormat = data.responseFormat || 'json';

    try {
      // --> Use relative path for internal Next.js API route <--
      const textAnalysisUrl = '/api/compliance/analyze/text'; // Internal route path

      // Handle HTML and Markdown responses specially to get raw text
      if (responseFormat === 'html' || responseFormat === 'markdown') {
        const response = await axios.post(
          textAnalysisUrl,
          data,
          {
            responseType: 'text',
            // TODO: Add auth headers if needed
          }
        );
        setResult({
          data: response.data, // Raw HTML/Markdown string
          format: responseFormat,
        });
      } else {
        // Standard JSON response handling
        const response = await axios.post<TextAnalysisResponse>(
          textAnalysisUrl,
          data
          // TODO: Add auth headers if needed
        );

        if (response.data.success && response.data.data) {
          setResult({
            data: response.data.data.analysis,
            format: (response.data.data.format as AnalysisResult['format']) || 'json',
          });
        } else {
          throw new Error(response.data.message || 'Failed to analyze text');
        }
      }
    } catch (err: any) {
      console.error('Error analyzing text:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred during text analysis.';
      setError(errorMessage);
      toast.error(`Text Analysis failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDocument = async (data: DocumentAnalysisRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const responseFormat = data.responseFormat || 'json';

    try {
      // --> Use relative path for internal Next.js API route <--
      const documentAnalysisUrl = '/api/compliance/analyze/document'; // Internal route path

      // Handle HTML and Markdown responses specially to get raw text
      if (responseFormat === 'html' || responseFormat === 'markdown') {
        const response = await axios.post(
          documentAnalysisUrl,
          data,
          {
            responseType: 'text',
            // TODO: Add auth headers if needed
          }
        );
        setResult({
          data: response.data, // Raw HTML/Markdown string
          format: responseFormat,
        });
      } else {
        // Standard JSON response handling
        const response = await axios.post<DocumentAnalysisResponse>(
          documentAnalysisUrl,
          data
          // TODO: Add auth headers if needed
        );

        if (response.data.success && response.data.data) {
          setResult({
            data: response.data.data.analysis,
            format: (response.data.data.format as AnalysisResult['format']) || 'json',
          });
        } else {
          throw new Error(response.data.message || 'Failed to analyze document');
        }
      }
    } catch (err: any) {
      console.error('Error analyzing document:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred during document analysis.';
      setError(errorMessage);
      toast.error(`Document Analysis failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    result,
    isLoading,
    error,
    analyzeText,
    analyzeDocument,
    reset,
  };
} 