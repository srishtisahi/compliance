import { 
  FormattedComplianceResponse, 
  ConfidenceLevel, 
  SourceType, 
  AttributedSource 
} from '@/lib/utils/geminiResponseFormatter'; // Updated path
import { logger } from '@/lib/utils/logger'; // Updated path

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

// --- HTML Export Functions --- 

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getConfidenceBadgeHtml(level: ConfidenceLevel): string {
  const levelLower = level.toLowerCase();
  return `<span class="confidence-badge ${levelLower}">${level.charAt(0)}${levelLower.slice(1)} Confidence</span>`;
}

function getSeverityBadgeHtml(severity: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  const levelLower = severity.toLowerCase();
  return `<span class="severity-badge ${levelLower}">${severity.charAt(0)}${levelLower.slice(1)} Severity</span>`;
}

function getSourceCitationsHtml(sourceIds: string[], sources: AttributedSource[]): string {
  if (!sourceIds || sourceIds.length === 0) return '';
  const citedSources = sources.filter(source => sourceIds.includes(source.id));
  if (citedSources.length === 0) return '';

  return `
    <div class="source-citations">
      <strong>Sources:</strong>
      <ul>
        ${citedSources.map(source => `
          <li>
            <span class="source-id">[${escapeHtml(source.id)}]</span>
            ${source.url ? 
              `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer" class="source-link">${escapeHtml(source.source)}</a>` : 
              `<span class="source-name">${escapeHtml(source.source)}</span>`}
            (<span class="source-type">${escapeHtml(source.type)}</span>)
            ${source.text ? `<span class="source-text">: ${escapeHtml(source.text)}</span>` : ''}
          </li>`).join('')}
      </ul>
    </div>`;
}

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
    
    const sections = [
      {
        title: 'Summary',
        content: `<p>${escapeHtml(response.summary)}</p>` + 
                 (includeConfidenceIndicators ? `<div class="overall-confidence">${getConfidenceBadgeHtml(response.overallConfidence)}</div>` : '')
      },
      {
        title: 'Key Findings',
        content: response.keyFindings.length > 0 ? `<ul>${response.keyFindings.map(finding => `
          <li>
            <div class="finding-text">${escapeHtml(finding.text)}</div>
            ${includeConfidenceIndicators ? getConfidenceBadgeHtml(finding.confidence) : ''}
            ${includeSources ? getSourceCitationsHtml(finding.sourceIds, response.sources) : ''}
          </li>`).join('')}</ul>` : '<p>N/A</p>'
      },
      {
        title: 'Legal Obligations',
        content: response.obligations.length > 0 ? `<ul>${response.obligations.map(obligation => `
          <li>
            <div class="obligation-text">${escapeHtml(obligation.text)}</div>
            ${includeConfidenceIndicators ? getConfidenceBadgeHtml(obligation.confidence) : ''}
            ${includeSources ? getSourceCitationsHtml(obligation.sourceIds, response.sources) : ''}
          </li>`).join('')}</ul>` : '<p>N/A</p>'
      },
      {
        title: 'Recent Changes',
        content: response.recentChanges.length > 0 ? `<ul>${response.recentChanges.map(change => `
          <li>
            <div class="change-text">${escapeHtml(change.text)}</div>
            ${change.effectiveDate ? `<div class="effective-date">Effective: ${escapeHtml(change.effectiveDate)}</div>` : ''}
            ${includeConfidenceIndicators ? getConfidenceBadgeHtml(change.confidence) : ''}
            ${includeSources ? getSourceCitationsHtml(change.sourceIds, response.sources) : ''}
          </li>`).join('')}</ul>` : '<p>N/A</p>'
      },
      {
        title: 'Compliance Risks',
        content: response.risks.length > 0 ? `<ul>${response.risks.map(risk => `
          <li>
            <div class="risk-text">${escapeHtml(risk.text)}</div>
            ${risk.severity ? getSeverityBadgeHtml(risk.severity) : ''}
            ${includeConfidenceIndicators ? getConfidenceBadgeHtml(risk.confidence) : ''}
            ${includeSources ? getSourceCitationsHtml(risk.sourceIds, response.sources) : ''}
          </li>`).join('')}</ul>` : '<p>N/A</p>'
      }
    ];

    if (response.jurisdictionalNotes) {
      sections.push({
        title: 'Jurisdictional Notes',
        content: `<p>${escapeHtml(response.jurisdictionalNotes)}</p>`
      });
    }

    let html = `
      <div class="compliance-report">
        <div class="report-header">
          <h1>Compliance Analysis Report</h1>
          ${includeMetadata ? `<p class="metadata">Generated: ${escapeHtml(new Date(response.metadata.generatedAt).toLocaleString())}</p>` : ''}
          ${includeMetadata ? `<p class="query">Query: ${escapeHtml(response.metadata.query)}</p>` : ''}
        </div>
        ${sections.map(section => `
          <div class="section ${section.title.toLowerCase().replace(' ', '-')}">
            <h2>${escapeHtml(section.title)}</h2>
            ${section.content}
          </div>`).join('')}
    `;

    if (includeSources && response.sources.length > 0) {
      html += `
        <div class="section all-sources">
          <h2>Sources</h2>
          <ul class="sources-list">
            ${response.sources.map(source => `
              <li id="${escapeHtml(source.id)}" class="source-item">
                <span class="source-id">[${escapeHtml(source.id)}]</span>
                <div class="source-content">
                  <p class="source-name">${escapeHtml(source.source)} ${source.type ? `(${escapeHtml(source.type)})` : ''}</p>
                  ${source.text ? `<p class="source-text">${escapeHtml(source.text)}</p>` : ''}
                  ${source.url ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer" class="source-link">View Source</a>` : ''}
                </div>
              </li>`).join('')}
          </ul>
        </div>`;
    }

    if (includeDisclaimer) {
      html += `
        <div class="section disclaimer">
          <h3>Disclaimer</h3>
          <p>${escapeHtml(response.metadata.disclaimer)}</p>
        </div>`;
    }

    html += `
      </div>
      <style>
        /* Basic styling - can be expanded */
        .compliance-report { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: auto; padding: 15px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
        .report-header h1 { color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .metadata, .query { color: #718096; font-size: 0.9rem; margin-bottom: 0.5rem; }
        .section { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
        .section:last-child { border-bottom: none; }
        h2 { color: #2a4365; margin-top: 0; margin-bottom: 0.75rem; }
        h3 { color: #4a5568; margin-top: 0; margin-bottom: 0.5rem; }
        ul { padding-left: 20px; margin-top: 0.5rem; }
        li { margin-bottom: 0.75rem; }
        .confidence-badge, .severity-badge { display: inline-block; padding: 0.2em 0.6em; border-radius: 10px; font-size: 0.75em; font-weight: bold; margin-left: 0.5em; white-space: nowrap; }
        .confidence-badge.high { background-color: #c6f6d5; color: #2f855a; }
        .confidence-badge.medium { background-color: #fefcbf; color: #b7791f; }
        .confidence-badge.low { background-color: #fed7d7; color: #c53030; }
        .confidence-badge.uncertain { background-color: #e2e8f0; color: #4a5568; }
        .severity-badge.high { background-color: #fed7d7; color: #c53030; }
        .severity-badge.medium { background-color: #fefcbf; color: #b7791f; }
        .severity-badge.low { background-color: #c6f6d5; color: #2f855a; }
        .source-citations { font-size: 0.8em; color: #4a5568; margin-top: 0.5rem; padding-left: 1rem; border-left: 2px solid #e2e8f0; }
        .source-citations strong { display: block; margin-bottom: 0.25rem; }
        .source-citations ul { list-style: none; padding-left: 0; }
        .source-citations li { margin-bottom: 0.25rem; }
        .source-id { font-weight: bold; margin-right: 0.5em; }
        .source-link { margin-left: 0.5em; }
        .sources-list { list-style: none; padding-left: 0; }
        .source-item { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px dashed #eee; }
        .source-item:last-child { border-bottom: none; }
        .source-content { margin-left: 1em; }
        .source-name { font-weight: bold; }
        .source-type { font-style: italic; color: #718096; }
        .disclaimer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 0.85rem; color: #718096; }
      </style>
      `;
      
    return html;
  } catch (error) {
    logger.error('Error exporting response as HTML:', error);
    return `<p>Error generating HTML report: ${escapeHtml(error instanceof Error ? error.message : String(error))}</p>`;
  }
}

// --- Markdown Export Functions --- 

function getConfidenceBadgeMd(level: ConfidenceLevel): string {
  return `**${level} Confidence**`;
}

function getSeverityBadgeMd(severity: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  return `**${severity} Severity**`;
}

function getSourceCitationsMd(sourceIds: string[], sources: AttributedSource[]): string {
  if (!sourceIds || sourceIds.length === 0) return '';
  const citedSources = sources.filter(source => sourceIds.includes(source.id));
  if (citedSources.length === 0) return '';

  return `
> **Sources:**
${citedSources.map(source => 
  `> - [${source.id}] ${source.url ? 
    `[${source.source}](${source.url})` : 
    `${source.source}`}
>   (${source.type})${source.text ? `: ${source.text}` : ''}`
).join('\n')}`; 
}

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
    
    let md = `# Compliance Analysis Report\n\n`;

    if (includeMetadata) {
      md += `**Generated:** ${new Date(response.metadata.generatedAt).toLocaleString()}\n`;
      md += `**Query:** ${response.metadata.query}\n\n`;
    }

    md += `## Summary\n\n${response.summary}\n`;
    if (includeConfidenceIndicators) {
      md += `${getConfidenceBadgeMd(response.overallConfidence)}\n`;
    }
    md += `\n`;

    const sections = [
      { title: 'Key Findings', items: response.keyFindings },
      { title: 'Legal Obligations', items: response.obligations },
      { title: 'Recent Changes', items: response.recentChanges },
      { title: 'Compliance Risks', items: response.risks },
    ];

    sections.forEach(section => {
      md += `## ${section.title}\n\n`;
      if (section.items.length > 0) {
        section.items.forEach(item => {
          md += `- ${item.text}\n`;
          if ('severity' in item && item.severity) {
             md += `  ${getSeverityBadgeMd(item.severity)}\n`;
          }
          if ('effectiveDate' in item && item.effectiveDate) {
             md += `  (Effective: ${item.effectiveDate})\n`;
          }
          if (includeConfidenceIndicators) {
             md += `  ${getConfidenceBadgeMd(item.confidence)}\n`;
          }
          if (includeSources) {
            md += `${getSourceCitationsMd(item.sourceIds, response.sources)}\n`;
          }
          md += `\n`;
        });
      } else {
        md += `N/A\n\n`;
      }
    });

    if (response.jurisdictionalNotes) {
      md += `## Jurisdictional Notes\n\n${response.jurisdictionalNotes}\n\n`;
    }

    if (includeSources && response.sources.length > 0) {
      md += `## Sources\n\n`;
      response.sources.forEach(source => {
        md += `- **[${source.id}] ${source.source}** (${source.type})\n`;
        if (source.text) md += `  - ${source.text}\n`;
        if (source.url) md += `  - [View Source](${source.url})\n`;
      });
      md += `\n`;
    }

    if (includeDisclaimer) {
      md += `## Disclaimer\n\n${response.metadata.disclaimer}\n`;
    }

    return md;
  } catch (error) {
    logger.error('Error exporting response as Markdown:', error);
    return `# Error Generating Report\n\n${error instanceof Error ? error.message : String(error)}`;
  }
}

// --- Client JSON Export Functions --- 

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

    // Create a deep copy to avoid modifying the original object
    const clientResponse = JSON.parse(JSON.stringify(response));

    // Selectively remove fields based on options
    if (!includeMetadata) {
      delete clientResponse.metadata;
    } else if (!includeDisclaimer && clientResponse.metadata) {
      delete clientResponse.metadata.disclaimer;
    }

    if (!includeSources) {
      delete clientResponse.sources;
      // Remove sourceIds from findings if sources are excluded
      clientResponse.keyFindings?.forEach((item: any) => delete item.sourceIds);
      clientResponse.obligations?.forEach((item: any) => delete item.sourceIds);
      clientResponse.recentChanges?.forEach((item: any) => delete item.sourceIds);
      clientResponse.risks?.forEach((item: any) => delete item.sourceIds);
    }

    if (!includeConfidenceIndicators) {
      delete clientResponse.overallConfidence;
      clientResponse.keyFindings?.forEach((item: any) => delete item.confidence);
      clientResponse.obligations?.forEach((item: any) => delete item.confidence);
      clientResponse.recentChanges?.forEach((item: any) => delete item.confidence);
      clientResponse.risks?.forEach((item: any) => delete item.confidence);
    }

    return clientResponse;
  } catch (error) {
    logger.error('Error exporting response as client JSON:', error);
    // Return a structured error object
    return {
      error: true,
      message: 'Failed to generate client JSON response',
      details: error instanceof Error ? error.message : String(error)
    };
  }
} 