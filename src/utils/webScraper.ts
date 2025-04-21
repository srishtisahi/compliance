import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from './logger';
import { sanitizeData } from './sanitizer';
import { PerplexitySource } from '../types/perplexity.types';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { PerplexityApiError } from '../api/middlewares/errorHandler';

/**
 * Sanitize HTML content by removing potentially dangerous elements and attributes
 * @param html HTML content to sanitize
 * @returns Sanitized HTML content
 */
export const sanitizeHtml = (html: string): string => {
  try {
    const $ = cheerio.load(html);
    
    // Remove potentially dangerous elements
    $('script, iframe, object, embed, link, meta, noscript').remove();
    
    // Remove dangerous attributes
    $('*').each((_, element) => {
      const el = $(element);
      // Type assertion to handle the correct type
      const attrs = el.prop('attribs') as Record<string, string> || {};
      
      // Remove event handler attributes that start with "on"
      Object.keys(attrs).forEach(attr => {
        if (attr.toLowerCase().startsWith('on') || 
            attr.toLowerCase() === 'href' && attrs[attr].toLowerCase().startsWith('javascript:') ||
            attr.toLowerCase() === 'src' && attrs[attr].toLowerCase().startsWith('javascript:') ||
            attr.toLowerCase() === 'formaction') {
          el.removeAttr(attr);
        }
      });
    });
    
    return $.html();
  } catch (error) {
    logger.error('Error sanitizing HTML:', error);
    return '';
  }
};

/**
 * Interface for web scraping options
 */
export interface ScrapingOptions {
  /** URL to scrape */
  url: string;
  /** Whether to extract links from the page */
  extractLinks?: boolean;
  /** Whether to download PDF files */
  downloadPdf?: boolean;
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** User agent string */
  userAgent?: string;
  /** Whether to respect robots.txt (default: true) */
  respectRobotsTxt?: boolean;
}

/**
 * Interface for scraped content
 */
export interface ScrapedContent {
  /** URL of the scraped page */
  url: string;
  /** Title of the page */
  title: string;
  /** Main content of the page */
  content: string;
  /** Text content of the page without HTML */
  textContent: string;
  /** Links found on the page */
  links?: string[];
  /** Last modified date if available */
  lastModified?: string;
  /** Content type (HTML, PDF, etc.) */
  contentType: string;
  /** Error message if scraping failed */
  error?: string;
  /** Whether this is a government source */
  isGovernment: boolean;
  /** Size of the content in bytes */
  contentSize: number;
}

/**
 * Web scraping utility for government websites
 */
export class WebScraper {
  private defaultUserAgent: string = 'ComplianceBot/1.0 (+https://compliance.example.com/bot)';
  private downloadDirectory: string;
  
  constructor() {
    this.downloadDirectory = path.join(process.cwd(), 'downloads');
    // Create downloads directory if it doesn't exist
    if (!fs.existsSync(this.downloadDirectory)) {
      fs.mkdirSync(this.downloadDirectory, { recursive: true });
    }
  }
  
  /**
   * Scrape content from a URL
   */
  async scrapeUrl(options: ScrapingOptions): Promise<ScrapedContent> {
    try {
      const { 
        url: targetUrl, 
        extractLinks = false, 
        downloadPdf = true,
        timeoutMs = 30000, 
        userAgent = this.defaultUserAgent,
        respectRobotsTxt = true
      } = options;
      
      // Check if URL is valid
      if (!this.isValidUrl(targetUrl)) {
        throw new PerplexityApiError('Invalid URL', 400, 'INVALID_URL');
      }
      
      // Check if it's allowed by robots.txt
      if (respectRobotsTxt && !(await this.isAllowedByRobotsTxt(targetUrl, userAgent))) {
        logger.warn(`Scraping not allowed by robots.txt: ${targetUrl}`);
        return {
          url: targetUrl,
          title: '',
          content: '',
          textContent: '',
          contentType: 'text/html',
          isGovernment: this.isGovernmentDomain(targetUrl),
          contentSize: 0,
          error: 'Scraping not allowed by robots.txt'
        };
      }
      
      // Make HTTP request
      const response = await axios.get(targetUrl, {
        timeout: timeoutMs,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        maxRedirects: 5
      });
      
      const contentType = response.headers['content-type'] || 'text/html';
      const lastModified = response.headers['last-modified'];
      
      // Handle different content types
      if (contentType.includes('application/pdf')) {
        return this.handlePdfContent(targetUrl, response.data, downloadPdf);
      } else if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
        return this.parseHtmlContent(targetUrl, response.data.toString(), extractLinks);
      } else if (contentType.includes('application/json')) {
        return this.handleJsonContent(targetUrl, response.data.toString());
      } else if (contentType.includes('text/plain')) {
        return this.handleTextContent(targetUrl, response.data.toString());
      } else {
        logger.warn(`Unsupported content type: ${contentType} for URL: ${targetUrl}`);
        return {
          url: targetUrl,
          title: path.basename(targetUrl),
          content: '',
          textContent: '',
          contentType,
          lastModified,
          isGovernment: this.isGovernmentDomain(targetUrl),
          contentSize: response.data.length,
          error: `Unsupported content type: ${contentType}`
        };
      }
    } catch (error) {
      logger.error(`Error scraping URL ${options.url}:`, error);
      
      return {
        url: options.url,
        title: '',
        content: '',
        textContent: '',
        contentType: 'unknown',
        isGovernment: this.isGovernmentDomain(options.url),
        contentSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Scrape multiple URLs in parallel
   */
  async scrapeMultipleUrls(urls: string[], options: Omit<ScrapingOptions, 'url'> = {}): Promise<ScrapedContent[]> {
    try {
      // Create scraping promises for all URLs
      const scrapingPromises = urls.map(url => 
        this.scrapeUrl({
          url,
          ...options
        })
      );
      
      // Execute all scraping operations in parallel
      return await Promise.all(scrapingPromises);
    } catch (error) {
      logger.error('Error scraping multiple URLs:', error);
      return [];
    }
  }
  
  /**
   * Scrape Perplexity sources
   */
  async scrapePerplexitySources(sources: PerplexitySource[], options: Omit<ScrapingOptions, 'url'> = {}): Promise<ScrapedContent[]> {
    try {
      // Extract URLs from Perplexity sources
      const urls = sources.map(source => source.url);
      
      // Scrape all URLs
      return await this.scrapeMultipleUrls(urls, options);
    } catch (error) {
      logger.error('Error scraping Perplexity sources:', error);
      return [];
    }
  }
  
  /**
   * Parse HTML content
   */
  private parseHtmlContent(url: string, html: string, extractLinks: boolean): ScrapedContent {
    try {
      const $ = cheerio.load(html);
      
      // Remove script and style elements
      $('script, style, iframe, nav, footer, header, aside, .advertisement, .sidebar, .menu, .nav, .navigation').remove();
      
      // Get page title
      const title = $('title').text().trim() || '';
      
      // Get main content
      // Try to find main content element
      let mainContent = '';
      const contentSelectors = [
        'main', 'article', '#content', '.content', '#main-content', '.main-content',
        '[role="main"]', '.post', '.entry', '.article', '.post-content', '.entry-content'
      ];
      
      for (const selector of contentSelectors) {
        if ($(selector).length) {
          mainContent = $(selector).html() || '';
          break;
        }
      }
      
      // If no main content found, use body
      if (!mainContent) {
        mainContent = $('body').html() || '';
      }
      
      // Sanitize HTML
      const sanitizedContent = sanitizeHtml(mainContent);
      
      // Extract text content
      const textContent = $(sanitizedContent).text().replace(/\s+/g, ' ').trim();
      
      // Extract links if requested
      let links: string[] = [];
      if (extractLinks) {
        $('a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            try {
              // Resolve relative URLs
              const absoluteUrl = new URL(href, url).href;
              links.push(absoluteUrl);
            } catch {
              // Skip invalid URLs
            }
          }
        });
        // Remove duplicates
        links = [...new Set(links)];
      }
      
      return {
        url,
        title,
        content: sanitizedContent,
        textContent,
        links: extractLinks ? links : undefined,
        contentType: 'text/html',
        isGovernment: this.isGovernmentDomain(url),
        contentSize: sanitizedContent.length
      };
    } catch (error) {
      logger.error(`Error parsing HTML content for URL ${url}:`, error);
      return {
        url,
        title: '',
        content: '',
        textContent: '',
        contentType: 'text/html',
        isGovernment: this.isGovernmentDomain(url),
        contentSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Handle PDF content
   */
  private handlePdfContent(url: string, data: Buffer, downloadPdf: boolean): ScrapedContent {
    try {
      // Handle PDF content - for now, we just save it to disk if requested
      // Text extraction would require additional libraries like pdf.js or pdf-parse
      let filePath: string | undefined;
      if (downloadPdf) {
        const urlObj = new URL(url);
        const filename = path.basename(urlObj.pathname) || 'document.pdf';
        filePath = path.join(this.downloadDirectory, filename);
        fs.writeFileSync(filePath, data);
      }
      
      return {
        url,
        title: path.basename(url),
        content: `PDF document ${filePath ? `saved to ${filePath}` : 'detected'}`,
        textContent: `PDF document ${filePath ? `saved to ${filePath}` : 'detected'}`,
        contentType: 'application/pdf',
        isGovernment: this.isGovernmentDomain(url),
        contentSize: data.length
      };
    } catch (error) {
      logger.error(`Error handling PDF content for URL ${url}:`, error);
      return {
        url,
        title: path.basename(url),
        content: '',
        textContent: '',
        contentType: 'application/pdf',
        isGovernment: this.isGovernmentDomain(url),
        contentSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Handle JSON content
   */
  private handleJsonContent(url: string, jsonData: string): ScrapedContent {
    try {
      const parsedJson = JSON.parse(jsonData);
      return {
        url,
        title: path.basename(url),
        content: JSON.stringify(parsedJson, null, 2),
        textContent: JSON.stringify(parsedJson),
        contentType: 'application/json',
        isGovernment: this.isGovernmentDomain(url),
        contentSize: jsonData.length
      };
    } catch (error) {
      logger.error(`Error handling JSON content for URL ${url}:`, error);
      return {
        url,
        title: path.basename(url),
        content: '',
        textContent: '',
        contentType: 'application/json',
        isGovernment: this.isGovernmentDomain(url),
        contentSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Handle plain text content
   */
  private handleTextContent(url: string, textData: string): ScrapedContent {
    return {
      url,
      title: path.basename(url),
      content: textData,
      textContent: textData,
      contentType: 'text/plain',
      isGovernment: this.isGovernmentDomain(url),
      contentSize: textData.length
    };
  }
  
  /**
   * Check if URL is from a government domain
   */
  private isGovernmentDomain(urlString: string): boolean {
    try {
      const parsedUrl = new URL(urlString);
      return parsedUrl.hostname.endsWith('.gov') || 
             parsedUrl.hostname.endsWith('.mil') ||
             parsedUrl.hostname.includes('.gov.') ||
             /\.gc\.ca$/.test(parsedUrl.hostname); // Canadian government domains
    } catch {
      return false;
    }
  }
  
  /**
   * Check if URL is valid
   */
  private isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if URL is allowed by robots.txt
   */
  private async isAllowedByRobotsTxt(urlString: string, userAgent: string): Promise<boolean> {
    try {
      const parsedUrl = new URL(urlString);
      const robotsTxtUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`;
      
      try {
        const response = await axios.get(robotsTxtUrl, {
          timeout: 5000,
          headers: { 'User-Agent': userAgent }
        });
        
        const robotsTxt = response.data;
        
        // Basic robots.txt parsing
        const userAgentSections = robotsTxt.split(/User-agent:/i);
        
        let isAllowed = true;
        const path = parsedUrl.pathname + parsedUrl.search;
        
        // Check for specific user agent
        for (const section of userAgentSections) {
          if (!section.trim()) continue;
          
          const lines = section.split('\n');
          const agentLine = lines[0].trim();
          
          // Check if section applies to our user agent or all agents
          if (agentLine === '*' || userAgent.includes(agentLine)) {
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim().toLowerCase();
              if (line.startsWith('disallow:')) {
                const disallowPath = line.substring('disallow:'.length).trim();
                if (disallowPath && path.startsWith(disallowPath)) {
                  isAllowed = false;
                }
              } else if (line.startsWith('allow:')) {
                const allowPath = line.substring('allow:'.length).trim();
                if (allowPath && path.startsWith(allowPath)) {
                  isAllowed = true;
                }
              }
            }
          }
        }
        
        return isAllowed;
      } catch (error) {
        // If robots.txt is not found or cannot be fetched, allow scraping
        logger.debug(`Could not fetch robots.txt for ${parsedUrl.hostname}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return true;
      }
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const webScraper = new WebScraper(); 