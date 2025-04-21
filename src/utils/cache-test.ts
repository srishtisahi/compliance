import { cacheService } from '../services/cache.service';
import { logger } from './logger';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { documentService } from '../services/document.service';
import UploadedDocument, { DocumentProcessingStatus } from '../models/UploadedDocument';

// Load environment variables
dotenv.config();

/**
 * Test the document processing cache
 */
async function testDocumentCache() {
  try {
    logger.info('Starting cache test...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI_DEV?.replace('<db_password>', process.env.MONGODB_PASSWORD || '');
    if (!mongoUri) {
      throw new Error('MongoDB URI is not configured');
    }
    
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
    
    // Test basic cache operations
    const testKey = 'test:cache:key';
    const testValue = { message: 'Hello from cache test', timestamp: Date.now() };
    
    logger.info('Testing basic cache operations...');
    
    // Set cache value
    const setResult = await cacheService.set(testKey, testValue);
    logger.info(`Cache set result: ${setResult}`);
    
    // Get cache value
    const cachedValue = await cacheService.get(testKey);
    logger.info(`Cache get result: ${JSON.stringify(cachedValue)}`);
    
    // Check existence
    const exists = await cacheService.exists(testKey);
    logger.info(`Cache key exists: ${exists}`);
    
    // Delete cache entry
    const deleteResult = await cacheService.delete(testKey);
    logger.info(`Cache delete result: ${deleteResult}`);
    
    // Verify deletion
    const afterDelete = await cacheService.exists(testKey);
    logger.info(`Cache key exists after delete: ${afterDelete}`);
    
    // Test content hash functionality
    logger.info('Testing content hash functionality...');
    
    // Create a test file
    const testFilePath = path.join(process.cwd(), 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for content hash calculation');
    
    // Read the file as buffer
    const fileBuffer = fs.readFileSync(testFilePath);
    
    // Calculate content hash
    const contentHash = cacheService.generateContentHash(fileBuffer);
    logger.info(`Content hash: ${contentHash}`);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    // Test document cache key generation
    const docId = '507f1f77bcf86cd799439011';
    const userId = '507f191e810c19729de860ea';
    
    const cacheKey = cacheService.generateCacheKey(docId, userId);
    logger.info(`Document cache key: ${cacheKey}`);
    
    // Get current cached documents
    const existingDocs = await UploadedDocument.find({
      processingStatus: DocumentProcessingStatus.PROCESSED
    }).limit(1);
    
    if (existingDocs.length > 0) {
      const doc = existingDocs[0];
      logger.info(`Found processed document: ${doc._id}`);
      
      // Try to retrieve from cache (should be missed first time)
      const cachedDoc = await cacheService.get(
        cacheService.generateCacheKey(doc._id.toString(), doc.userId.toString())
      );
      
      logger.info(`Document from cache (should be null): ${cachedDoc ? 'Found in cache' : 'Cache miss'}`);
      
      // Process this document and add to cache
      logger.info('Caching document processing results...');
      const cacheKey = cacheService.generateCacheKey(doc._id.toString(), doc.userId.toString());
      
      await cacheService.set(cacheKey, {
        documentId: doc._id.toString(),
        processedAt: new Date(),
        status: DocumentProcessingStatus.PROCESSED,
        contentHash: 'test-content-hash'
      });
      
      // Try to retrieve again (should hit cache)
      const cachedDocAfter = await cacheService.get(
        cacheService.generateCacheKey(doc._id.toString(), doc.userId.toString())
      );
      
      logger.info(`Document from cache after caching: ${JSON.stringify(cachedDocAfter)}`);
      
      // Clean up test cache entry
      await cacheService.delete(cacheKey);
    } else {
      logger.info('No processed documents found for testing');
    }
    
    logger.info('Cache test completed successfully');
  } catch (error) {
    logger.error('Cache test failed:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    
    // Force exit (IORedis may keep the process running)
    process.exit(0);
  }
}

// Run the test
testDocumentCache(); 