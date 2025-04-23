import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { expect } from 'chai';
import sinon from 'sinon';
import { documentController } from '../../src/api/controllers/document.controller';
import { authMiddleware } from '../../src/api/middlewares/auth.middleware';
import { documentValidatorMiddleware } from '../../src/api/validators/document.validator';
import { fileUploadConfig } from '../../src/utils/fileUpload';
import { documentService } from '../../src/services/document.service';
import UploadedDocument from '../../src/models/UploadedDocument';
import { DocumentProcessingStatus } from '../../src/models/UploadedDocument';

describe('Document Upload API', () => {
  let app: express.Application;
  const userId = '60d21b4667d0d8992e610c85';
  const testFilePath = path.join(__dirname, '../fixtures/test-document.pdf');
  
  // Create a test PDF file if it doesn't exist
  before(() => {
    const fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    if (!fs.existsSync(testFilePath)) {
      // Create a simple PDF-like content (not a real PDF, just for testing)
      fs.writeFileSync(testFilePath, '%PDF-1.5\nTest Document\n%%EOF');
    }
  });
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware to always set user
    const protectStub = sinon.stub(authMiddleware, 'protect').callsFake((req, res, next) => {
      (req as any).user = { id: userId };
      next();
    });
    
    // Configure the routes
    const router = express.Router();
    const uploadMiddleware = fileUploadConfig.getMulterConfig({
      storage: 'memory',
      maxSize: 10 * 1024 * 1024,
      fieldName: 'document'
    }).single('document');
    
    router.post(
      '/upload',
      authMiddleware.protect,
      uploadMiddleware,
      documentValidatorMiddleware.validateUpload,
      documentValidatorMiddleware.validateFileContent,
      documentController.uploadDocument
    );
    
    app.use('/api/documents', router);
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should upload a document successfully', async () => {
    // Mock the document service
    const processUploadStub = sinon.stub(documentService, 'processUpload').resolves({
      _id: '60d21b4667d0d8992e610c86',
      originalFilename: 'test-document.pdf',
      processingStatus: DocumentProcessingStatus.PENDING,
      createdAt: new Date('2023-07-01T12:00:00.000Z')
    } as unknown as InstanceType<typeof UploadedDocument>);
    
    const response = await request(app)
      .post('/api/documents/upload')
      .attach('document', testFilePath)
      .field('sourceType', 'government')
      .field('title', 'Test Document');
    
    expect(response.status).to.equal(201);
    expect(response.body.status).to.equal('success');
    expect(response.body.data).to.have.property('documentId');
    expect(response.body.data.filename).to.equal('test-document.pdf');
    expect(response.body.data.processingStatus).to.equal('pending');
    
    // Verify service was called with correct arguments
    expect(processUploadStub.calledOnce).to.be.true;
    const serviceArgs = processUploadStub.firstCall.args;
    expect(serviceArgs[0]).to.have.property('originalname', 'test-document.pdf');
    expect(serviceArgs[1]).to.equal(userId);
    expect(serviceArgs[2]).to.equal('government');
  });
  
  it('should reject unsupported file types', async () => {
    // Create a test text file
    const testTxtPath = path.join(__dirname, '../fixtures/test.exe');
    fs.writeFileSync(testTxtPath, 'MZ\nThis is a fake EXE file for testing');
    
    try {
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('document', testTxtPath)
        .field('sourceType', 'private');
      
      expect(response.status).to.equal(400);
      expect(response.body.status).to.equal('error');
      expect(response.body.message).to.include('Unsupported file type');
    } finally {
      // Clean up test file
      if (fs.existsSync(testTxtPath)) {
        fs.unlinkSync(testTxtPath);
      }
    }
  });
  
  it('should validate sourceType field', async () => {
    const response = await request(app)
      .post('/api/documents/upload')
      .attach('document', testFilePath)
      .field('sourceType', 'invalid');
    
    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('error');
    expect(response.body.message).to.include('Invalid source type');
  });
  
  it('should validate metadata field', async () => {
    const response = await request(app)
      .post('/api/documents/upload')
      .attach('document', testFilePath)
      .field('sourceType', 'government')
      .field('metadata', 'not-valid-json');
    
    expect(response.status).to.equal(400);
    expect(response.body.status).to.equal('error');
    expect(response.body.message).to.include('Invalid metadata format');
  });
}); 