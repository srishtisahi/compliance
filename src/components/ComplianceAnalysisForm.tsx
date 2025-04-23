import React, { useState, FormEvent } from 'react';
import { useComplianceAnalysis } from '../hooks/useComplianceAnalysis';
import { ComplianceAnalysisDisplay } from './ComplianceAnalysisResult';
import { TextAnalysisRequest } from '../types/api.types';

/**
 * Form component for compliance analysis
 */
export const ComplianceAnalysisForm: React.FC = () => {
  const [query, setQuery] = useState('');
  const [context, setContext] = useState('');
  const { result, isLoading, error, analyzeText, reset } = useComplianceAnalysis();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const request: TextAnalysisRequest = {
      query,
      context
    };

    await analyzeText(request);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Construction Compliance Analysis</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
            What compliance information are you looking for?
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="E.g., What are the recent changes to California building codes?"
            required
          />
        </div>
        
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
            Additional context (optional)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional context that might help with the analysis..."
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
          
          {result && (
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              New Analysis
            </button>
          )}
        </div>
      </form>
      
      {error && (
        <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {result && <ComplianceAnalysisDisplay result={result} />}
    </div>
  );
}; 