import React from 'react';
import { Leaf, Zap, Target, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { QueryResponse } from '../types';

interface DashboardProps {
  queryHistory: QueryResponse[];
}

const Dashboard: React.FC<DashboardProps> = ({ queryHistory }) => {
  // Calculate cumulative metrics
  const totalQueries = queryHistory.length;
  const totalCO2 = queryHistory.reduce((sum, query) => sum + query.carbon_footprint_grams, 0);
  const totalSavings = queryHistory.reduce((sum, query) => sum + (query.model_used === 'simple' ? 150 : 0), 0); // Approximate savings
  const averageCO2PerQuery = totalQueries > 0 ? totalCO2 / totalQueries : 0;

  // Model usage statistics
  const modelUsage = queryHistory.reduce((acc, query) => {
    const model = query.model_used;
    acc[model] = (acc[model] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Preference distribution
  const preferenceUsage = queryHistory.reduce((acc, query) => {
    const preference = query.preference;
    acc[preference] = (acc[preference] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatCarbonImpact = (co2Grams: number) => {
    if (co2Grams < 1) {
      return `${Math.round(co2Grams * 1000)}mg CO₂`;
    }
    return `${Math.round(co2Grams * 1000) / 1000}g CO₂`;
  };

  const getEquivalentMessage = (co2Grams: number) => {
    const carMiles = (co2Grams / 1000) / 0.411; // kg CO2 per mile
    const phoneCharges = (co2Grams / 1000) / 0.0008;
    
    if (carMiles > 0.01) {
      return `Equivalent to driving ${Math.round(carMiles * 100) / 100} miles`;
    } else if (phoneCharges > 1) {
      return `Equivalent to ${Math.round(phoneCharges)} phone charges`;
    } else {
      return 'Minimal environmental impact';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          Carbon Impact Dashboard
        </h2>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{totalQueries}</div>
            <div className="text-sm text-green-600">Total Queries</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{formatCarbonImpact(totalCO2)}</div>
            <div className="text-sm text-blue-600">Total CO₂ Used</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{formatCarbonImpact(totalSavings)}</div>
            <div className="text-sm text-yellow-600">CO₂ Saved</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{formatCarbonImpact(averageCO2PerQuery)}</div>
            <div className="text-sm text-purple-600">Avg per Query</div>
          </div>
        </div>

        {/* Environmental Impact */}
        {totalSavings > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-green-900 mb-2">🌍 Environmental Impact</h3>
            <p className="text-green-700">
              You've saved {formatCarbonImpact(totalSavings)} CO₂ by using Eco-LLM Switcher!
            </p>
            <p className="text-sm text-green-600 mt-1">
              {getEquivalentMessage(totalSavings)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model Usage */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Model Usage
            </h3>
            <div className="space-y-2">
              {Object.entries(modelUsage).map(([model, count]) => (
                <div key={model} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{model}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preference Distribution */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Selection Method
            </h3>
            <div className="space-y-2">
              {Object.entries(preferenceUsage).map(([preference, count]) => {
                const IconComponent = preference === 'auto-suggested' ? Target : Leaf;
                return (
                  <div key={preference} className="flex justify-between items-center">
                    <div className="text-sm text-gray-600 flex items-center">
                      <IconComponent className="w-4 h-4" />
                      <span className="ml-2 capitalize">{preference.replace('-', ' ')}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {queryHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {queryHistory.slice(0, 10).map((query, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium">{query.model_used}</span>
                      <span className="text-gray-500">•</span>
                      <span className="capitalize">{query.preference}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-green-600">
                        {query.carbon_footprint_grams}mg CO₂
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {query.tokens_used} tokens used
                    </div>
                  </div>
                  <div className="text-xs text-green-600">
                    {query.model_used === 'simple' ? 'Saved 150mg CO₂' : 'Standard usage'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
