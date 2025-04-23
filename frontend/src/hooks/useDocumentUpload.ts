import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner'; // Assuming sonner is used for notifications

// Define the expected data structure within the API response's 'data' field
interface UploadResponseData {
  documentId: string;
  filename: string;
  processingStatus: string;
  extractedText?: string; // <-- Add extractedText field
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
  extractedText: string | null;
}

export function useDocumentUpload(): UseDocumentUploadReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<UploadResponseData | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);

  const uploadDocument = async (
    file: File,
    sourceType: 'government' | 'public' | 'private' = 'private'
  ): Promise<ApiResponse<UploadResponseData> | null> => {
    setIsLoading(true);
    setError(null);
    setUploadData(null);
    setExtractedText(null);

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

      // Use the generic ApiResponse type with UploadResponseData
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
        // Store extracted text if available
        setExtractedText(response.data.data.extractedText || null);
        toast.success(response.data.message || 'Document uploaded and processed successfully.');
        setIsLoading(false);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Document upload failed or processing error.');
      }
    } catch (err: any) {
      console.error('Error uploading document:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred during upload.';
      setError(errorMessage);
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
    extractedText,
  };
} 