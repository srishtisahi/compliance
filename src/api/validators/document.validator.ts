import { Request, Response, NextFunction } from 'express';
import { documentValidator } from '../../utils/documentValidator';
import { SupportedFileType } from '../../models/UploadedDocument';
import { logger } from '../../utils/logger';

interface FileUploadRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * Document validator middleware for validating document uploads
 */
export class DocumentValidatorMiddleware {
  /**
   * Validate the uploaded file
   */
  validateUpload(req: FileUploadRequest, res: Response, next: NextFunction): Response | void {
    try {
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
      }

      const { mimetype, size, originalname, buffer } = req.file;

      // Check file type
      if (!documentValidator.isFileTypeSupported(mimetype)) {
        return res.status(400).json({
          status: 'error',
          message: `Unsupported file type: ${mimetype}. Supported types: ${documentValidator.getSupportedFileTypesString()}`
        });
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (!documentValidator.isValidFileSize(size, maxSize)) {
        return res.status(400).json({
          status: 'error',
          message: `File too large. Maximum size allowed: ${documentValidator.formatFileSize(maxSize)}`
        });
      }

      // Validate source type if provided
      const sourceType = req.body.sourceType;
      if (sourceType && !['government', 'public', 'private'].includes(sourceType)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid source type. Must be one of: government, public, private'
        });
      }

      // Validate document title if provided
      const title = req.body.title;
      if (title && (typeof title !== 'string' || title.length > 255)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid document title. Must be a string with less than 255 characters'
        });
      }

      // Validate metadata if provided
      const metadata = req.body.metadata;
      if (metadata) {
        try {
          const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
          if (typeof parsedMetadata !== 'object' || parsedMetadata === null) {
            return res.status(400).json({
              status: 'error',
              message: 'Invalid metadata format. Must be a valid JSON object'
            });
          }
        } catch (error) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid metadata format. Must be a valid JSON object'
          });
        }
      }

      // If everything is valid, continue
      next();
    } catch (error) {
      logger.error('Error in document validation middleware:', error);
      next(error);
    }
  }

  /**
   * Advanced file validation middleware that performs content validation
   * This should be used after multer middleware but before controller
   */
  async validateFileContent(req: FileUploadRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          status: 'error',
          message: 'No file data available'
        });
      }

      // Check for potential malicious content
      const mightBeMalicious = await documentValidator.mightBeMalicious(
        req.file.buffer,
        req.file.originalname
      );

      if (mightBeMalicious) {
        return res.status(400).json({
          status: 'error',
          message: 'The file appears to be suspicious and has been rejected'
        });
      }

      // Verify MIME type against actual file content
      const detectedMimeType = await documentValidator.detectFileType(req.file.buffer);
      if (detectedMimeType && detectedMimeType !== req.file.mimetype) {
        logger.warn(`MIME type mismatch: claimed ${req.file.mimetype}, detected ${detectedMimeType}`);
        
        // Only reject if the detected type is not supported
        if (!documentValidator.isFileTypeSupported(detectedMimeType)) {
          return res.status(400).json({
            status: 'error',
            message: `File content doesn't match the claimed type. Detected: ${detectedMimeType}`
          });
        }
        
        // Update the mimetype to the detected one
        req.file.mimetype = detectedMimeType;
      }

      // File passed all validations
      next();
    } catch (error) {
      logger.error('Error in file content validation middleware:', error);
      next(error);
    }
  }

  /**
   * Validate a document URL for OCR processing
   */
  validateDocumentUrl(req: Request, res: Response, next: NextFunction): Response | void {
    try {
      const { documentUrl } = req.body;

      // Check if document URL is provided
      if (!documentUrl) {
        return res.status(400).json({
          status: 'error',
          message: 'Document URL is required'
        });
      }

      // Validate the URL format
      if (!this.isValidUrl(documentUrl)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid document URL format'
        });
      }

      // Check if URL points to a supported document type
      const fileExtension = this.getFileExtensionFromUrl(documentUrl);
      if (fileExtension) {
        const supportedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp'];
        if (!supportedExtensions.includes(fileExtension.toLowerCase())) {
          return res.status(400).json({
            status: 'error',
            message: `Unsupported document type: ${fileExtension}. Supported types: PDF, PNG, JPG, TIFF, BMP`
          });
        }
      }

      // If everything is valid, continue
      next();
    } catch (error) {
      logger.error('Error in document URL validation middleware:', error);
      next(error);
    }
  }

  /**
   * Check if a string is a valid URL
   * @param url URL to validate
   * @returns Boolean indicating if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract file extension from URL
   * @param url URL to extract extension from
   * @returns File extension or null if not found
   */
  private getFileExtensionFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastDotIndex = pathname.lastIndexOf('.');
      
      if (lastDotIndex === -1) {
        return null;
      }
      
      return pathname.substring(lastDotIndex);
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const documentValidatorMiddleware = new DocumentValidatorMiddleware(); 