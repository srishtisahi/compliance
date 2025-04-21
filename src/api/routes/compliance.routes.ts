import { Router } from 'express';
// import { complianceController } from '../controllers/compliance.controller';
// import { authMiddleware } from '../middlewares/auth.middleware';
// import { complianceValidator } from '../validators/compliance.validator';
import { webScraperService } from '../../services/webScraper.service';
import { webScraper, ScrapedContent } from '../../utils/webScraper';
import { logger } from '../../utils/logger';

const router = Router();

// TODO: Implement these routes with proper controllers
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Compliance routes are ready to be implemented',
  });
});

// GET compliance information based on search query
// router.get('/search', authMiddleware.protect, complianceValidator.validateSearchQuery, complianceController.searchCompliance);

// GET compliance information by jurisdiction
// router.get('/jurisdiction/:jurisdiction', authMiddleware.protect, complianceValidator.validateJurisdiction, complianceController.getComplianceByJurisdiction);

// GET legal updates in a specific area
// router.get('/updates/:area', authMiddleware.protect, complianceValidator.validateArea, complianceController.getLegalUpdates);

/**
 * @route   POST /api/compliance/search
 * @desc    Search for compliance information
 * @access  Private
 */
router.post('/search', async (req, res) => {
  try {
    // Implementation for search
    res.status(501).json({ message: 'Not implemented yet' });
  } catch (error) {
    logger.error('Error searching for compliance information:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/compliance/extract-content
 * @desc    Extract content from websites based on search query
 * @access  Private
 */
router.post('/extract-content', async (req, res) => {
  try {
    const { 
      query,
      maxSources,
      extractLinks,
      downloadPdf,
      timeoutMs,
      governmentSourcesOnly,
      requestDelay,
      userAgent,
      respectRobotsTxt
    } = req.body;
    
    // Validate required parameters
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Extract content using web scraper service
    const extractedContent = await webScraperService.extractContentFromSearch({
      query,
      maxSources,
      extractLinks,
      downloadPdf,
      timeoutMs,
      governmentSourcesOnly,
      requestDelay,
      userAgent,
      respectRobotsTxt
    });
    
    res.status(200).json(extractedContent);
  } catch (error) {
    logger.error('Error extracting content:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/compliance/scrape-urls
 * @desc    Scrape specific URLs for content
 * @access  Private
 */
router.post('/scrape-urls', async (req, res) => {
  try {
    const { 
      urls,
      extractLinks,
      downloadPdf,
      timeoutMs,
      requestDelay,
      userAgent,
      respectRobotsTxt
    } = req.body;
    
    // Validate required parameters
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }
    
    // Scrape URLs using web scraper utility
    const scrapedContent = await webScraper.scrapeMultipleUrls(urls, {
      extractLinks,
      downloadPdf,
      timeoutMs,
      userAgent,
      respectRobotsTxt
    });
    
    res.status(200).json({
      urls,
      scrapedContent,
      metadata: {
        totalUrls: urls.length,
        successfulScrapes: scrapedContent.filter((content: ScrapedContent) => !content.error).length,
        governmentSources: scrapedContent.filter((content: ScrapedContent) => content.isGovernment).length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error scraping URLs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 