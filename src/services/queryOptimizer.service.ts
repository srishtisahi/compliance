import { logger } from '../utils/logger';

/**
 * Interface for query optimization options
 */
export interface QueryOptimizerOptions {
  /** Original user prompt */
  userPrompt: string;
  /** Industry context (e.g., construction, healthcare) */
  industry?: string;
  /** Geographic location for regulatory context */
  location?: string;
  /** Document context extracted from uploaded documents */
  documentContext?: string;
  /** Specific compliance domains to focus on */
  complianceDomains?: string[];
  /** Whether to prioritize recent information */
  prioritizeRecent?: boolean;
}

/**
 * Interface for the optimized query result
 */
export interface OptimizedQuery {
  /** Primary search query optimized for Perplexity */
  primaryQuery: string;
  /** Alternative queries for follow-up searches */
  alternativeQueries: string[];
  /** Search focus recommendation */
  recommendedFocus: 'government' | 'news' | 'all';
  /** Entities extracted from user prompt */
  extractedEntities: {
    regulations?: string[];
    locations?: string[];
    organizations?: string[];
    dates?: string[];
    other?: string[];
  };
}

/**
 * Service for generating optimized search queries for Perplexity API
 * based on user prompts and context
 */
export class QueryOptimizerService {
  /**
   * Generate an optimized search query for Perplexity based on user prompt
   */
  async optimizeQuery(options: QueryOptimizerOptions): Promise<OptimizedQuery> {
    try {
      const { 
        userPrompt, 
        industry = 'construction', 
        location, 
        documentContext,
        complianceDomains,
        prioritizeRecent = true 
      } = options;

      // Extract key entities from the user prompt
      const extractedEntities = this.extractEntities(userPrompt);
      
      // Generate primary query with extracted entities and context
      const primaryQuery = this.generatePrimaryQuery(
        userPrompt,
        industry,
        location,
        extractedEntities,
        complianceDomains,
        prioritizeRecent
      );
      
      // Generate alternative queries for follow-up searches
      const alternativeQueries = this.generateAlternativeQueries(
        userPrompt,
        extractedEntities,
        complianceDomains,
        documentContext
      );
      
      // Determine recommended focus based on query content
      const recommendedFocus = this.determineSearchFocus(
        userPrompt, 
        extractedEntities,
        complianceDomains
      );
      
      return {
        primaryQuery,
        alternativeQueries,
        recommendedFocus,
        extractedEntities
      };
    } catch (error) {
      logger.error('Error optimizing search query:', error);
      // Fallback to basic query if optimization fails
      return this.generateFallbackQuery(options.userPrompt);
    }
  }
  
  /**
   * Extract key entities from user prompt
   */
  private extractEntities(prompt: string): OptimizedQuery['extractedEntities'] {
    const entities: OptimizedQuery['extractedEntities'] = {
      regulations: [],
      locations: [],
      organizations: [],
      dates: [],
      other: []
    };
    
    // Extract regulation codes (e.g., "29 CFR 1926", "OSHA 1910.134")
    const regulationRegex = /\b(\d+\s+CFR\s+\d+(\.\d+)?|\w+\s+\d+(\.\d+)?)\b/gi;
    const regulationMatches = prompt.match(regulationRegex) || [];
    entities.regulations = [...new Set(regulationMatches.map(m => m.trim()))];
    
    // Extract locations (simple approach - could be enhanced with NLP)
    const locationKeywords = [
      'California', 'CA', 'New York', 'NY', 'Texas', 'TX', 'Florida', 'FL',
      'USA', 'United States', 'Canada', 'UK', 'Australia'
    ];
    entities.locations = locationKeywords.filter(loc => 
      prompt.toLowerCase().includes(loc.toLowerCase())
    );
    
    // Extract organization names (simple approach)
    const orgKeywords = [
      'OSHA', 'EPA', 'DOL', 'Department of Labor', 'NIOSH', 'ANSI',
      'ICC', 'International Code Council', 'ASTM'
    ];
    entities.organizations = orgKeywords.filter(org => 
      prompt.toLowerCase().includes(org.toLowerCase())
    );
    
    // Extract date references
    const dateRegex = /\b(20\d{2}|19\d{2})\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(,\s+\d{4})?\b/gi;
    const dateMatches = prompt.match(dateRegex) || [];
    entities.dates = [...new Set(dateMatches.map(m => m.trim()))];
    
    return entities;
  }
  
  /**
   * Generate primary search query with extracted entities and context
   */
  private generatePrimaryQuery(
    userPrompt: string,
    industry: string,
    location?: string,
    entities?: OptimizedQuery['extractedEntities'],
    complianceDomains?: string[],
    prioritizeRecent = true
  ): string {
    // Start with the user prompt
    let query = userPrompt;
    
    // Add industry context if not already in prompt
    if (!query.toLowerCase().includes(industry.toLowerCase())) {
      query += ` in ${industry} industry`;
    }
    
    // Add location for regulatory context
    if (location && !query.toLowerCase().includes(location.toLowerCase())) {
      query += ` in ${location}`;
    }
    
    // Add compliance domains focus
    if (complianceDomains && complianceDomains.length > 0) {
      const domainText = complianceDomains.join(', ');
      if (!query.toLowerCase().includes(domainText.toLowerCase())) {
        query += ` regarding ${domainText}`;
      }
    }
    
    // Add recency preference
    if (prioritizeRecent && !query.toLowerCase().includes('recent')) {
      query += ' current regulations';
    }
    
    // Add specific entity references if identified
    if (entities?.regulations?.length && 
        !entities.regulations.some(reg => query.includes(reg))) {
      query += ` specifically ${entities.regulations.join(', ')}`;
    }
    
    // Add organization context if relevant
    if (entities?.organizations?.length && 
        !entities.organizations.some(org => query.includes(org))) {
      query += ` from ${entities.organizations.join(', ')}`;
    }
    
    // Format query for better search results
    return this.formatQuery(query);
  }
  
  /**
   * Generate alternative queries for follow-up searches
   */
  private generateAlternativeQueries(
    userPrompt: string,
    entities?: OptimizedQuery['extractedEntities'],
    complianceDomains?: string[],
    documentContext?: string
  ): string[] {
    const alternativeQueries: string[] = [];
    
    // Add regulation-specific queries
    if (entities?.regulations?.length) {
      entities.regulations.forEach(regulation => {
        alternativeQueries.push(`${regulation} full text official source`);
        alternativeQueries.push(`${regulation} recent updates changes`);
      });
    }
    
    // Add organization-specific queries
    if (entities?.organizations?.length) {
      entities.organizations.forEach(org => {
        alternativeQueries.push(`${org} guidelines for ${userPrompt}`);
      });
    }
    
    // Add compliance domain queries
    if (complianceDomains?.length) {
      complianceDomains.forEach(domain => {
        alternativeQueries.push(`${domain} compliance requirements ${userPrompt}`);
      });
    }
    
    // Add document context-based query if available
    if (documentContext) {
      // Extract key phrases from document context (simplified approach)
      const keyPhrases = documentContext
        .split(/[.!?]/)
        .filter(phrase => phrase.length > 15 && phrase.length < 100)
        .slice(0, 1);
        
      if (keyPhrases.length > 0) {
        alternativeQueries.push(`${keyPhrases[0].trim()} regulations`);
      }
    }
    
    // Remove duplicates and limit to 5 alternatives
    return [...new Set(alternativeQueries)]
      .filter(query => query !== userPrompt)
      .slice(0, 5)
      .map(query => this.formatQuery(query));
  }
  
  /**
   * Determine the recommended search focus based on query content
   */
  private determineSearchFocus(
    userPrompt: string,
    entities?: OptimizedQuery['extractedEntities'],
    complianceDomains?: string[]
  ): 'government' | 'news' | 'all' {
    // Default to government focus for compliance queries
    let focus: 'government' | 'news' | 'all' = 'government';
    
    // Check for news-related keywords
    const newsKeywords = [
      'recent', 'latest', 'news', 'update', 'announcement',
      'press release', 'changes', 'proposed', 'draft'
    ];
    
    // If user is explicitly asking for news or updates, include news sources
    if (newsKeywords.some(keyword => userPrompt.toLowerCase().includes(keyword))) {
      focus = 'all';
    }
    
    // If specific regulations are mentioned, prioritize government sources
    if (entities?.regulations?.length) {
      focus = 'government';
    }
    
    return focus;
  }
  
  /**
   * Format and clean query for better search results
   */
  private formatQuery(query: string): string {
    return query
      // Remove excess whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might affect search
      .replace(/[^\w\s,.'"()-]/g, '')
      .trim();
  }
  
  /**
   * Generate a fallback query if optimization fails
   */
  private generateFallbackQuery(userPrompt: string): OptimizedQuery {
    return {
      primaryQuery: `${userPrompt} construction compliance regulations`,
      alternativeQueries: [
        `${userPrompt} government requirements`,
        `${userPrompt} OSHA regulations`
      ],
      recommendedFocus: 'government',
      extractedEntities: {
        regulations: [],
        locations: [],
        organizations: [],
        dates: [],
        other: []
      }
    };
  }
}

// Export singleton instance
export const queryOptimizerService = new QueryOptimizerService(); 