import { Request, Response, NextFunction } from 'express';
import * as multer from 'multer';
import { documentService } from '../../services/document.service';
import { logger } from '../../utils/logger';
import { DocumentProcessingStatus } from '../../models/UploadedDocument';

// Extended request type with user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
  file?: Express.Multer.File;
}

/**
 * Controller for document-related operations
 */
export class DocumentController {
  /**
   * Upload a document for processing
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async uploadDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate file presence (multer should add file to req)
      if (!req.file) {
        res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
        return;
      }

      // Get sourceType from request body (default to private)
      const sourceType = req.body.sourceType || 'private';
      
      // Validate sourceType
      if (!['government', 'public', 'private'].includes(sourceType)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid source type. Must be one of: government, public, private'
        });
        return;
      }

      // Get user ID from authenticated request
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      // Process the uploaded document
      const document = await documentService.processUpload(
        req.file,
        userId,
        sourceType as 'government' | 'public' | 'private'
      );

      // Return success response with document details
      res.status(201).json({
        status: 'success',
        message: 'Document uploaded successfully',
        data: {
          documentId: document._id,
          filename: document.originalFilename,
          processingStatus: document.processingStatus,
          createdAt: document.createdAt
        }
      });
    } catch (error) {
      logger.error('Error uploading document:', error);
      next(error);
    }
  }

  /**
   * Get document processing status
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async getDocumentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const documentId = req.params.documentId;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      // Get document details
      const document = await documentService.getDocumentById(documentId, userId);

      if (!document) {
        res.status(404).json({
          status: 'error',
          message: 'Document not found'
        });
        return;
      }

      // Return document status
      res.status(200).json({
        status: 'success',
        data: {
          documentId: document._id,
          filename: document.originalFilename,
          processingStatus: document.processingStatus,
          processingError: document.processingError,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error getting document status:', error);
      next(error);
    }
  }

  /**
   * Get document analysis results
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async getDocumentAnalysis(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const documentId = req.params.documentId;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      // Get document details
      const document = await documentService.getDocumentById(documentId, userId);

      if (!document) {
        res.status(404).json({
          status: 'error',
          message: 'Document not found'
        });
        return;
      }

      // Check if document processing is complete
      if (document.processingStatus !== DocumentProcessingStatus.PROCESSED) {
        res.status(202).json({
          status: 'pending',
          message: `Document processing status: ${document.processingStatus}`,
          data: {
            documentId: document._id,
            processingStatus: document.processingStatus,
            processingError: document.processingError
          }
        });
        return;
      }

      // Return document analysis results
      res.status(200).json({
        status: 'success',
        data: {
          documentId: document._id,
          filename: document.originalFilename,
          extractedText: document.extractedText,
          ocr: document.ocr,
          metadata: document.metadata,
          processingStatus: document.processingStatus,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error getting document analysis:', error);
      next(error);
    }
  }

  /**
   * Get all documents for the current user
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async getUserDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      // Get status filter from query params
      const status = req.query.status as DocumentProcessingStatus | undefined;

      // Get documents for user
      const documents = await documentService.getUserDocuments(userId, status);

      // Return documents list
      res.status(200).json({
        status: 'success',
        results: documents.length,
        data: documents.map(doc => ({
          documentId: doc._id,
          filename: doc.originalFilename,
          processingStatus: doc.processingStatus,
          sourceType: doc.sourceType,
          createdAt: doc.createdAt,
          size: doc.size
        }))
      });
    } catch (error) {
      logger.error('Error getting user documents:', error);
      next(error);
    }
  }

  /**
   * Delete a document
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async deleteDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const documentId = req.params.documentId;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      // Delete document
      const success = await documentService.deleteDocument(documentId, userId);

      if (!success) {
        res.status(404).json({
          status: 'error',
          message: 'Document not found or you do not have permission to delete it'
        });
        return;
      }

      // Return success response
      res.status(200).json({
        status: 'success',
        message: 'Document deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting document:', error);
      next(error);
    }
  }
}

// Export singleton instance
export const documentController = new DocumentController(); 