import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface representing a compliance document
 */
export interface IComplianceDocument extends Document {
  title: string;
  content: string;
  source: string;
  jurisdiction: string;
  category: string;
  tags: string[];
  publishedDate: Date;
  effectiveDate?: Date;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for compliance documents
 */
const ComplianceDocumentSchema = new Schema<IComplianceDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
      trim: true,
    },
    jurisdiction: {
      type: String,
      required: [true, 'Jurisdiction is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    publishedDate: {
      type: Date,
      required: [true, 'Published date is required'],
    },
    effectiveDate: {
      type: Date,
    },
    expirationDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for common query patterns
ComplianceDocumentSchema.index({ jurisdiction: 1 });
ComplianceDocumentSchema.index({ category: 1 });
ComplianceDocumentSchema.index({ tags: 1 });
ComplianceDocumentSchema.index({ publishedDate: -1 });

// Create text index for full-text search
ComplianceDocumentSchema.index(
  { title: 'text', content: 'text', tags: 'text' },
  { weights: { title: 10, content: 5, tags: 3 } }
);

export default mongoose.model<IComplianceDocument>('ComplianceDocument', ComplianceDocumentSchema); 