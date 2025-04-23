import { GeminiComplianceAnalysisResponse } from '@/lib/types/gemini.types'; // Updated path
import { logger } from '@/lib/utils/logger'; // Updated path

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
    
    const keyFindings = generateKeyFindings(response.summary || '', sources);
    const obligations = (response.obligations || []).map((obligation) => {
      const relevantSourceIds = findRelevantSources(obligation, sources);
      return {
        text: obligation,
        confidence: calculateConfidence(relevantSourceIds, sources),
        sourceIds: relevantSourceIds
      };
    });
    
    const recentChanges = (response.recentChanges || []).map((change) => {
      const relevantSourceIds = findRelevantSources(change, sources);
      const effectiveDateMatch = change.match(/effective\s+(?:on|from|as\s+of)?\s+(\w+\s+\d{1,2},?\s+\d{4})/i);
      return {
        text: change,
        effectiveDate: effectiveDateMatch ? effectiveDateMatch[1] : undefined,
        confidence: calculateConfidence(relevantSourceIds, sources),
        sourceIds: relevantSourceIds
      };
    });
    
    const risks = (response.risks || []).map((risk) => {
      const relevantSourceIds = findRelevantSources(risk, sources);
      const severity = determineSeverity(risk);
      return {
        text: risk,
        severity,
        confidence: calculateConfidence(relevantSourceIds, sources),
        sourceIds: relevantSourceIds
      };
    });
    
    const overallConfidence = calculateOverallConfidence(
      keyFindings.map(f => f.confidence),
      obligations.map(o => o.confidence),
      recentChanges.map(c => c.confidence),
      risks.map(r => r.confidence)
    );
    
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
        modelUsed: 'Google Gemini Pro', // Assuming this model, might need dynamic update
        disclaimer: 'This information is provided for informational purposes only and should not be considered legal advice. Always consult with a qualified legal professional for specific compliance guidance.'
      }
    };
  } catch (error) {
    logger.error('Error formatting Gemini compliance response:', error);
    throw new Error('Failed to format compliance response with attribution and confidence levels');
  }
}

function determineSourceType(sourceText: string): SourceType {
  const text = sourceText.toLowerCase();
  
  if (
    text.includes('gov') || text.includes('government') || text.includes('federal') || 
    text.includes('state') || text.includes('department') || text.includes('agency') || 
    text.includes('code') || text.includes('regulation') || text.includes('statute') || 
    text.includes('act ')
  ) return SourceType.GOVERNMENT;
  
  if (
    text.includes('standard') || text.includes('iso') || text.includes('astm') || 
    text.includes('ansi') || text.includes('ieee')
  ) return SourceType.OFFICIAL_STANDARD;
  
  if (
    text.includes('association') || text.includes('institute') || text.includes('council') ||
    text.includes('society') || text.includes('foundation')
  ) return SourceType.INDUSTRY_ASSOCIATION;
  
  if (
    text.includes('university') || text.includes('college') || text.includes('journal') || 
    text.includes('research') || text.includes('study')
  ) return SourceType.ACADEMIC;
  
  if (
    text.includes('news') || text.includes('article') || text.includes('press') || 
    text.includes('media') || text.includes('times') || text.includes('post')
  ) return SourceType.NEWS;
  
  return SourceType.OTHER;
}

function calculateConfidence(sourceIds: string[], sources: AttributedSource[]): ConfidenceLevel {
  if (sourceIds.length === 0) return ConfidenceLevel.UNCERTAIN;

  const relevantSources = sources.filter(s => sourceIds.includes(s.id));
  if (relevantSources.length === 0) return ConfidenceLevel.UNCERTAIN;

  let highScoreCount = 0;
  let mediumScoreCount = 0;

  relevantSources.forEach(source => {
    switch (source.type) {
      case SourceType.GOVERNMENT:
      case SourceType.OFFICIAL_STANDARD:
        highScoreCount++;
        break;
      case SourceType.INDUSTRY_ASSOCIATION:
      case SourceType.ACADEMIC:
        mediumScoreCount++;
        break;
      default:
        break;
    }
  });

  if (highScoreCount >= 1) return ConfidenceLevel.HIGH;
  if (mediumScoreCount >= 1) return ConfidenceLevel.MEDIUM;
  return ConfidenceLevel.LOW;
}

function findRelevantSources(text: string, sources: AttributedSource[]): string[] {
  // Simple implementation: Check if source text snippet is mentioned.
  // A more robust implementation would use NLP or keyword matching.
  return sources
    .filter(source => text.includes(source.text))
    .map(source => source.id);
}

function generateKeyFindings(summary: string, sources: AttributedSource[]): Array<{
  text: string;
  confidence: ConfidenceLevel;
  sourceIds: string[];
}> {
  // Simple implementation: Split summary into sentences and treat as findings.
  // A more robust implementation would use NLP to identify key statements.
  if (!summary) return [];

  const sentences = summary.match(/[^.!?]+[.!?]+/g) || [summary];
  return sentences.map(sentence => {
    const trimmedSentence = sentence.trim();
    const relevantSourceIds = findRelevantSources(trimmedSentence, sources);
    return {
      text: trimmedSentence,
      confidence: calculateConfidence(relevantSourceIds, sources),
      sourceIds: relevantSourceIds
    };
  });
}

function determineSeverity(riskText: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const text = riskText.toLowerCase();
  if (text.includes('significant') || text.includes('substantial') || text.includes('major') || text.includes('severe')) return 'HIGH';
  if (text.includes('moderate') || text.includes('potential') || text.includes('may result')) return 'MEDIUM';
  return 'LOW';
}

function calculateOverallConfidence(...confidenceLevels: ConfidenceLevel[][]): ConfidenceLevel {
  const levels = confidenceLevels.flat();
  if (levels.length === 0) return ConfidenceLevel.UNCERTAIN;

  const counts = levels.reduce((acc, level) => {
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<ConfidenceLevel, number>);

  if ((counts[ConfidenceLevel.HIGH] || 0) >= levels.length * 0.5) return ConfidenceLevel.HIGH;
  if ((counts[ConfidenceLevel.HIGH] || 0) + (counts[ConfidenceLevel.MEDIUM] || 0) >= levels.length * 0.6) return ConfidenceLevel.MEDIUM;
  if ((counts[ConfidenceLevel.LOW] || 0) > levels.length * 0.5) return ConfidenceLevel.LOW;
  
  return ConfidenceLevel.UNCERTAIN;
} 