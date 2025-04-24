import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner'; // Assuming sonner is used for notifications
// Import the analysis result type
import { ComplianceAnalysisResult } from '@/lib/types/api.types';

// Define the expected data structure within the API response's 'data' field
interface UploadResponseData {
  documentId: string;
  filename: string;
  processingStatus: string;
  extractedText?: string; // <-- Add extractedText field
  analysis?: ComplianceAnalysisResult | null; // <-- Add analysis field
  analysisError?: string | null; // <-- Add analysisError field
}

// Define the overall API response structure
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T; // Data field is optional
}

interface UseDocumentUploadReturn {
  uploadDocument: (file: File, sourceType?: 'government' | 'public' | 'private') => Promise<ApiResponse<UploadResponseData> | null>;
  isLoading: boolean;
  error: string | null;
  uploadData: UploadResponseData | null;
  analysisResult: ComplianceAnalysisResult | null; // <-- Add state for analysis result
}

export function useDocumentUpload(): UseDocumentUploadReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<UploadResponseData | null>(null);
  // Add new state for analysis result
  const [analysisResult, setAnalysisResult] = useState<ComplianceAnalysisResult | null>(null);

  const uploadDocument = async (
    file: File,
    sourceType: 'government' | 'public' | 'private' = 'private'
  ): Promise<ApiResponse<UploadResponseData> | null> => {
    setIsLoading(true);
    setError(null);
    setUploadData(null);
    setAnalysisResult(null); // Reset analysis state

    const formData = new FormData();
    formData.append('document', file);
    formData.append('sourceType', sourceType);

    try {
      // TODO: Add authentication header if required
      // const token = localStorage.getItem('auth_token');
      // const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // --> Use relative path for internal Next.js API route <--
      // const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'; 
      // const uploadUrl = `${apiBaseUrl}/api/v1/documents/upload`;
      const uploadUrl = '/api/documents/upload'; // Internal route path

      // Update the expected type in axios.post to include the analysis field
      const response = await axios.post<ApiResponse<UploadResponseData>>(
        uploadUrl,
        formData,
        {
          // headers, // Uncomment when auth is added
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Check for success field and data presence
      if (response.data && response.data.success && response.data.data) {
        setUploadData(response.data.data);
        // Update analysis state
        setAnalysisResult(response.data.data.analysis || null);
        
        // Optionally check for analysis error in the response data
        if (response.data.data.analysisError) {
          toast.warning(`Analysis completed with issues: ${response.data.data.analysisError}`);
        } else {
          toast.success(response.data.message || 'Document uploaded and analyzed successfully.');
        }

        setIsLoading(false);
        return response.data; // Return the full data including analysis
      } else {
        // Handle cases where success is false or data is missing
        setAnalysisResult(null); // Ensure analysis is null on failure
        throw new Error(response.data.message || 'Document upload failed or processing error.');
      }
    } catch (err: any) {
      console.error('Error uploading document:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred during upload.';
      setError(errorMessage);
      setAnalysisResult(null); // Ensure analysis is null on error
      toast.error(`Upload failed: ${errorMessage}`);
      setIsLoading(false);
      return null;
    }
  };

  return {
    uploadDocument,
    isLoading,
    error,
    uploadData,
    analysisResult, // <-- Return analysis state
  };
} 