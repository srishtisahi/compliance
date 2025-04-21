import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import { MistralOcrService } from '../../../src/services/mistralOcr.service';
import { MistralOCRResponse, OCRPage } from '../../../src/models/MistralOCR';

describe('MistralOcrService', () => {
  let service: MistralOcrService;
  let axiosPostStub: sinon.SinonStub;
  
  beforeEach(() => {
    // Create a fresh instance for each test
    service = new MistralOcrService();
    
    // Stub the axios post method
    axiosPostStub = sinon.stub(axios, 'post');
  });
  
  afterEach(() => {
    // Restore axios to its original state
    sinon.restore();
  });
  
  describe('getFormattedText', () => {
    it('should format OCR pages with page separators', () => {
      // Create sample OCR response
      const ocrResponse: MistralOCRResponse = {
        pages: [
          {
            index: 0,
            markdown: 'This is page 1 content.',
            images: [],
            dimensions: { width: 800, height: 1200, dpi: 72 }
          },
          {
            index: 1,
            markdown: 'This is page 2 content.',
            images: [],
            dimensions: { width: 800, height: 1200, dpi: 72 }
          }
        ]
      };
      
      // Call the method
      const result = (service as any).formatExtractedText(ocrResponse.pages);
      
      // Validate the result
      expect(result).to.include('--- Page 1 ---');
      expect(result).to.include('This is page 1 content.');
      expect(result).to.include('--- Page 2 ---');
      expect(result).to.include('This is page 2 content.');
      expect(result.split('\n\n').length).to.equal(2); // Two pages with separator
    });
    
    it('should clean markdown artifacts from the text', () => {
      // Create sample OCR response with markdown artifacts
      const ocrResponse: MistralOCRResponse = {
        pages: [
          {
            index: 0,
            markdown: 'This is content with ![image](http://example.com/image.jpg) embedded.',
            images: [],
            dimensions: { width: 800, height: 1200, dpi: 72 }
          }
        ]
      };
      
      // Call the method
      const result = (service as any).formatExtractedText(ocrResponse.pages);
      
      // Validate the result
      expect(result).to.include('This is content with  embedded.');
      expect(result).not.to.include('![image]');
    });
    
    it('should return empty string for empty pages array', () => {
      // Call the method with empty pages
      const result = (service as any).formatExtractedText([]);
      
      // Validate the result
      expect(result).to.equal('');
    });
  });
  
  describe('isRetryableError', () => {
    it('should retry on network errors', () => {
      const networkError = new Error('Network Error');
      expect((service as any).isRetryableError(networkError)).to.be.true;
    });
    
    it('should retry on 429 rate limit errors', () => {
      const rateLimitError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { error: { message: 'Too Many Requests' } }
        }
      };
      
      expect((service as any).isRetryableError(rateLimitError)).to.be.true;
    });
    
    it('should retry on 500 server errors', () => {
      const serverError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: { message: 'Internal Server Error' } }
        }
      };
      
      expect((service as any).isRetryableError(serverError)).to.be.true;
    });
    
    it('should not retry on 400 client errors', () => {
      const clientError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: { message: 'Bad Request' } }
        }
      };
      
      expect((service as any).isRetryableError(clientError)).to.be.false;
    });
    
    it('should not retry on 401 authentication errors', () => {
      const authError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: { message: 'Unauthorized' } }
        }
      };
      
      expect((service as any).isRetryableError(authError)).to.be.false;
    });
  });
  
  describe('executeWithRetry', () => {
    it('should succeed on first attempt if no errors', async () => {
      // Setup a mock function that succeeds
      const mockFunction = sinon.stub().resolves('success');
      
      // Call the method
      const result = await (service as any).executeWithRetry(mockFunction);
      
      // Validate the result
      expect(result).to.equal('success');
      expect(mockFunction.callCount).to.equal(1);
    });
    
    it('should retry on retryable errors up to max retries', async () => {
      // Setup test parameters - modify the retry config for faster tests
      (service as any).retryConfig = {
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
        backoffFactor: 2
      };
      
      // Setup a mock function that fails with retryable error then succeeds
      const mockFunction = sinon.stub();
      
      // First two calls fail with network error (retryable)
      mockFunction.onCall(0).rejects(new Error('Network Error'));
      mockFunction.onCall(1).rejects(new Error('Network Error'));
      
      // Third call succeeds
      mockFunction.onCall(2).resolves('success after retry');
      
      // Stub the isRetryableError method to always return true
      sinon.stub(service as any, 'isRetryableError').returns(true);
      
      // Call the method
      const result = await (service as any).executeWithRetry(mockFunction);
      
      // Validate the result
      expect(result).to.equal('success after retry');
      expect(mockFunction.callCount).to.equal(3); // Original + 2 retries
    });
    
    it('should throw error after max retries', async () => {
      // Setup test parameters - modify the retry config for faster tests
      (service as any).retryConfig = {
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
        backoffFactor: 2
      };
      
      // Setup a mock function that always fails with retryable error
      const mockFunction = sinon.stub().rejects(new Error('Persistent Network Error'));
      
      // Stub the isRetryableError method to always return true
      sinon.stub(service as any, 'isRetryableError').returns(true);
      
      // Call the method and expect it to throw
      try {
        await (service as any).executeWithRetry(mockFunction);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('Persistent Network Error');
      }
      
      // Validate that it was called the expected number of times
      expect(mockFunction.callCount).to.equal(3); // Original + 2 retries
    });
    
    it('should not retry on non-retryable errors', async () => {
      // Setup a mock function that fails with non-retryable error
      const mockFunction = sinon.stub().rejects(new Error('Authentication Error'));
      
      // Stub the isRetryableError method to always return false
      sinon.stub(service as any, 'isRetryableError').returns(false);
      
      // Call the method and expect it to throw immediately
      try {
        await (service as any).executeWithRetry(mockFunction);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('Authentication Error');
      }
      
      // Validate that it was called only once (no retries)
      expect(mockFunction.callCount).to.equal(1);
    });
  });
  
  describe('processDocument', () => {
    it('should process a document successfully', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          pages: [
            {
              index: 0,
              markdown: 'Sample text content',
              images: [],
              dimensions: { width: 800, height: 1200, dpi: 72 }
            }
          ]
        }
      };
      
      // Setup axios to return the mock response
      axiosPostStub.resolves(mockResponse);
      
      // Call the method
      const result = await service.processDocument({
        type: 'document_url',
        document_url: 'https://example.com/document.pdf'
      });
      
      // Validate the result
      expect(result).to.deep.equal(mockResponse.data);
      expect(axiosPostStub.calledOnce).to.be.true;
    });
  });
  
  describe('handleApiError', () => {
    it('should return specific error message for 401 status', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: { message: 'Unauthorized' } }
        },
        config: { url: '/ocr', method: 'post' }
      };
      
      const result = (service as any).handleApiError(error);
      expect(result.message).to.include('authentication failed');
    });
    
    it('should return specific error message for 429 status', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { error: { message: 'Too Many Requests' } }
        },
        config: { url: '/ocr', method: 'post' }
      };
      
      const result = (service as any).handleApiError(error);
      expect(result.message).to.include('rate limit exceeded');
    });
  });
}); 