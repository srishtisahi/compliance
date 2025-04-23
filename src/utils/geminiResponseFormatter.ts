import { GeminiComplianceAnalysisResponse } from '../types/gemini.types';
import { logger } from './logger';

/**
 * Confidence level definitions
 */
export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  UNCERTAIN = 'UNCERTAIN'
}

/**
 * Source type definitions for attribution
 */
export enum SourceType {
  GOVERNMENT = 'GOVERNMENT',
  OFFICIAL_STANDARD = 'OFFICIAL_STANDARD',
  INDUSTRY_ASSOCIATION = 'INDUSTRY_ASSOCIATION',
  ACADEMIC = 'ACADEMIC',
  NEWS = 'NEWS',
  OTHER = 'OTHER'
}

/**
 * Represents an attributed source with metadata
 */
export interface AttributedSource {
  id: string;
  text: string;
  source: string;
  url?: string;
  type: SourceType;
  publishDate?: string;
  retrievalDate?: string;
}

/**
 * Interface for formatted compliance response
 */
export interface FormattedComplianceResponse {
  summary: string;
  overallConfidence: ConfidenceLevel;
  keyFindings: Array<{
    text: string;
    confidence: ConfidenceLevel;
    sourceIds: string[];
  }>;
  obligations: Array<{
    text: string;
    confidence: ConfidenceLevel;
    sourceIds: string[];
    jurisdictions?: string[];
  }>;
  recentChanges: Array<{
    text: string;
    effectiveDate?: string;
    confidence: ConfidenceLevel;
    sourceIds: string[];
  }>;
  risks: Array<{
    text: string;
    severity?: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: ConfidenceLevel;
    sourceIds: string[];
  }>;
  jurisdictionalNotes?: string;
  sources: AttributedSource[];
  metadata: {
    generatedAt: string;
    query: string;
    modelUsed: string;
    disclaimer: string;
  };
}

/**
 * Formats Gemini API response with proper source attribution and confidence levels
 * @param response - The raw Gemini API compliance analysis response
 * @param query - The original user query
 * @returns Formatted response with attribution and confidence levels
 */
export function formatComplianceResponse(
  response: GeminiComplianceAnalysisResponse,
  query: string
): FormattedComplianceResponse {
  try {
    const sources: AttributedSource[] = [];
    
    // Process citations into attributed sources
    if (response.citations && response.citations.length > 0) {
      response.citations.forEach((citation, index) => {
        // Extract source type from citation text
        const sourceType = determineSourceType(citation.source || citation.text);
        
        sources.push({
          id: `src-${index + 1}`,
          text: citation.text,
          source: citation.source || 'Unknown',
          type: sourceType,
          retrievalDate: new Date().toISOString().split('T')[0]
        });
      });
    }
    
    // Generate key findings from summary
    const keyFindings = generateKeyFindings(response.summary || '', sources);
    
    // Process obligations with confidence levels
    const obligations = (response.obligations || []).map((obligation, index) => {
      const relevantSourceIds = findRelevantSources(obligation, sources);
      return {
        text: obligation,
        confidence: calculateConfidence(relevantSourceIds, sources),
        sourceIds: relevantSourceIds
      };
    });
    
    // Process recent changes with confidence levels
    const recentChanges = (response.recentChanges || []).map((change, index) => {
      const relevantSourceIds = findRelevantSources(change, sources);
      // Extract effective date if available
      const effectiveDateMatch = change.match(/effective\s+(?:on|from|as\s+of)?\s+(\w+\s+\d{1,2},?\s+\d{4})/i);
      return {
        text: change,
        effectiveDate: effectiveDateMatch ? effectiveDateMatch[1] : undefined,
        confidence: calculateConfidence(relevantSourceIds, sources),
        sourceIds: relevantSourceIds
      };
    });
    
    // Process risks with confidence levels
    const risks = (response.risks || []).map((risk, index) => {
      const relevantSourceIds = findRelevantSources(risk, sources);
      // Determine severity level
      const severity = determineSeverity(risk);
      return {
        text: risk,
        severity,
        confidence: calculateConfidence(relevantSourceIds, sources),
        sourceIds: relevantSourceIds
      };
    });
    
    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(
      keyFindings.map(f => f.confidence),
      obligations.map(o => o.confidence),
      recentChanges.map(c => c.confidence),
      risks.map(r => r.confidence)
    );
    
    // Create the formatted response
    return {
      summary: response.summary || 'No summary available',
      overallConfidence,
      keyFindings,
      obligations,
      recentChanges,
      risks,
      jurisdictionalNotes: response.jurisdictionalNotes,
      sources,
      metadata: {
        generatedAt: new Date().toISOString(),
        query,
        modelUsed: 'Google Gemini Pro',
        disclaimer: 'This information is provided for informational purposes only and should not be considered legal advice. Always consult with a qualified legal professional for specific compliance guidance.'
      }
    };
  } catch (error) {
    logger.error('Error formatting Gemini compliance response:', error);
    throw new Error('Failed to format compliance response with attribution and confidence levels');
  }
}

/**
 * Determines the type of source based on source text
 * @param sourceText - Text describing the source
 * @returns Appropriate source type
 */
function determineSourceType(sourceText: string): SourceType {
  const text = sourceText.toLowerCase();
  
  if (
    text.includes('gov') || 
    text.includes('government') || 
    text.includes('federal') || 
    text.includes('state') || 
    text.includes('department') || 
    text.includes('agency') || 
    text.includes('code') ||
    text.includes('regulation') ||
    text.includes('statute') ||
    text.includes('act ')
  ) {
    return SourceType.GOVERNMENT;
  }
  
  if (
    text.includes('standard') || 
    text.includes('iso') || 
    text.includes('astm') || 
    text.includes('ansi') || 
    text.includes('ieee')
  ) {
    return SourceType.OFFICIAL_STANDARD;
  }
  
  if (
    text.includes('association') || 
    text.includes('institute') || 
    text.includes('council') ||
    text.includes('society') ||
    text.includes('foundation')
  ) {
    return SourceType.INDUSTRY_ASSOCIATION;
  }
  
  if (
    text.includes('university') || 
    text.includes('college') || 
    text.includes('journal') || 
    text.includes('research') ||
    text.includes('study')
  ) {
    return SourceType.ACADEMIC;
  }
  
  if (
    text.includes('news') || 
    text.includes('article') || 
    text.includes('press') || 
    text.includes('media') ||
    text.includes('times') ||
    text.includes('post')
  ) {
    return SourceType.NEWS;
  }
  
  return SourceType.OTHER;
}

/**
 * Calculates confidence level based on available sources
 * @param sourceIds - Array of relevant source IDs
 * @param sources - All available sources
 * @returns Appropriate confidence level
 */
function calculateConfidence(sourceIds: string[], sources: AttributedSource[]): ConfidenceLevel {
  if (sourceIds.length === 0) {
    return ConfidenceLevel.UNCERTAIN;
  }
  
  // Get relevant sources
  const relevantSources = sources.filter(source => sourceIds.includes(source.id));
  
  // Count sources by type
  const governmentSources = relevantSources.filter(s => s.type === SourceType.GOVERNMENT).length;
  const officialStandards = relevantSources.filter(s => s.type === SourceType.OFFICIAL_STANDARD).length;
  const industrySources = relevantSources.filter(s => s.type === SourceType.INDUSTRY_ASSOCIATION).length;
  const academicSources = relevantSources.filter(s => s.type === SourceType.ACADEMIC).length;
  const newsSources = relevantSources.filter(s => s.type === SourceType.NEWS).length;
  
  // High confidence: Multiple government or official standard sources
  if (governmentSources >= 2 || officialStandards >= 2 || (governmentSources >= 1 && officialStandards >= 1)) {
    return ConfidenceLevel.HIGH;
  }
  
  // Medium confidence: At least one government or official source, or multiple industry sources
  if (governmentSources === 1 || officialStandards === 1 || industrySources >= 2 || 
      (industrySources >= 1 && academicSources >= 1)) {
    return ConfidenceLevel.MEDIUM;
  }
  
  // Low confidence: Industry, academic or news sources
  if (industrySources === 1 || academicSources >= 1 || newsSources >= 1) {
    return ConfidenceLevel.LOW;
  }
  
  // Default to uncertain
  return ConfidenceLevel.UNCERTAIN;
}

/**
 * Finds relevant source IDs for a given text
 * @param text - Text to match with sources
 * @param sources - All available sources
 * @returns Array of relevant source IDs
 */
function findRelevantSources(text: string, sources: AttributedSource[]): string[] {
  const relevantSourceIds: string[] = [];
  
  // Simple keyword matching approach
  for (const source of sources) {
    // Extract key terms from the source text (3+ character words)
    const sourceTerms = source.text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .map(word => word.replace(/[^\w]/g, ''));
    
    // Count how many key terms from the source appear in the text
    const matchCount = sourceTerms.filter(term => 
      text.toLowerCase().includes(term)
    ).length;
    
    // If we have enough matching terms, consider this a relevant source
    if (matchCount >= 2 || (sourceTerms.length === 1 && matchCount === 1)) {
      relevantSourceIds.push(source.id);
    }
  }
  
  return relevantSourceIds;
}

/**
 * Generates key findings from summary text
 * @param summary - Summary text from Gemini
 * @param sources - All available sources
 * @returns Array of key findings with confidence levels
 */
function generateKeyFindings(summary: string, sources: AttributedSource[]): Array<{
  text: string;
  confidence: ConfidenceLevel;
  sourceIds: string[];
}> {
  if (!summary) {
    return [];
  }
  
  // Split summary into sentences
  const sentences = summary
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.trim().length > 0);
  
  // Convert sentences to key findings
  return sentences.map(sentence => {
    const relevantSourceIds = findRelevantSources(sentence, sources);
    return {
      text: sentence.trim(),
      confidence: calculateConfidence(relevantSourceIds, sources),
      sourceIds: relevantSourceIds
    };
  });
}

/**
 * Determines risk severity based on text content
 * @param riskText - Text describing the risk
 * @returns Risk severity level
 */
function determineSeverity(riskText: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const text = riskText.toLowerCase();
  
  // Check for high severity indicators
  if (
    text.includes('significant') ||
    text.includes('severe') ||
    text.includes('substantial') ||
    text.includes('high') ||
    text.includes('criminal') ||
    text.includes('imprisonment') ||
    text.includes('jail') ||
    text.includes('felony') ||
    /\$\d{3,}k|\$\d+\s*million/i.test(text) // Large monetary amounts
  ) {
    return 'HIGH';
  }
  
  // Check for medium severity indicators
  if (
    text.includes('moderate') ||
    text.includes('considerable') ||
    text.includes('medium') ||
    text.includes('misdemeanor') ||
    text.includes('fine') ||
    text.includes('penalty') ||
    /\$\d{1,3}(?:,\d{3})+|\$\d{4,}/.test(text) // Medium monetary amounts
  ) {
    return 'MEDIUM';
  }
  
  // Default to low severity
  return 'LOW';
}

/**
 * Calculates overall confidence level based on individual confidence levels
 * @param confidenceLevels - Arrays of confidence levels from different categories
 * @returns Overall confidence level
 */
function calculateOverallConfidence(...confidenceLevels: ConfidenceLevel[][]): ConfidenceLevel {
  // Flatten the array of arrays
  const allLevels = confidenceLevels.flat();
  
  if (allLevels.length === 0) {
    return ConfidenceLevel.UNCERTAIN;
  }
  
  // Count occurrences of each confidence level
  const counts = {
    [ConfidenceLevel.HIGH]: 0,
    [ConfidenceLevel.MEDIUM]: 0,
    [ConfidenceLevel.LOW]: 0,
    [ConfidenceLevel.UNCERTAIN]: 0
  };
  
  allLevels.forEach(level => {
    counts[level]++;
  });
  
  // Calculate percentages
  const total = allLevels.length;
  const highPercent = (counts[ConfidenceLevel.HIGH] / total) * 100;
  const mediumPercent = (counts[ConfidenceLevel.MEDIUM] / total) * 100;
  const lowPercent = (counts[ConfidenceLevel.LOW] / total) * 100;
  const uncertainPercent = (counts[ConfidenceLevel.UNCERTAIN] / total) * 100;
  
  // Determine overall confidence based on percentages
  if (highPercent >= 50) {
    return ConfidenceLevel.HIGH;
  } else if (highPercent + mediumPercent >= 70) {
    return ConfidenceLevel.MEDIUM;
  } else if (uncertainPercent >= 30) {
    return ConfidenceLevel.UNCERTAIN;
  } else {
    return ConfidenceLevel.LOW;
  }
} 