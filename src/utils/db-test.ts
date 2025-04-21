import dotenv from 'dotenv';
import { connectDB, disconnectDB, getConnectionStatus } from '../config/database';
import { logger } from './logger';
import ComplianceDocument from '../models/ComplianceDocument';

// Load environment variables
dotenv.config();

/**
 * Test MongoDB connection and basic operations
 */
const testDatabaseConnection = async (environment: string): Promise<void> => {
  // Set the environment
  process.env.NODE_ENV = environment;
  
  try {
    logger.info(`Testing MongoDB connection in ${environment} environment...`);
    
    // Connect to the database
    await connectDB();
    
    // Get connection status
    const status = getConnectionStatus();
    logger.info(`Connection status: ${JSON.stringify(status)}`);
    
    if (status.connected) {
      // Create a test document
      const testDoc = new ComplianceDocument({
        title: `Test Document (${environment})`,
        content: 'This is a test document for MongoDB connection testing.',
        source: 'Internal',
        jurisdiction: 'US',
        category: 'Test',
        tags: ['test', 'mongodb', environment],
        publishedDate: new Date(),
      });
      
      // Save the document
      const savedDoc = await testDoc.save();
      logger.info(`Test document created with ID: ${savedDoc._id}`);
      
      // Find the document
      const foundDoc = await ComplianceDocument.findById(savedDoc._id);
      logger.info(`Found document: ${foundDoc?.title}`);
      
      // Delete the test document
      await ComplianceDocument.findByIdAndDelete(savedDoc._id);
      logger.info('Test document deleted');
    }
    
    // Disconnect from the database
    await disconnectDB();
    logger.info(`MongoDB test in ${environment} environment completed successfully`);
  } catch (error) {
    logger.error(`MongoDB test in ${environment} environment failed:`, error);
  }
};

// Test all environments
const runTests = async (): Promise<void> => {
  const environments = ['development', 'test', 'production'];
  
  for (const env of environments) {
    await testDatabaseConnection(env);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Reset to development environment
  process.env.NODE_ENV = 'development';
  process.exit(0);
};

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logger.error('Error running tests:', error);
    process.exit(1);
  });
} 