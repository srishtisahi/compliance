import React, { useState } from 'react';
import axios from 'axios';
import { 
  TextAnalysisRequest, 
  DocumentAnalysisRequest, 
  TextAnalysisResponse, 
  DocumentAnalysisResponse,
  ComplianceAnalysisResult
} from '../types/api.types';

interface AnalysisResult {
  /** Analysis results */
  data: ComplianceAnalysisResult | string | any;
  /** Format of the response */
  format: string;
}

interface UseComplianceAnalysisReturn {
  /** Analysis results (can be JSON object, HTML string, etc.) */
  result: AnalysisResult | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Function to analyze text */
  analyzeText: (data: TextAnalysisRequest) => Promise<void>;
  /** Function to analyze document */
  analyzeDocument: (data: DocumentAnalysisRequest) => Promise<void>;
  /** Reset the analysis state */
  reset: () => void;
}

/**
 * Hook for calling compliance analysis endpoints
 */
export function useComplianceAnalysis(): UseComplianceAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const analyzeText = async (data: TextAnalysisRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Handle HTML and Markdown responses specially to get raw text
      if (data.responseFormat === 'html' || data.responseFormat === 'markdown') {
        const response = await axios.post('/api/compliance/analyze/text', data, {
          responseType: 'text'
        });

        setResult({
          data: response.data,
          format: data.responseFormat || 'json'
        });
        return;
      }

      // Standard JSON response handling
      const response = await axios.post<TextAnalysisResponse>(
        '/api/compliance/analyze/text',
        data
      );

      if (response.data.success && response.data.data) {
        setResult({
          data: response.data.data.analysis,
          format: response.data.data.format || 'json'
        });
      } else {
        setError(response.data.message || 'Failed to analyze text');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error analyzing text: ${errorMessage}`);
      console.error('Error analyzing text:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDocument = async (data: DocumentAnalysisRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Handle HTML and Markdown responses specially to get raw text
      if (data.responseFormat === 'html' || data.responseFormat === 'markdown') {
        const response = await axios.post('/api/compliance/analyze/document', data, {
          responseType: 'text'
        });

        setResult({
          data: response.data,
          format: data.responseFormat || 'json'
        });
        return;
      }

      // Standard JSON response handling
      const response = await axios.post<DocumentAnalysisResponse>(
        '/api/compliance/analyze/document',
        data
      );

      if (response.data.success && response.data.data) {
        setResult({
          data: response.data.data.analysis,
          format: response.data.data.format || 'json'
        });
      } else {
        setError(response.data.message || 'Failed to analyze document');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Error analyzing document: ${errorMessage}`);
      console.error('Error analyzing document:', err);
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
    reset
  };
} 