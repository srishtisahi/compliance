import dotenv from 'dotenv';
import axios from 'axios';
import { MistralOcrService } from './services/mistralOcr.service';
import { GeminiService } from './services/gemini.service';
import { GeminiWebSearchService } from './services/geminiWebSearch.service';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Test function for Mistral OCR
async function testMistralOcr() {
  try {
    const mistralOcrService = new MistralOcrService();
    
    // Test document URL - using a sample PDF URL
    const documentUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    
    logger.info("Testing Mistral OCR with document URL...");
    const result = await mistralOcrService.processDocumentFromUrl(documentUrl);
    
    if (result && result.pages) {
      logger.info(`✅ Mistral OCR test successful! Extracted ${result.pages.length} pages.`);
      return true;
    } else {
      logger.error("❌ Mistral OCR test failed: Unexpected response format");
      return false;
    }
  } catch (error) {
    logger.error("❌ Mistral OCR test failed:", error);
    return false;
  }
}

// Test function for Gemini API
async function testGemini() {
  try {
    const geminiService = new GeminiService();
    
    logger.info("Testing Gemini API...");
    const result = await geminiService.generateContent({
      prompt: "Summarize the main compliance requirements for construction projects in California.",
      maxOutputTokens: 200,
      temperature: 0.2
    });
    
    if (result && result.text) {
      logger.info(`✅ Gemini API test successful! Response length: ${result.text.length} characters`);
      return true;
    } else {
      logger.error("❌ Gemini API test failed: Unexpected response format");
      return false;
    }
  } catch (error) {
    logger.error("❌ Gemini API test failed:", error);
    return false;
  }
}

// Test function for Gemini Web Search (replacement for Perplexity)
async function testGeminiWebSearch() {
  try {
    const geminiWebSearchService = new GeminiWebSearchService();
    
    logger.info("Testing Gemini Web Search API...");
    const result = await geminiWebSearchService.searchCompliance({
      query: "What are the latest OSHA regulations for scaffolding?",
      maxResults: 5
    });
    
    if (result && result.sources && result.sources.length > 0) {
      logger.info(`✅ Gemini Web Search test successful! Found ${result.sources.length} sources.`);
      return true;
    } else {
      logger.error("❌ Gemini Web Search test failed: Unexpected response format");
      return false;
    }
  } catch (error) {
    logger.error("❌ Gemini Web Search test failed:", error);
    return false;
  }
}

// Run all tests
async function runTests() {
  logger.info("Starting API integration tests...");
  
  // Test all integrations
  const mistralResult = await testMistralOcr();
  const geminiResult = await testGemini();
  const webSearchResult = await testGeminiWebSearch();
  
  // Output summary
  logger.info("\n===== TEST RESULTS =====");
  logger.info(`Mistral OCR: ${mistralResult ? "✅ PASS" : "❌ FAIL"}`);
  logger.info(`Gemini API: ${geminiResult ? "✅ PASS" : "❌ FAIL"}`);
  logger.info(`Gemini Web Search: ${webSearchResult ? "✅ PASS" : "❌ FAIL"}`);
  
  if (mistralResult && geminiResult && webSearchResult) {
    logger.info("\n✅ ALL TESTS PASSED! API integrations are working correctly.");
  } else {
    logger.error("\n❌ SOME TESTS FAILED. Please check the logs above for details.");
  }
}

// Execute tests
runTests().catch(error => {
  logger.error("Error running tests:", error);
}); 