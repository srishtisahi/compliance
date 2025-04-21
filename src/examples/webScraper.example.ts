import { webScraperService } from '../services/webScraper.service';
import { logger } from '../utils/logger';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

/**
 * Example of using web scraper to extract content from government websites
 */
async function runExample() {
  try {
    // Set up output directory for saving results
    const outputDir = path.join(process.cwd(), 'examples/output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Example 1: Extract content based on search query
    logger.info('Example 1: Extracting content based on search query...');
    
    const searchQuery = 'construction safety regulations California 2023';
    const extractedContent = await webScraperService.extractContentFromSearch({
      query: searchQuery,
      maxSources: 5,
      extractLinks: true,
      governmentSourcesOnly: true,
      requestDelay: 1500, // Polite delay between requests
    });
    
    // Save the results
    const searchResultsPath = path.join(outputDir, 'search-results.json');
    fs.writeFileSync(
      searchResultsPath,
      JSON.stringify({
        query: extractedContent.query,
        metadata: extractedContent.metadata,
        searchResponse: {
          summary: extractedContent.searchResponse.summary,
          sourceCount: extractedContent.searchResponse.sources.length
        }
      }, null, 2)
    );
    
    // Save the extracted content (shortened version for readability)
    const extractedContentPath = path.join(outputDir, 'extracted-content.json');
    fs.writeFileSync(
      extractedContentPath,
      JSON.stringify(
        extractedContent.scrapedContent.map(content => ({
          url: content.url,
          title: content.title,
          contentType: content.contentType,
          isGovernment: content.isGovernment,
          contentSize: content.contentSize,
          textContentPreview: content.textContent?.substring(0, 200) + '...',
          error: content.error
        })),
        null,
        2
      )
    );
    
    logger.info(`Saved search results to ${searchResultsPath}`);
    logger.info(`Saved extracted content to ${extractedContentPath}`);
    
    // Example 2: Scrape specific government URLs
    logger.info('Example 2: Scraping specific government URLs...');
    
    const govUrls = [
      'https://www.osha.gov/construction',
      'https://www.dir.ca.gov/dosh/construction.html',
      'https://www.dgs.ca.gov/BSC/Codes'
    ];
    
    const scrapedContent = await webScraperService.extractContentFromSources(
      govUrls.map(url => ({
        url,
        title: '',
        snippet: '',
        source: '',
        isGovernment: true,
        isPrimaryAuthority: true,
        domainCategory: 'government',
        relevanceScore: 1
      })),
      {
        extractLinks: true,
        requestDelay: 1500
      }
    );
    
    // Save the scraped content
    const specificUrlsPath = path.join(outputDir, 'specific-urls-content.json');
    fs.writeFileSync(
      specificUrlsPath,
      JSON.stringify(
        scrapedContent.map(content => ({
          url: content.url,
          title: content.title,
          contentType: content.contentType,
          contentSize: content.contentSize,
          textContentPreview: content.textContent?.substring(0, 200) + '...',
          linkCount: content.links?.length || 0,
          error: content.error
        })),
        null,
        2
      )
    );
    
    logger.info(`Saved specific URLs content to ${specificUrlsPath}`);
    
    // Print summary
    logger.info('Web scraper example completed successfully!');
    logger.info(`Total government sources: ${extractedContent.metadata.governmentSources}`);
    logger.info(`Total content size: ${(extractedContent.metadata.totalContentSize / 1024 / 1024).toFixed(2)} MB`);
    logger.info(`Content types: ${JSON.stringify(extractedContent.metadata.contentTypes)}`);
    
  } catch (error) {
    logger.error('Error running web scraper example:', error);
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  logger.info('Running web scraper example...');
  runExample().then(() => {
    logger.info('Web scraper example completed.');
  }).catch(error => {
    logger.error('Web scraper example failed:', error);
  });
} 