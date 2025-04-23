import axios from 'axios';
import { geminiService } from '../../../src/services/gemini.service';
import { GeminiApiError } from '../../../src/api/middlewares/errorHandler';
import { GeminiResponse, GeminiComplianceAnalysisResponse } from '../../../src/types/gemini.types';

// Jest types
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';

describe('Gemini Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      // Mock axios response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Generated text response'
                  }
                ]
              },
              safetyRatings: [
                {
                  category: 'HARM_CATEGORY_HATE_SPEECH',
                  blocked: false,
                  score: 0.1
                }
              ]
            }
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30
          }
        }
      });

      // Call the service
      const result: GeminiResponse = await geminiService.generateContent({
        prompt: 'Test prompt',
        temperature: 0.5
      });

      // Verify axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent'),
        expect.objectContaining({
          contents: [
            {
              parts: [
                {
                  text: 'Test prompt'
                }
              ]
            }
          ],
          generationConfig: expect.objectContaining({
            temperature: 0.5
          })
        })
      );

      // Verify response
      expect(result).toEqual({
        text: 'Generated text response',
        safetyAttributes: {
          categories: ['HARM_CATEGORY_HATE_SPEECH'],
          blocked: false,
          scores: [0.1]
        },
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30
        }
      });
    });

    it('should handle API errors correctly', async () => {
      // Mock axios error
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            error: {
              message: 'Invalid request',
              code: 'INVALID_ARGUMENT'
            }
          }
        }
      });

      // Call the service and verify error
      await expect(geminiService.generateContent({
        prompt: 'Test prompt'
      })).rejects.toThrow('Invalid request');
    });
  });

  describe('analyzeComplianceInfo', () => {
    it('should analyze compliance information successfully', async () => {
      // Mock generateContent to return a response
      jest.spyOn(geminiService, 'generateContent').mockResolvedValueOnce({
        text: 'Compliance analysis text',
        usage: {
          promptTokens: 50,
          completionTokens: 100,
          totalTokens: 150
        }
      });

      // Call the service
      const result: GeminiComplianceAnalysisResponse = await geminiService.analyzeComplianceInfo(
        'Context information', 
        'Compliance query'
      );

      // Verify generateContent was called correctly
      expect(geminiService.generateContent).toHaveBeenCalledWith({
        prompt: expect.stringContaining('Context information'),
      });

      // Verify response structure
      expect(result).toHaveProperty('text', 'Compliance analysis text');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('obligations');
      expect(result).toHaveProperty('recentChanges');
      expect(result).toHaveProperty('citations');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('usage');
    });

    it('should handle errors in analysis', async () => {
      // Mock generateContent to throw an error
      jest.spyOn(geminiService, 'generateContent').mockRejectedValueOnce(
        new GeminiApiError('API quota exceeded', 429, 'QUOTA_EXCEEDED')
      );

      // Call the service and verify error
      await expect(geminiService.analyzeComplianceInfo(
        'Context', 
        'Query'
      )).rejects.toThrow('API quota exceeded');
    });
  });
}); 