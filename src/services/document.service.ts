import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import * as fileType from 'file-type';
import { logger } from '../utils/logger';
import { documentValidator } from '../utils/documentValidator';
import UploadedDocument, { 
  IUploadedDocument, 
  DocumentProcessingStatus, 
  SupportedFileType 
} from '../models/UploadedDocument';
import { mistralOcrService } from './mistralOcr.service';
import { cacheService } from './cache.service';
import { DocumentProcessingCache, ContentHashCache } from '../models/DocumentCache';

const unlinkAsync = promisify(fs.unlink);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

/**
 * Service for handling document uploads and processing
 */
export class DocumentService {
  private uploadDir: string;
  private cacheTtl: number;
  private isCachingEnabled: boolean;
  
  constructor() {
    // Get upload directory from env or use default
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.cacheTtl = parseInt(process.env.DOCUMENT_CACHE_TTL || '604800', 10); // Default: 7 days
    this.isCachingEnabled = process.env.CACHE_ENABLED === 'true';
    
    // Ensure upload directory exists
    this.ensureUploadDirExists();
  }
  
  /**
   * Ensure the upload directory exists
   */
  private async ensureUploadDirExists(): Promise<void> {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        await mkdirAsync(this.uploadDir, { recursive: true });
        logger.info(`Created upload directory: ${this.uploadDir}`);
      }
    } catch (error) {
      logger.error('Error creating upload directory:', error);
      throw new Error('Failed to create upload directory');
    }
  }
  
  /**
   * Validate if the file type is supported
   * @param mimeType The MIME type to validate
   * @returns Boolean indicating if the file type is supported
   */
  validateFileType(mimeType: string): boolean {
    return documentValidator.isFileTypeSupported(mimeType);
  }
  
  /**
   * Generate a secure filename to prevent path traversal attacks
   * @param originalFilename Original filename from the user
   * @returns A secure filename
   */
  generateSecureFilename(originalFilename: string): string {
    const fileExt = path.extname(originalFilename);
    const randomString = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomString}${fileExt}`;
  }
  
  /**
   * Process and save an uploaded file
   * @param file The uploaded file object
   * @param userId The ID of the user who uploaded the file
   * @param sourceType The type of document source (government, public, private)
   * @returns The saved document record
   */
  async processUpload(
    file: Express.Multer.File,
    userId: string,
    sourceType: 'government' | 'public' | 'private' = 'private'
  ): Promise<IUploadedDocument> {
    try {
      // Validate file existence
      if (!file) {
        throw new Error('No file uploaded');
      }
      
      // Validate file size
      if (!documentValidator.isValidFileSize(file.size)) {
        throw new Error(`File size exceeds the 10MB limit. Current size: ${documentValidator.formatFileSize(file.size)}`);
      }
      
      // Read file buffer for further validation
      const fileBuffer = await readFileAsync(file.path);
      
      // Check for potentially malicious files
      const isMalicious = await documentValidator.mightBeMalicious(fileBuffer, file.originalname);
      if (isMalicious) {
        // Clean up temp file
        await unlinkAsync(file.path);
        throw new Error('File appears to be potentially malicious and was rejected');
      }
      
      // Double-check file type for security (don't trust client-side MIME type)
      const detectedType = await documentValidator.detectFileType(fileBuffer);
      
      if (!detectedType || !this.validateFileType(detectedType)) {
        // Clean up temp file
        await unlinkAsync(file.path);
        const supportedTypes = documentValidator.getSupportedFileTypesString();
        throw new Error(`Unsupported file type: ${detectedType || 'unknown'}. Supported types: ${supportedTypes}`);
      }
      
      // Generate secure filename and final path
      const secureFilename = this.generateSecureFilename(file.originalname);
      const finalPath = path.join(this.uploadDir, secureFilename);
      
      // Move file from temp location to final destination
      await writeFileAsync(finalPath, fileBuffer);
      
      // Clean up original temp file
      if (file.path !== finalPath) {
        await unlinkAsync(file.path);
      }
      
      // Set priority based on source type
      let priority = 0;
      if (sourceType === 'government') {
        priority = 10;
      } else if (sourceType === 'public') {
        priority = 5;
      }
      
      // Create document record in database
      const document = await UploadedDocument.create({
        filename: secureFilename,
        originalFilename: file.originalname,
        mimeType: detectedType,
        size: file.size,
        path: finalPath,
        userId,
        sourceType,
        priority,
        processingStatus: DocumentProcessingStatus.PENDING
      });
      
      logger.info(`Document uploaded successfully: ${document._id}`);
      
      // Queue document for OCR processing (asynchronously)
      this.queueForOcrProcessing(document._id);
      
      return document;
    } catch (error) {
      logger.error('Error processing document upload:', error);
      throw error;
    }
  }
  
  /**
   * Queue a document for OCR processing
   * @param documentId The ID of the document to process
   */
  async queueForOcrProcessing(documentId: string): Promise<void> {
    try {
      // Update document status to processing
      const document = await UploadedDocument.findByIdAndUpdate(
        documentId,
        { processingStatus: DocumentProcessingStatus.PROCESSING },
        { new: true }
      );
      
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }
      
      // Process asynchronously (in a real system, would use a job queue like Bull)
      setImmediate(async () => {
        try {
          // Check cache first before processing
          if (this.isCachingEnabled) {
            const cachedResult = await this.checkDocumentCache(document._id.toString(), document.userId.toString());
            if (cachedResult) {
              logger.info(`Retrieved document ${documentId} processing results from cache`);
              return;
            }
          }
          
          await this.processDocumentWithOcr(document);
        } catch (error) {
          logger.error(`OCR processing failed for document ${documentId}:`, error);
          await UploadedDocument.findByIdAndUpdate(documentId, {
            processingStatus: DocumentProcessingStatus.FAILED,
            processingError: error instanceof Error ? error.message : String(error)
          });
        }
      });
    } catch (error) {
      logger.error(`Error queueing document ${documentId} for OCR:`, error);
      throw error;
    }
  }
  
  /**
   * Check if document processing results are in cache
   * @param documentId Document ID
   * @param userId User ID
   * @returns Boolean indicating if the cache hit was successful
   */
  private async checkDocumentCache(documentId: string, userId: string): Promise<boolean> {
    try {
      const cacheKey = cacheService.generateCacheKey(documentId, userId);
      const cachedData = await cacheService.get<DocumentProcessingCache>(cacheKey);
      
      if (!cachedData) {
        return false;
      }
      
      // Cache hit - update document with cached result
      logger.info(`Cache hit for document ${documentId}`);
      
      const updateData: any = {
        processingStatus: cachedData.status,
        'ocr.processedAt': cachedData.processedAt
      };
      
      if (cachedData.result) {
        // Get formatted text from cached OCR result
        const textContent = mistralOcrService.getFormattedText(cachedData.result);
        
        // Calculate confidence score
        const confidence = this.calculateConfidenceScore(
          textContent, 
          cachedData.result.pages.length
        );
        
        updateData.extractedText = textContent;
        updateData['ocr.textContent'] = textContent;
        updateData['ocr.confidence'] = confidence;
      }
      
      if (cachedData.error) {
        updateData.processingError = cachedData.error;
      }
      
      // Update the document with cached data
      await UploadedDocument.findByIdAndUpdate(documentId, updateData);
      
      return true;
    } catch (error) {
      logger.error(`Error checking document cache for ${documentId}:`, error);
      return false;
    }
  }
  
  /**
   * Process a document with OCR
   * @param document The document to process
   */
  private async processDocumentWithOcr(document: IUploadedDocument): Promise<void> {
    try {
      logger.info(`Starting OCR processing for document: ${document._id}`);
      
      // For images, use image processing, for PDFs and other docs use document processing
      const isImage = document.mimeType.startsWith('image/');
      
      // Read file as buffer for content hash
      const fileBuffer = await readFileAsync(document.path);
      
      // Check content hash cache if enabled
      if (this.isCachingEnabled) {
        const contentHash = cacheService.generateContentHash(fileBuffer);
        const contentCacheKey = `hash:${contentHash}`;
        
        // Check if a document with identical content has been processed
        const contentCache = await cacheService.get<ContentHashCache>(contentCacheKey);
        
        if (contentCache) {
          logger.info(`Found content hash match for document ${document._id}`);
          
          // We have processed an identical document before, use those results
          const textContent = mistralOcrService.getFormattedText(contentCache.result);
          const confidence = this.calculateConfidenceScore(textContent, contentCache.result.pages.length);
          
          // Update document with results from content cache
          await UploadedDocument.findByIdAndUpdate(document._id, {
            processingStatus: DocumentProcessingStatus.PROCESSED,
            extractedText: textContent,
            ocr: {
              processedAt: new Date(),
              textContent,
              confidence
            },
            metadata: {
              ...document.metadata,
              contentHash,
              cachedProcessing: true
            }
          });
          
          // Also cache by document ID for faster future lookups
          const documentCacheKey = cacheService.generateCacheKey(
            document._id.toString(), 
            document.userId.toString()
          );
          
          await cacheService.set(
            documentCacheKey,
            {
              documentId: document._id.toString(),
              processedAt: new Date(),
              status: DocumentProcessingStatus.PROCESSED,
              result: contentCache.result,
              contentHash
            } as DocumentProcessingCache,
            this.cacheTtl
          );
          
          logger.info(`OCR processing completed (via content cache) for document: ${document._id}`);
          return;
        }
      }
      
      // Convert buffer to base64
      const fileBase64 = fileBuffer.toString('base64');
      
      // Process with Mistral OCR with retries
      let ocrResult;
      try {
        ocrResult = isImage
          ? await mistralOcrService.processImageFromBase64(fileBase64)
          : await mistralOcrService.processDocumentFromBase64(fileBase64);
      } catch (error) {
        logger.error(`OCR processing failed after retries for document ${document._id}:`, error);
        
        // Cache the failure if caching is enabled
        if (this.isCachingEnabled) {
          const cacheKey = cacheService.generateCacheKey(
            document._id.toString(), 
            document.userId.toString()
          );
          
          await cacheService.set(
            cacheKey,
            {
              documentId: document._id.toString(),
              processedAt: new Date(),
              status: DocumentProcessingStatus.FAILED,
              error: error instanceof Error ? error.message : String(error)
            } as DocumentProcessingCache,
            this.cacheTtl
          );
        }
        
        await UploadedDocument.findByIdAndUpdate(document._id, {
          processingStatus: DocumentProcessingStatus.FAILED,
          processingError: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
      
      // Get formatted text content
      const textContent = mistralOcrService.getFormattedText(ocrResult);
      
      // Calculate confidence score based on content quality
      const confidence = this.calculateConfidenceScore(textContent, ocrResult.pages.length);
      
      // Update document with OCR results
      await UploadedDocument.findByIdAndUpdate(document._id, {
        processingStatus: DocumentProcessingStatus.PROCESSED,
        extractedText: textContent,
        ocr: {
          processedAt: new Date(),
          textContent,
          confidence
        }
      });
      
      // Cache results if enabled
      if (this.isCachingEnabled) {
        // Cache by document ID
        const documentCacheKey = cacheService.generateCacheKey(
          document._id.toString(), 
          document.userId.toString()
        );
        
        const contentHash = cacheService.generateContentHash(fileBuffer);
        
        await cacheService.set(
          documentCacheKey,
          {
            documentId: document._id.toString(),
            processedAt: new Date(),
            status: DocumentProcessingStatus.PROCESSED,
            result: ocrResult,
            contentHash
          } as DocumentProcessingCache,
          this.cacheTtl
        );
        
        // Also cache by content hash
        const contentCacheKey = `hash:${contentHash}`;
        await cacheService.set(
          contentCacheKey,
          {
            documentIds: [document._id.toString()],
            result: ocrResult,
            processedAt: new Date()
          } as ContentHashCache,
          this.cacheTtl
        );
      }
      
      logger.info(`OCR processing completed successfully for document: ${document._id}`);
    } catch (error) {
      logger.error(`OCR processing error for document ${document._id}:`, error);
      await UploadedDocument.findByIdAndUpdate(document._id, {
        processingStatus: DocumentProcessingStatus.FAILED,
        processingError: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Calculate a confidence score for the OCR results
   * @param textContent The extracted text content
   * @param pageCount Number of pages in the document
   * @returns Confidence score between 0 and 1
   */
  private calculateConfidenceScore(textContent: string, pageCount: number): number {
    if (!textContent || textContent.length === 0) {
      return 0;
    }
    
    // Basic heuristics for confidence calculation:
    // 1. Check text length relative to expected length for number of pages
    const expectedMinLengthPerPage = 100; // Characters
    const lengthScore = Math.min(
      1, 
      textContent.length / (expectedMinLengthPerPage * pageCount)
    );
    
    // 2. Check for common OCR artifacts or problems
    const artifactScore = this.checkForOcrArtifacts(textContent);
    
    // 3. Check paragraph structure - text should have some structure
    const structureScore = textContent.includes('\n') ? 0.9 : 0.5;
    
    // Calculate weighted score
    const weightedScore = (
      lengthScore * 0.5 + 
      artifactScore * 0.3 + 
      structureScore * 0.2
    );
    
    return Math.max(0.1, Math.min(1, weightedScore));
  }
  
  /**
   * Check for common OCR artifacts and problems
   * @param text The text to check
   * @returns Score between 0 and 1 (1 = fewer artifacts)
   */
  private checkForOcrArtifacts(text: string): number {
    // Check for repeated unusual characters that might indicate OCR errors
    const unusualPatterns = [
      /[\x00-\x1F\x7F-\x9F]{2,}/g,      // Control characters
      /[^\w\s.,;:!?(){}\[\]"'\/\\-]{3,}/g, // Unusual symbols repeated
      /\d{20,}/g,                        // Very long number sequences
    ];
    
    let artifactCount = 0;
    
    unusualPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        artifactCount += matches.length;
      }
    });
    
    // Calculate score based on artifact density
    const artifactDensity = artifactCount / Math.max(1, text.length / 100);
    return Math.max(0, 1 - Math.min(1, artifactDensity));
  }
  
  /**
   * Get document by ID
   * @param documentId The ID of the document to retrieve
   * @param userId The ID of the user requesting the document
   * @returns The document or null if not found
   */
  async getDocumentById(documentId: string, userId: string): Promise<IUploadedDocument | null> {
    return UploadedDocument.findOne({ _id: documentId, userId });
  }
  
  /**
   * Get all documents for a user
   * @param userId The ID of the user
   * @param status Optional processing status filter
   * @returns Array of documents
   */
  async getUserDocuments(
    userId: string, 
    status?: DocumentProcessingStatus
  ): Promise<IUploadedDocument[]> {
    const query: any = { userId };
    
    if (status) {
      query.processingStatus = status;
    }
    
    return UploadedDocument.find(query).sort({ createdAt: -1 });
  }
  
  /**
   * Delete a document and remove from cache
   */
  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      const document = await UploadedDocument.findOne({ _id: documentId, userId });
      
      if (!document) {
        logger.warn(`Document not found or doesn't belong to user: ${documentId}`);
        return false;
      }
      
      // Delete the file from storage
      if (fs.existsSync(document.path)) {
        await unlinkAsync(document.path);
      }
      
      // Delete from database
      await UploadedDocument.deleteOne({ _id: documentId });
      
      // Delete from cache if enabled
      if (this.isCachingEnabled) {
        const cacheKey = cacheService.generateCacheKey(documentId, userId);
        await cacheService.delete(cacheKey);
        
        // If we have a content hash, also update the content hash cache
        if (document.metadata?.contentHash) {
          const contentHash = document.metadata.contentHash as string;
          const contentCacheKey = `hash:${contentHash}`;
          
          const contentCache = await cacheService.get<ContentHashCache>(contentCacheKey);
          if (contentCache) {
            // Remove this document from the content hash cache
            const updatedDocIds = contentCache.documentIds.filter(id => id !== documentId);
            
            if (updatedDocIds.length === 0) {
              // No more documents with this hash, delete the entire cache entry
              await cacheService.delete(contentCacheKey);
            } else {
              // Update the cache with the remaining document IDs
              contentCache.documentIds = updatedDocIds;
              await cacheService.set(contentCacheKey, contentCache, this.cacheTtl);
            }
          }
        }
      }
      
      logger.info(`Document ${documentId} deleted successfully`);
      return true;
    } catch (error) {
      logger.error(`Error deleting document ${documentId}:`, error);
      throw error;
    }
  }
}

// Export as singleton
export const documentService = new DocumentService(); 