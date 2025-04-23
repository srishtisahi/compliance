import mongoose, { Document, Schema } from 'mongoose';
import { ComplianceAnalysisResult } from '../types/api.types';

/**
 * Interface representing a stored compliance analysis record
 */
export interface IComplianceAnalysis extends Document {
  query: string;
  context?: string;
  documentId?: string;
  result: ComplianceAnalysisResult;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  tags?: string[];
  jurisdiction?: string;
  category?: string;
}

/**
 * Schema for compliance analysis results
 */
const ComplianceAnalysisSchema = new Schema<IComplianceAnalysis>(
  {
    query: {
      type: String,
      required: [true, 'Query is required'],
      trim: true,
    },
    context: {
      type: String,
    },
    documentId: {
      type: String,
    },
    result: {
      type: Object,
      required: [true, 'Result is required'],
    },
    userId: {
      type: String,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    jurisdiction: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for common query patterns
ComplianceAnalysisSchema.index({ userId: 1 });
ComplianceAnalysisSchema.index({ jurisdiction: 1 });
ComplianceAnalysisSchema.index({ category: 1 });
ComplianceAnalysisSchema.index({ tags: 1 });
ComplianceAnalysisSchema.index({ createdAt: -1 });
ComplianceAnalysisSchema.index({ documentId: 1 });

// Create text index for full-text search
ComplianceAnalysisSchema.index(
  { query: 'text' },
  { weights: { query: 10 } }
);

export default mongoose.model<IComplianceAnalysis>('ComplianceAnalysis', ComplianceAnalysisSchema); 