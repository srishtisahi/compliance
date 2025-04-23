import mongoose, { Document, Schema } from 'mongoose';

/**
 * Enum for document processing status
 */
export enum DocumentProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed'
}

/**
 * Enum for supported file types
 */
export enum SupportedFileType {
  PDF = 'application/pdf',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC = 'application/msword',
  TXT = 'text/plain',
  PNG = 'image/png',
  JPG = 'image/jpeg',
  JPEG = 'image/jpeg' // Ensure consistent value for JPG/JPEG
}

/**
 * Interface representing an uploaded document
 */
export interface IUploadedDocument extends Document {
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  path: string;
  userId: mongoose.Types.ObjectId;
  processingStatus: DocumentProcessingStatus;
  processingError?: string;
  extractedText?: string;
  sourceType: 'government' | 'public' | 'private';
  priority: number;
  ocr?: {
    processedAt?: Date;
    textContent?: string;
    confidence?: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for uploaded documents
 */
const UploadedDocumentSchema = new Schema<IUploadedDocument>(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true
    },
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      enum: Object.values(SupportedFileType)
    },
    size: {
      type: Number,
      required: [true, 'File size is required']
    },
    path: {
      type: String,
      required: [true, 'File path is required']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Assuming a User model might also be migrated or defined
      required: [true, 'User ID is required']
    },
    processingStatus: {
      type: String,
      enum: Object.values(DocumentProcessingStatus),
      default: DocumentProcessingStatus.PENDING
    },
    processingError: {
      type: String
    },
    extractedText: {
      type: String
    },
    sourceType: {
      type: String,
      enum: ['government', 'public', 'private'],
      default: 'private'
    },
    priority: {
      type: Number,
      default: 0 // Higher numbers = higher priority
    },
    ocr: {
      processedAt: Date,
      textContent: String,
      confidence: Number
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for common query patterns
UploadedDocumentSchema.index({ userId: 1 });
UploadedDocumentSchema.index({ processingStatus: 1 });
UploadedDocumentSchema.index({ sourceType: 1 });
UploadedDocumentSchema.index({ createdAt: -1 });
UploadedDocumentSchema.index({ priority: -1 });

// Check if the model is already compiled to prevent OverwriteModelError in Next.js HMR.
// Use `mongoose.models` dictionary.
export default mongoose.models.UploadedDocument || mongoose.model<IUploadedDocument>('UploadedDocument', UploadedDocumentSchema); 