import { webScraper, ScrapedContent, ScrapingOptions } from '../utils/webScraper';
import { logger } from '../utils/logger';
import { PerplexityService } from './perplexity.service';
import { PerplexitySource, PerplexityResponse } from '../types/perplexity.types';
import { setTimeout } from 'timers/promises';

/**
 * Interface for content extraction options
 */
export interface ContentExtractionOptions {
  /** Perplexity search query */
  query: string;
  /** Maximum number of sources to scrape */
  maxSources?: number;
  /** Whether to extract links from pages */
  extractLinks?: boolean;
  /** Whether to download PDF files */
  downloadPdf?: boolean;
  /** Timeout in milliseconds for each scrape */
  timeoutMs?: number;
  /** Whether to only scrape government sources */
  governmentSourcesOnly?: boolean;
  /** Delay between scraping requests in milliseconds */
  requestDelay?: number;
  /** User agent string */
  userAgent?: string;
  /** Whether to respect robots.txt */
  respectRobotsTxt?: boolean;
}

/**
 * Interface for extracted content
 */
export interface ExtractedContent {
  /** Original search query */
  query: string;
  /** Perplexity search response */
  searchResponse: PerplexityResponse;
  /** Scraped content from sources */
  scrapedContent: ScrapedContent[];
  /** Metadata about the extraction */
  metadata: {
    /** Total number of sources */
    totalSources: number;
    /** Number of successfully scraped sources */
    successfulScrapes: number;
    /** Number of government sources */
    governmentSources: number;
    /** Number of non-government sources */
    nonGovernmentSources: number;
    /** Content types extracted */
    contentTypes: Record<string, number>;
    /** Total content size in bytes */
    totalContentSize: number;
    /** Extraction timestamp */
    timestamp: string;
  };
  /** Error message if any */
  error?: string;
}

/**
 * Service for extracting content from websites identified by Perplexity
 */
export class WebScraperService {
  private perplexityService: PerplexityService;
  
  constructor() {
    this.perplexityService = new PerplexityService();
  }
  
  /**
   * Extract content from websites based on Perplexity search results
   */
  async extractContentFromSearch(options: ContentExtractionOptions): Promise<ExtractedContent> {
    try {
      const { 
        query, 
        maxSources = 10, 
        extractLinks = false, 
        downloadPdf = true, 
        timeoutMs = 30000,
        governmentSourcesOnly = true,
        requestDelay = 1000,
        userAgent,
        respectRobotsTxt = true
      } = options;
      
      // Search for sources using Perplexity
      const searchResponse = await this.perplexityService.searchCompliance({
        query,
        focus: governmentSourcesOnly ? 'government' : 'all',
        maxResults: maxSources * 2 // Request more sources than needed in case some fail
      });
      
      // Filter sources if government-only
      let sourcesToScrape = searchResponse.sources;
      if (governmentSourcesOnly) {
        sourcesToScrape = sourcesToScrape.filter(source => source.isGovernment);
      }
      
      // Limit to maxSources
      sourcesToScrape = sourcesToScrape.slice(0, maxSources);
      
      // Scrape each source with delay between requests
      const scrapedContent: ScrapedContent[] = [];
      
      for (const source of sourcesToScrape) {
        try {
          const scrapingOptions: ScrapingOptions = {
            url: source.url,
            extractLinks,
            downloadPdf,
            timeoutMs,
            userAgent,
            respectRobotsTxt
          };
          
          const content = await webScraper.scrapeUrl(scrapingOptions);
          scrapedContent.push(content);
          
          // Add delay between requests to avoid overloading servers
          if (requestDelay > 0 && sourcesToScrape.indexOf(source) < sourcesToScrape.length - 1) {
            await setTimeout(requestDelay);
          }
        } catch (error) {
          logger.error(`Error scraping source ${source.url}:`, error);
        }
      }
      
      // Generate metadata about the extraction
      const metadata = this.generateExtractionMetadata(scrapedContent);
      
      return {
        query,
        searchResponse,
        scrapedContent,
        metadata
      };
    } catch (error) {
      logger.error('Error extracting content from search:', error);
      
      return {
        query: options.query,
        searchResponse: {
          query: options.query,
          sources: [],
          summary: ''
        },
        scrapedContent: [],
        metadata: {
          totalSources: 0,
          successfulScrapes: 0,
          governmentSources: 0,
          nonGovernmentSources: 0,
          contentTypes: {},
          totalContentSize: 0,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Extract content from specific Perplexity sources
   */
  async extractContentFromSources(sources: PerplexitySource[], options: Omit<ContentExtractionOptions, 'query'>): Promise<ScrapedContent[]> {
    try {
      const { 
        extractLinks = false, 
        downloadPdf = true, 
        timeoutMs = 30000,
        requestDelay = 1000,
        userAgent,
        respectRobotsTxt = true
      } = options;
      
      // Filter sources if government-only
      let sourcesToScrape = sources;
      if (options.governmentSourcesOnly) {
        sourcesToScrape = sourcesToScrape.filter(source => source.isGovernment);
      }
      
      // Limit to maxSources if specified
      if (options.maxSources) {
        sourcesToScrape = sourcesToScrape.slice(0, options.maxSources);
      }
      
      // Scrape each source with delay between requests
      const scrapedContent: ScrapedContent[] = [];
      
      for (const source of sourcesToScrape) {
        try {
          const scrapingOptions: ScrapingOptions = {
            url: source.url,
            extractLinks,
            downloadPdf,
            timeoutMs,
            userAgent,
            respectRobotsTxt
          };
          
          const content = await webScraper.scrapeUrl(scrapingOptions);
          scrapedContent.push(content);
          
          // Add delay between requests to avoid overloading servers
          if (requestDelay > 0 && sourcesToScrape.indexOf(source) < sourcesToScrape.length - 1) {
            await setTimeout(requestDelay);
          }
        } catch (error) {
          logger.error(`Error scraping source ${source.url}:`, error);
        }
      }
      
      return scrapedContent;
    } catch (error) {
      logger.error('Error extracting content from sources:', error);
      return [];
    }
  }
  
  /**
   * Generate metadata about the extraction
   */
  private generateExtractionMetadata(scrapedContent: ScrapedContent[]): ExtractedContent['metadata'] {
    const contentTypes: Record<string, number> = {};
    let totalContentSize = 0;
    let governmentSources = 0;
    let nonGovernmentSources = 0;
    
    // Process each scraped content
    scrapedContent.forEach(content => {
      // Count content types
      contentTypes[content.contentType] = (contentTypes[content.contentType] || 0) + 1;
      
      // Calculate total content size
      totalContentSize += content.contentSize;
      
      // Count government vs non-government sources
      if (content.isGovernment) {
        governmentSources++;
      } else {
        nonGovernmentSources++;
      }
    });
    
    return {
      totalSources: scrapedContent.length,
      successfulScrapes: scrapedContent.filter(content => !content.error).length,
      governmentSources,
      nonGovernmentSources,
      contentTypes,
      totalContentSize,
      timestamp: new Date().toISOString()
    };
  }
}

// Export a singleton instance
export const webScraperService = new WebScraperService(); 