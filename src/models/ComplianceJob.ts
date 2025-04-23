import mongoose, { Schema, Document } from 'mongoose';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum JobType {
  SEARCH = 'search',
  DOCUMENT_ANALYSIS = 'document_analysis',
  WEB_SCRAPING = 'web_scraping',
  GEMINI_WEB_SEARCH = 'gemini_web_search',
}

export interface IComplianceJob extends Document {
  jobId: string;
  userId?: string;
  jobType: JobType;
  status: JobStatus;
  progress: number;
  query: string;
  documentId?: string;
  params?: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  result?: Record<string, any>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplianceJobSchema: Schema = new Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    jobType: {
      type: String,
      enum: Object.values(JobType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    query: {
      type: String,
      required: true,
    },
    documentId: {
      type: String,
    },
    params: {
      type: Schema.Types.Mixed,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    result: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
ComplianceJobSchema.index({ createdAt: -1 });
ComplianceJobSchema.index({ jobType: 1, status: 1 });

export const ComplianceJob = mongoose.model<IComplianceJob>('ComplianceJob', ComplianceJobSchema);

export default ComplianceJob; 