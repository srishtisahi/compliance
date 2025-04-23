import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { SupportedFileType } from '../models/UploadedDocument';
import { logger } from './logger';

/**
 * Multer configuration for handling file uploads
 */
class FileUploadConfig {
  /**
   * Create basic multer disk storage
   * @param customPath Optional custom path for file storage
   * @returns Multer storage engine
   */
  createDiskStorage(customPath?: string): multer.StorageEngine {
    // Ensure upload directory exists
    const uploadDir = customPath || process.env.UPLOAD_TEMP_DIR || path.join(process.cwd(), 'uploads', 'temp');
    
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        logger.info(`Created upload directory: ${uploadDir}`);
      } catch (error) {
        logger.error(`Failed to create upload directory: ${uploadDir}`, error);
      }
    }
    
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Generate a secure, unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const fileExt = path.extname(file.originalname);
        const sanitizedFilename = this.sanitizeFilename(file.originalname);
        const baseFilename = path.basename(sanitizedFilename, fileExt);
        
        // Create filename with original name (sanitized), unique suffix, and extension
        cb(null, `${baseFilename}-${uniqueSuffix}${fileExt}`);
      }
    });
  }
  
  /**
   * Create memory storage for temporary file processing
   * @returns Multer memory storage engine
   */
  createMemoryStorage(): multer.StorageEngine {
    return multer.memoryStorage();
  }
  
  /**
   * Create file filter for validating uploads
   * @returns Multer file filter function
   */
  createFileFilter(): multer.Options['fileFilter'] {
    return (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedMimes = Object.values(SupportedFileType);
      
      if (allowedMimes.includes(file.mimetype as SupportedFileType)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${allowedMimes.join(', ')}`));
      }
    };
  }
  
  /**
   * Configure multer with customizable options
   * @param options Configuration options
   * @returns Configured multer instance
   */
  getMulterConfig(options: {
    storage?: 'disk' | 'memory';
    maxSize?: number;
    uploadPath?: string;
    fieldName?: string;
  } = {}): multer.Multer {
    const {
      storage = 'disk',
      maxSize = 10 * 1024 * 1024, // 10MB default
      uploadPath,
      fieldName = 'document'
    } = options;
    
    const multerOptions: multer.Options = {
      limits: {
        fileSize: maxSize,
        files: 1 // Limit to single file upload by default
      },
      fileFilter: this.createFileFilter()
    };
    
    // Set storage type
    if (storage === 'memory') {
      multerOptions.storage = this.createMemoryStorage();
    } else {
      multerOptions.storage = this.createDiskStorage(uploadPath);
    }
    
    return multer(multerOptions);
  }
  
  /**
   * Sanitize a filename to prevent directory traversal and other issues
   * @param filename Original filename
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove path components
    const basename = path.basename(filename);
    
    // Replace potentially dangerous or problematic characters
    return basename
      .replace(/[/\\?%*:|"<>]/g, '-') // Remove characters not allowed in filenames
      .replace(/\s+/g, '_'); // Replace spaces with underscores
  }
}

// Export singleton instance
export const fileUploadConfig = new FileUploadConfig(); 