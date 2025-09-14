// Shared types for the Eco-LLM Switcher application

export interface QueryResponse {
  prompt: string;
  response: string;
  model_used: string;
  tokens_used: number;
  carbon_footprint_grams: number;
  preference: string;
}

export interface ModelSuggestion {
  suggested_model: string;
  confidence: string;
  reason: string;
  carbon_savings: string;
}
