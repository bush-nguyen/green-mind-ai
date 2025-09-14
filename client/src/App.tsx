import React, { useState } from 'react';
import { Search, Leaf, Zap, Target, TrendingUp, BarChart3 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import './App.css';

// Types
interface QueryResponse {
  response: string;
  metadata: {
    modelUsed: string;
    complexity: string;
    carbonImpact: {
      tokens: number;
      carbonFactor: number;
      totalCO2: number;
      equivalent: any;
      model: string;
    };
    savings: number;
    preference: string;
    timestamp: string;
  };
}

interface Preference {
  id: 'sustainability' | 'speed' | 'accuracy';
  name: string;
  icon: React.ReactNode;
  description: string;
}

const preferences: Preference[] = [
  {
    id: 'sustainability',
    name: 'Sustainability',
    icon: <Leaf className="w-6 h-6" />,
    description: 'Prioritize lowest carbon impact'
  },
  {
    id: 'speed',
    name: 'Speed',
    icon: <Zap className="w-6 h-6" />,
    description: 'Optimize for fastest response'
  },
  {
    id: 'accuracy',
    name: 'Accuracy',
    icon: <Target className="w-6 h-6" />,
    description: 'Maximize output quality'
  }
];

function App() {
  const [query, setQuery] = useState('');
  const [selectedPreference, setSelectedPreference] = useState<'sustainability' | 'speed' | 'accuracy'>('sustainability');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryResponse[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          preference: selectedPreference,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setQueryHistory(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 queries
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCarbonImpact = (co2Grams: number) => {
    if (co2Grams < 1) {
      return `${Math.round(co2Grams * 1000)}mg CO₂`;
    }
    return `${Math.round(co2Grams * 1000) / 1000}g CO₂`;
  };

  const getEquivalentMessage = (equivalent: any) => {
    if (equivalent.carMiles > 0.01) {
      return `Equivalent to driving ${equivalent.carMiles} miles`;
    } else if (equivalent.phoneCharges > 1) {
      return `Equivalent to ${equivalent.phoneCharges} phone charges`;
    } else if (equivalent.googleSearches > 1) {
      return `Equivalent to ${equivalent.googleSearches} Google searches`;
    } else {
      return 'Minimal environmental impact';
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
              onClick={() => setShowDashboard(!showDashboard)}
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
          <div className="space-y-8">
            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ask a Question</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4" style={{ maxWidth: '800px' }}>
                <div className="search-container">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
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

                {/* Carbon Slider */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Choose your priority:
                  </label>
                  <div className="flex space-x-4">
                    {preferences.map((pref) => (
                      <button
                        key={pref.id}
                        onClick={() => setSelectedPreference(pref.id)}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          selectedPreference === pref.id
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {pref.icon}
                        <div className="text-left">
                          <div className="font-medium">{pref.name}</div>
                          <div className="text-xs opacity-75">{pref.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
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
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Response</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <span>Model:</span>
                      <span className="font-medium">{response.metadata.modelUsed}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>Complexity:</span>
                      <span className="font-medium capitalize">{response.metadata.complexity}</span>
                    </span>
                  </div>
                </div>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 leading-relaxed">{response.response}</p>
                </div>

                {/* Carbon Impact Transparency */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Environmental Impact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Carbon Impact:</span>
                      <span className="ml-2 font-medium">
                        {formatCarbonImpact(response.metadata.carbonImpact.totalCO2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">Tokens Used:</span>
                      <span className="ml-2 font-medium">{response.metadata.carbonImpact.tokens}</span>
                    </div>
                    <div>
                      <span className="text-green-700">Savings:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatCarbonImpact(response.metadata.savings)} CO₂
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    {getEquivalentMessage(response.metadata.carbonImpact.equivalent)}
                  </div>
                </div>
              </div>
            )}

            {/* Query History */}
            {queryHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Queries</h3>
                <div className="space-y-3">
                  {queryHistory.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium">{item.metadata.modelUsed}</span>
                          <span className="text-gray-500">•</span>
                          <span className="capitalize">{item.metadata.complexity}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-green-600">
                            {formatCarbonImpact(item.metadata.carbonImpact.totalCO2)}
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
