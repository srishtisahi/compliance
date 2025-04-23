import React from 'react';
import { ComplianceAnalysisResult } from '../types/api.types';

interface ComplianceAnalysisResultProps {
  /** The analysis result to display */
  result: ComplianceAnalysisResult;
  /** Optional className for styling */
  className?: string;
}

/**
 * Component to display compliance analysis results in a structured format
 */
export const ComplianceAnalysisDisplay: React.FC<ComplianceAnalysisResultProps> = ({
  result,
  className = '',
}) => {
  if (!result) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Section */}
      {result.summary && (
        <section className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Summary</h2>
          <p className="text-gray-600">{result.summary}</p>
        </section>
      )}

      {/* Obligations Section */}
      {result.obligations && result.obligations.length > 0 && (
        <section className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Key Legal Obligations</h2>
          <ul className="list-disc pl-5 space-y-2">
            {result.obligations.map((obligation, index) => (
              <li key={index} className="text-gray-600">{obligation}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent Changes Section */}
      {result.recentChanges && result.recentChanges.length > 0 && (
        <section className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Recent Regulatory Changes</h2>
          <ul className="list-disc pl-5 space-y-2">
            {result.recentChanges.map((change, index) => (
              <li key={index} className="text-gray-600">{change}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Citations Section */}
      {result.citations && result.citations.length > 0 && (
        <section className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Citations</h2>
          <div className="space-y-3">
            {result.citations.map((citation, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <p className="text-gray-600 italic">{citation.text}</p>
                <p className="text-sm text-gray-500 mt-1">Source: {citation.source}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Risks Section */}
      {result.risks && result.risks.length > 0 && (
        <section className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Compliance Risks</h2>
          <ul className="list-disc pl-5 space-y-2">
            {result.risks.map((risk, index) => (
              <li key={index} className="text-gray-600">{risk}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Raw Text (Hidden by Default) */}
      {result.text && (
        <details className="bg-white rounded-lg p-6 shadow-md">
          <summary className="text-xl font-semibold text-gray-800 cursor-pointer">
            Raw Response
          </summary>
          <div className="mt-3 p-4 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap font-mono text-sm">
            {result.text}
          </div>
        </details>
      )}
    </div>
  );
}; 