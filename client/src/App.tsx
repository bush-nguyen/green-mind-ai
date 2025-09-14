import React, { useState, useCallback } from 'react';
import { Search, TrendingUp, BarChart3, CheckCircle, Leaf } from 'lucide-react';
import Dashboard from './components/Dashboard';
import { QueryResponse, ModelSuggestion } from './types';
import './App.css';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}


// Removed preferences - now using auto-suggested model only

function App() {
  const [query, setQuery] = useState('');
  // Removed preference selection - now using auto-suggested model only
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryResponse[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [modelSuggestion, setModelSuggestion] = useState<ModelSuggestion | null>(null);
  const [suggestedModel, setSuggestedModel] = useState<string | null>(null);
  const [showModelSelection, setShowModelSelection] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Get model suggestion as user types
  const getModelSuggestion = useCallback(async (queryText: string) => {
    if (queryText.trim().length < 10) {
      setModelSuggestion(null);
      setSuggestedModel(null);
      setShowModelSelection(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/suggest-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText }),
      });

      if (response.ok) {
        const data = await response.json();
        setModelSuggestion(data.suggestion);
        setSuggestedModel(data.suggestion.suggested_model);
        setShowModelSelection(true);
      }
    } catch (error) {
      console.error('Error getting model suggestion:', error);
    }
  }, [API_BASE_URL]);

  // Debounced model suggestion
  const debouncedGetSuggestion = useCallback(
    debounce((queryText: string) => {
      getModelSuggestion(queryText);
    }, 1000),
    [getModelSuggestion]
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedGetSuggestion(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // If no suggested model, get one first
      let modelToUse = suggestedModel;
      if (!modelToUse) {
        try {
          const suggestionRes = await fetch(`${API_BASE_URL}/api/suggest-model`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query.trim() }),
          });
          
          if (suggestionRes.ok) {
            const suggestionData = await suggestionRes.json();
            modelToUse = suggestionData.suggestion.suggested_model;
          }
        } catch (suggestionError) {
          console.error('Error getting suggestion:', suggestionError);
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          suggested_model: modelToUse
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setQueryHistory(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 queries
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
  <Leaf className="w-8 h-8 text-green-600" />
  <a href="/" className="text-2xl font-bold text-gray-900 hover:underline">
    Green Mind AI
  </a>
</div>
            
            <button
              onClick={() => setShowDashboard(true)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showDashboard ? (
          <div className="center-content">
            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6 w-full max-w-4xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Ask a Question</h2>
              
              <form onSubmit={handleSubmit} className="center-form">
                <div className="search-container">
                  <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Enter a prompt or question..."
                    className="search-input px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="search-button bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>

                {/* Model Suggestion */}
                {showModelSelection && modelSuggestion && (
                  <div className="w-full max-w-2xl mx-auto mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg model-suggestion">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">
                          🧠 Smart Model Selection
                        </h4>
                        <p className="text-sm text-blue-800 mb-2">
                          {modelSuggestion.reason}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-blue-700">
                              Suggested: {modelSuggestion.suggested_model === 'simple' ? 'Simple Model' : 'Claude Haiku'}
                            </span>
                            {modelSuggestion.carbon_savings !== '0%' && (
                              <span className="text-xs text-green-600 font-medium">
                                💚 {modelSuggestion.carbon_savings} less CO₂
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setShowModelSelection(false)}
                              className="text-xs text-blue-600 hover:text-blue-800 underline suggestion-button"
                            >
                              Use this model
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowModelSelection(false)}
                              className="text-xs text-gray-500 hover:text-gray-700 suggestion-button"
                            >
                              Choose manually
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-suggested model info */}
                {modelSuggestion && (
                  <div className="w-full max-w-2xl mx-auto mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 text-sm text-green-800">
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        Using {modelSuggestion.suggested_model === 'simple' ? 'Simple Model' : 'Claude Haiku'} 
                        {modelSuggestion.carbon_savings !== '0%' && (
                          <span className="ml-1 font-medium">({modelSuggestion.carbon_savings} less CO₂)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </form>

              {loading && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-blue-700">Processing your query...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">Error: {error}</p>
                </div>
              )}
            </div>

            {/* Response Section */}
            {response && (
              <div className="bg-white rounded-lg shadow-sm border p-6 w-full max-w-4xl mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Response</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <span>Model:</span>
                      <span className="font-medium">{response.model_used}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>Tokens:</span>
                      <span className="font-medium">{response.tokens_used}</span>
                    </span>
                  </div>
                </div>

                <div className="prose max-w-none mb-6">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">{response.response}</div>
                </div>

                {/* Carbon Impact Transparency */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Environmental Impact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Carbon Impact:</span>
                      <span className="ml-2 font-medium">
                        {response.carbon_footprint_grams}mg CO₂
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">Tokens Used:</span>
                      <span className="ml-2 font-medium">{response.tokens_used}</span>
                    </div>
                    <div>
                      <span className="text-green-700">Savings:</span>
                      <span className="ml-2 font-medium text-green-600">
                        150mg CO₂ CO₂
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    Minimal environmental impact
                  </div>
                </div>
              </div>
            )}

            {/* Query History */}
            {queryHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6 w-full max-w-4xl mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Queries</h3>
                <div className="space-y-3">
                  {queryHistory.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium">{item.model_used}</span>
                          <span className="text-gray-500">•</span>
                          <span className="capitalize">{item.preference}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-green-600">
                            {item.carbon_footprint_grams}mg CO₂
                          </span>
                        </div>
                      </div>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Dashboard queryHistory={queryHistory} />
        )}
      </div>
    </div>
  );
}

export default App;
