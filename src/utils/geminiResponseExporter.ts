import { FormattedComplianceResponse, ConfidenceLevel, SourceType, AttributedSource } from './geminiResponseFormatter';
import { logger } from './logger';

/**
 * Export options for compliance responses
 */
export interface ExportOptions {
  includeMetadata?: boolean;
  includeDisclaimer?: boolean;
  includeSources?: boolean;
  includeConfidenceIndicators?: boolean;
  format?: 'html' | 'json' | 'markdown';
}

/**
 * Generates a confidence badge HTML based on confidence level
 * @param level - Confidence level enum value
 * @returns HTML string for confidence badge
 */
function getConfidenceBadgeHtml(level: ConfidenceLevel): string {
  const badges = {
    [ConfidenceLevel.HIGH]: '<span class="confidence-badge high">High Confidence</span>',
    [ConfidenceLevel.MEDIUM]: '<span class="confidence-badge medium">Medium Confidence</span>',
    [ConfidenceLevel.LOW]: '<span class="confidence-badge low">Low Confidence</span>',
    [ConfidenceLevel.UNCERTAIN]: '<span class="confidence-badge uncertain">Uncertain</span>'
  };
  
  return badges[level] || badges[ConfidenceLevel.UNCERTAIN];
}

/**
 * Generates a severity badge HTML based on risk severity
 * @param severity - Risk severity level
 * @returns HTML string for severity badge
 */
function getSeverityBadgeHtml(severity: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  const badges = {
    'HIGH': '<span class="severity-badge high">High Severity</span>',
    'MEDIUM': '<span class="severity-badge medium">Medium Severity</span>',
    'LOW': '<span class="severity-badge low">Low Severity</span>'
  };
  
  return badges[severity] || '';
}

/**
 * Generates source citation HTML
 * @param sourceIds - Array of source IDs
 * @param sources - All sources
 * @returns HTML string with source citations
 */
function getSourceCitationsHtml(sourceIds: string[], sources: AttributedSource[]): string {
  if (sourceIds.length === 0) {
    return '';
  }
  
  const citedSources = sources.filter(source => sourceIds.includes(source.id));
  
  return `
    <div class="source-citations">
      <p>Sources:</p>
      <ul>
        ${citedSources.map(source => {
          const sourceTypeLabel = source.type.replace('_', ' ').toLowerCase();
          return `<li>
            <span class="source-id">[${source.id}]</span>
            <span class="source-text">${source.text}</span>
            <span class="source-name">${source.source}</span>
            ${source.url ? `<a href="${source.url}" target="_blank" class="source-link">View Source</a>` : ''}
            <span class="source-type ${sourceTypeLabel}">${source.type}</span>
          </li>`;
        }).join('')}
      </ul>
    </div>
  `;
}

/**
 * Exports a formatted compliance response as HTML
 * @param response - Formatted compliance response
 * @param options - Export options
 * @returns HTML string
 */
export function exportAsHtml(
  response: FormattedComplianceResponse,
  options: ExportOptions = {}
): string {
  try {
    const {
      includeMetadata = true,
      includeDisclaimer = true,
      includeSources = true,
      includeConfidenceIndicators = true
    } = options;
    
    let html = `
      <div class="compliance-report">
        <div class="report-header">
          <h1>Compliance Analysis Report</h1>
          ${includeMetadata ? `<p class="metadata">Generated: ${new Date(response.metadata.generatedAt).toLocaleString()}</p>` : ''}
          ${includeMetadata ? `<p class="query">Query: ${response.metadata.query}</p>` : ''}
        </div>
        
        <div class="summary-section">
          <h2>Summary</h2>
          <p>${response.summary}</p>
          ${includeConfidenceIndicators ? `<div class="overall-confidence">${getConfidenceBadgeHtml(response.overallConfidence)}</div>` : ''}
        </div>
        
        <div class="key-findings">
          <h2>Key Findings</h2>
          <ul>
            ${response.keyFindings.map(finding => `
              <li>
                <div class="finding-text">${finding.text}</div>
                ${includeConfidenceIndicators ? getConfidenceBadgeHtml(finding.confidence) : ''}
                ${includeSources ? getSourceCitationsHtml(finding.sourceIds, response.sources) : ''}
              </li>
            `).join('')}
          </ul>
        </div>
        
        <div class="legal-obligations">
          <h2>Legal Obligations</h2>
          <ul>
            ${response.obligations.map(obligation => `
              <li>
                <div class="obligation-text">${obligation.text}</div>
                ${includeConfidenceIndicators ? getConfidenceBadgeHtml(obligation.confidence) : ''}
                ${includeSources ? getSourceCitationsHtml(obligation.sourceIds, response.sources) : ''}
              </li>
            `).join('')}
          </ul>
        </div>
        
        <div class="recent-changes">
          <h2>Recent Changes</h2>
          ${response.recentChanges.length > 0 ? `
            <ul>
              ${response.recentChanges.map(change => `
                <li>
                  <div class="change-text">${change.text}</div>
                  ${change.effectiveDate ? `<div class="effective-date">Effective: ${change.effectiveDate}</div>` : ''}
                  ${includeConfidenceIndicators ? getConfidenceBadgeHtml(change.confidence) : ''}
                  ${includeSources ? getSourceCitationsHtml(change.sourceIds, response.sources) : ''}
                </li>
              `).join('')}
            </ul>
          ` : '<p>No recent changes identified</p>'}
        </div>
        
        <div class="compliance-risks">
          <h2>Compliance Risks</h2>
          ${response.risks.length > 0 ? `
            <ul>
              ${response.risks.map(risk => `
                <li>
                  <div class="risk-text">${risk.text}</div>
                  ${risk.severity ? getSeverityBadgeHtml(risk.severity) : ''}
                  ${includeConfidenceIndicators ? getConfidenceBadgeHtml(risk.confidence) : ''}
                  ${includeSources ? getSourceCitationsHtml(risk.sourceIds, response.sources) : ''}
                </li>
              `).join('')}
            </ul>
          ` : '<p>No specific compliance risks identified</p>'}
        </div>
        
        ${response.jurisdictionalNotes ? `
          <div class="jurisdictional-notes">
            <h2>Jurisdictional Notes</h2>
            <p>${response.jurisdictionalNotes}</p>
          </div>
        ` : ''}
        
        ${includeSources ? `
          <div class="all-sources">
            <h2>Sources</h2>
            <ul class="sources-list">
              ${response.sources.map(source => {
                const sourceTypeLabel = source.type.replace('_', ' ').toLowerCase();
                return `
                  <li id="${source.id}" class="source-item">
                    <span class="source-id">${source.id}</span>
                    <div class="source-content">
                      <p class="source-text">${source.text}</p>
                      <p class="source-name">${source.source}</p>
                      ${source.url ? `<a href="${source.url}" target="_blank" class="source-link">View Source</a>` : ''}
                    </div>
                    <span class="source-type ${sourceTypeLabel}">${source.type}</span>
                  </li>
                `;
              }).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${includeDisclaimer ? `
          <div class="disclaimer">
            <h3>Disclaimer</h3>
            <p>${response.metadata.disclaimer}</p>
          </div>
        ` : ''}
      </div>
      
      <style>
        .compliance-report {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          max-width: 900px;
          margin: 0 auto;
          line-height: 1.5;
          color: #333;
        }
        .report-header h1 {
          color: #1a365d;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }
        .metadata, .query {
          color: #718096;
          font-size: 0.9rem;
        }
        h2 {
          color: #2a4365;
          margin-top: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        ul {
          padding-left: 1.5rem;
        }
        li {
          margin-bottom: 1rem;
        }
        .confidence-badge, .severity-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-left: 0.5rem;
        }
        .confidence-badge.high {
          background-color: #c6f6d5;
          color: #22543d;
        }
        .confidence-badge.medium {
          background-color: #fefcbf;
          color: #744210;
        }
        .confidence-badge.low {
          background-color: #fed7d7;
          color: #822727;
        }
        .confidence-badge.uncertain {
          background-color: #e2e8f0;
          color: #2d3748;
        }
        .severity-badge.high {
          background-color: #fed7d7;
          color: #822727;
        }
        .severity-badge.medium {
          background-color: #fefcbf;
          color: #744210;
        }
        .severity-badge.low {
          background-color: #c6f6d5;
          color: #22543d;
        }
        .source-citations {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          border-left: 2px solid #e2e8f0;
          padding-left: 1rem;
        }
        .source-citations p {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .source-citations ul {
          padding-left: 1rem;
          margin-top: 0.25rem;
        }
        .source-citations li {
          margin-bottom: 0.5rem;
        }
        .source-id {
          font-weight: 600;
          margin-right: 0.5rem;
        }
        .all-sources {
          margin-top: 2rem;
          background-color: #f7fafc;
          padding: 1rem;
          border-radius: 0.5rem;
        }
        .sources-list {
          list-style-type: none;
          padding-left: 0;
        }
        .source-item {
          padding: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .source-content {
          flex: 1;
          margin: 0 1rem;
        }
        .source-type {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          background-color: #e2e8f0;
        }
        .source-type.government {
          background-color: #c6f6d5;
          color: #22543d;
        }
        .source-type.official {
          background-color: #c6f6d5;
          color: #22543d;
        }
        .source-type.industry {
          background-color: #bee3f8;
          color: #2c5282;
        }
        .source-type.academic {
          background-color: #e9d8fd;
          color: #553c9a;
        }
        .source-type.news {
          background-color: #fed7d7;
          color: #822727;
        }
        .disclaimer {
          margin-top: 2rem;
          padding: 1rem;
          background-color: #f7fafc;
          border-left: 4px solid #cbd5e0;
          font-size: 0.9rem;
        }
      </style>
    `;
    
    return html;
  } catch (error: unknown) {
    logger.error('Error exporting compliance response as HTML:', error);
    return `<p>Error generating HTML report: ${error instanceof Error ? error.message : String(error)}</p>`;
  }
}

/**
 * Exports a formatted compliance response as Markdown
 * @param response - Formatted compliance response
 * @param options - Export options
 * @returns Markdown string
 */
export function exportAsMarkdown(
  response: FormattedComplianceResponse,
  options: ExportOptions = {}
): string {
  try {
    const {
      includeMetadata = true,
      includeDisclaimer = true,
      includeSources = true,
      includeConfidenceIndicators = true
    } = options;
    
    let markdown = `# Compliance Analysis Report\n\n`;
    
    if (includeMetadata) {
      markdown += `Generated: ${new Date(response.metadata.generatedAt).toLocaleString()}\n\n`;
      markdown += `Query: ${response.metadata.query}\n\n`;
    }
    
    // Summary
    markdown += `## Summary\n\n${response.summary}\n\n`;
    if (includeConfidenceIndicators) {
      markdown += `**Overall Confidence: ${response.overallConfidence}**\n\n`;
    }
    
    // Key Findings
    markdown += `## Key Findings\n\n`;
    response.keyFindings.forEach(finding => {
      markdown += `* ${finding.text}`;
      if (includeConfidenceIndicators) {
        markdown += ` [${finding.confidence} confidence]`;
      }
      if (includeSources && finding.sourceIds.length > 0) {
        markdown += ` [Sources: ${finding.sourceIds.join(', ')}]`;
      }
      markdown += `\n`;
    });
    markdown += `\n`;
    
    // Legal Obligations
    markdown += `## Legal Obligations\n\n`;
    response.obligations.forEach(obligation => {
      markdown += `* ${obligation.text}`;
      if (includeConfidenceIndicators) {
        markdown += ` [${obligation.confidence} confidence]`;
      }
      if (includeSources && obligation.sourceIds.length > 0) {
        markdown += ` [Sources: ${obligation.sourceIds.join(', ')}]`;
      }
      markdown += `\n`;
    });
    markdown += `\n`;
    
    // Recent Changes
    markdown += `## Recent Changes\n\n`;
    if (response.recentChanges.length > 0) {
      response.recentChanges.forEach(change => {
        markdown += `* ${change.text}`;
        if (change.effectiveDate) {
          markdown += ` (Effective: ${change.effectiveDate})`;
        }
        if (includeConfidenceIndicators) {
          markdown += ` [${change.confidence} confidence]`;
        }
        if (includeSources && change.sourceIds.length > 0) {
          markdown += ` [Sources: ${change.sourceIds.join(', ')}]`;
        }
        markdown += `\n`;
      });
    } else {
      markdown += `No recent changes identified.\n`;
    }
    markdown += `\n`;
    
    // Compliance Risks
    markdown += `## Compliance Risks\n\n`;
    if (response.risks.length > 0) {
      response.risks.forEach(risk => {
        markdown += `* ${risk.text}`;
        if (risk.severity) {
          markdown += ` [${risk.severity} severity]`;
        }
        if (includeConfidenceIndicators) {
          markdown += ` [${risk.confidence} confidence]`;
        }
        if (includeSources && risk.sourceIds.length > 0) {
          markdown += ` [Sources: ${risk.sourceIds.join(', ')}]`;
        }
        markdown += `\n`;
      });
    } else {
      markdown += `No specific compliance risks identified.\n`;
    }
    markdown += `\n`;
    
    // Jurisdictional Notes
    if (response.jurisdictionalNotes) {
      markdown += `## Jurisdictional Notes\n\n${response.jurisdictionalNotes}\n\n`;
    }
    
    // Sources
    if (includeSources && response.sources.length > 0) {
      markdown += `## Sources\n\n`;
      response.sources.forEach(source => {
        markdown += `* **${source.id}**: ${source.text}`;
        markdown += ` - ${source.source}`;
        if (source.url) {
          markdown += ` [Link](${source.url})`;
        }
        markdown += ` [${source.type}]`;
        markdown += `\n`;
      });
      markdown += `\n`;
    }
    
    // Disclaimer
    if (includeDisclaimer) {
      markdown += `## Disclaimer\n\n${response.metadata.disclaimer}\n`;
    }
    
    return markdown;
  } catch (error: unknown) {
    logger.error('Error exporting compliance response as Markdown:', error);
    return `Error generating Markdown report: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Custom JSON export format for client consumption
 * @param response - Formatted compliance response
 * @param options - Export options
 * @returns Simplified JSON object for client use
 */
export function exportAsClientJson(
  response: FormattedComplianceResponse,
  options: ExportOptions = {}
): Record<string, any> {
  try {
    const {
      includeMetadata = true,
      includeDisclaimer = true,
      includeSources = true,
      includeConfidenceIndicators = true
    } = options;
    
    // Start with basic structure
    const clientJson: Record<string, any> = {
      summary: response.summary,
      keyFindings: response.keyFindings.map(finding => ({
        text: finding.text,
        ...(includeConfidenceIndicators ? { confidence: finding.confidence } : {}),
        ...(includeSources ? { sourceIds: finding.sourceIds } : {})
      })),
      obligations: response.obligations.map(obligation => ({
        text: obligation.text,
        ...(includeConfidenceIndicators ? { confidence: obligation.confidence } : {}),
        ...(includeSources ? { sourceIds: obligation.sourceIds } : {})
      })),
      recentChanges: response.recentChanges.map(change => ({
        text: change.text,
        ...(change.effectiveDate ? { effectiveDate: change.effectiveDate } : {}),
        ...(includeConfidenceIndicators ? { confidence: change.confidence } : {}),
        ...(includeSources ? { sourceIds: change.sourceIds } : {})
      })),
      risks: response.risks.map(risk => ({
        text: risk.text,
        ...(risk.severity ? { severity: risk.severity } : {}),
        ...(includeConfidenceIndicators ? { confidence: risk.confidence } : {}),
        ...(includeSources ? { sourceIds: risk.sourceIds } : {})
      }))
    };
    
    // Add jurisdictional notes if available
    if (response.jurisdictionalNotes) {
      clientJson.jurisdictionalNotes = response.jurisdictionalNotes;
    }
    
    // Include overall confidence if needed
    if (includeConfidenceIndicators) {
      clientJson.overallConfidence = response.overallConfidence;
    }
    
    // Include sources if needed
    if (includeSources) {
      clientJson.sources = response.sources.map(source => ({
        id: source.id,
        text: source.text,
        source: source.source,
        ...(source.url ? { url: source.url } : {}),
        type: source.type
      }));
    }
    
    // Include metadata if needed
    if (includeMetadata) {
      clientJson.metadata = {
        generatedAt: response.metadata.generatedAt,
        query: response.metadata.query,
        modelUsed: response.metadata.modelUsed
      };
    }
    
    // Include disclaimer if needed
    if (includeDisclaimer) {
      clientJson.disclaimer = response.metadata.disclaimer;
    }
    
    return clientJson;
  } catch (error: unknown) {
    logger.error('Error exporting compliance response as client JSON:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
} 