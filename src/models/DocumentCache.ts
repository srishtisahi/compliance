import { MistralOCRResponse } from './MistralOCR';
import { DocumentProcessingStatus } from './UploadedDocument';

/**
 * Interface for document processing cache entries
 */
export interface DocumentProcessingCache {
  documentId: string;
  processedAt: Date;
  status: DocumentProcessingStatus;
  result?: MistralOCRResponse;
  error?: string;
  contentHash?: string;
  metadata?: Record<string, any>;
}

/**
 * Type for content-based cache lookup
 */
export interface ContentHashCache {
  documentIds: string[];
  result: MistralOCRResponse;
  processedAt: Date;
} 