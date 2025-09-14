const axios = require('axios');

/**
 * Model Router - Handles dynamic model selection and API routing
 */
class ModelRouter {
  constructor() {
    this.models = {
      'claude-haiku': {
        name: 'Claude Haiku',
        size: 'small',
        provider: 'anthropic',
        carbonFactor: parseFloat(process.env.CARBON_FACTOR_SMALL) || 0.02,
        speed: 'fast',
        cost: 'low',
        capabilities: ['simple-qa', 'summarization', 'classification']
      },
      'claude-sonnet': {
        name: 'Claude Sonnet',
        size: 'medium',
        provider: 'anthropic',
        carbonFactor: parseFloat(process.env.CARBON_FACTOR_MEDIUM) || 0.05,
        speed: 'medium',
        cost: 'medium',
        capabilities: ['analysis', 'reasoning', 'creative-writing', 'coding']
      },
      'claude-opus': {
        name: 'Claude Opus',
        size: 'large',
        provider: 'anthropic',
        carbonFactor: parseFloat(process.env.CARBON_FACTOR_LARGE) || 0.15,
        speed: 'slow',
        cost: 'high',
        capabilities: ['complex-reasoning', 'advanced-coding', 'creative-generation', 'analysis']
      },
      'gpt-4o-mini': {
        name: 'GPT-4o Mini',
        size: 'small',
        provider: 'openai',
        carbonFactor: parseFloat(process.env.CARBON_FACTOR_SMALL) || 0.02,
        speed: 'fast',
        cost: 'low',
        capabilities: ['simple-qa', 'summarization', 'classification']
      },
      'gpt-4o': {
        name: 'GPT-4o',
        size: 'large',
        provider: 'openai',
        carbonFactor: parseFloat(process.env.CARBON_FACTOR_LARGE) || 0.15,
        speed: 'slow',
        cost: 'high',
        capabilities: ['complex-reasoning', 'advanced-coding', 'creative-generation', 'analysis']
      }
    };

    this.apiEndpoints = {
      anthropic: 'https://api.anthropic.com/v1/messages',
      openai: 'https://api.openai.com/v1/chat/completions'
    };
  }

  /**
   * Select appropriate model based on complexity and user preference
   * @param {object} complexity - Complexity analysis result
   * @param {string} preference - User preference (sustainability, speed, accuracy)
   * @returns {object} Selected model configuration
   */
  selectModel(complexity, preference) {
    const recommendedSize = complexity.recommendedModel;
    
    // Get models by size
    const smallModels = Object.values(this.models).filter(m => m.size === 'small');
    const mediumModels = Object.values(this.models).filter(m => m.size === 'medium');
    const largeModels = Object.values(this.models).filter(m => m.size === 'large');
    
    let selectedModel;
    
    switch (preference) {
      case 'sustainability':
        // Always choose the lowest carbon option for the complexity level
        if (recommendedSize === 'small') {
          selectedModel = smallModels.reduce((min, model) => 
            model.carbonFactor < min.carbonFactor ? model : min
          );
        } else if (recommendedSize === 'medium') {
          selectedModel = mediumModels.reduce((min, model) => 
            model.carbonFactor < min.carbonFactor ? model : min
          );
        } else {
          selectedModel = largeModels.reduce((min, model) => 
            model.carbonFactor < min.carbonFactor ? model : min
          );
        }
        break;
        
      case 'speed':
        // Choose fastest model for the complexity level
        if (recommendedSize === 'small') {
          selectedModel = smallModels.find(m => m.speed === 'fast') || smallModels[0];
        } else if (recommendedSize === 'medium') {
          selectedModel = mediumModels.find(m => m.speed === 'fast') || mediumModels[0];
        } else {
          selectedModel = largeModels.find(m => m.speed === 'fast') || largeModels[0];
        }
        break;
        
      case 'accuracy':
        // Choose highest capability model (may override complexity recommendation)
        if (complexity.score >= 3) {
          selectedModel = largeModels[0]; // Force to large model for accuracy
        } else if (complexity.score >= 1) {
          selectedModel = mediumModels[0]; // Use medium for moderate complexity
        } else {
          selectedModel = smallModels[0];
        }
        break;
        
      default:
        // Default to recommended model based on complexity
        const modelsBySize = { small: smallModels, medium: mediumModels, large: largeModels };
        selectedModel = modelsBySize[recommendedSize][0];
    }
    
    // Find the model key for the selected model
    const modelKey = Object.keys(this.models).find(key => this.models[key] === selectedModel);
    
    return {
      ...selectedModel,
      key: modelKey,
      reasoning: this.getSelectionReasoning(complexity, preference, selectedModel)
    };
  }

  /**
   * Get reasoning for model selection
   */
  getSelectionReasoning(complexity, preference, selectedModel) {
    const reasons = [];
    
    reasons.push(`Query complexity: ${complexity.level} (score: ${complexity.score})`);
    
    switch (preference) {
      case 'sustainability':
        reasons.push(`Selected ${selectedModel.name} for lowest carbon impact (${selectedModel.carbonFactor}g CO2/1k tokens)`);
        break;
      case 'speed':
        reasons.push(`Selected ${selectedModel.name} for fastest response time`);
        break;
      case 'accuracy':
        reasons.push(`Selected ${selectedModel.name} for highest accuracy on ${complexity.level} tasks`);
        break;
    }
    
    return reasons.join('. ');
  }

  /**
   * Get response from selected model
   * @param {object} model - Selected model configuration
   * @param {string} query - User query
   * @returns {object} Model response with metadata
   */
  async getResponse(model, query) {
    try {
      const startTime = Date.now();
      
      let response;
      if (model.provider === 'anthropic') {
        response = await this.callAnthropicAPI(model.key, query);
      } else if (model.provider === 'openai') {
        response = await this.callOpenAIAPI(model.key, query);
      } else {
        throw new Error(`Unsupported provider: ${model.provider}`);
      }
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        content: response.content,
        model: model.name,
        responseTime,
        tokens: response.tokens || this.estimateTokens(query + response.content),
        metadata: {
          provider: model.provider,
          modelKey: model.key,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error(`Error calling ${model.name}:`, error);
      
      // Fallback to a simpler model if the primary fails
      const fallbackModel = this.getFallbackModel(model);
      if (fallbackModel && fallbackModel.key !== model.key) {
        console.log(`Falling back to ${fallbackModel.name}`);
        return await this.getResponse(fallbackModel, query);
      }
      
      throw error;
    }
  }

  /**
   * Call Anthropic API
   */
  async callAnthropicAPI(modelKey, query) {
    const response = await axios.post(
      this.apiEndpoints.anthropic,
      {
        model: modelKey,
        max_tokens: 1000,
        messages: [{ role: 'user', content: query }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    return {
      content: response.data.content[0].text,
      tokens: response.data.usage?.total_tokens
    };
  }

  /**
   * Call OpenAI API
   */
  async callOpenAIAPI(modelKey, query) {
    const response = await axios.post(
      this.apiEndpoints.openai,
      {
        model: modelKey,
        messages: [{ role: 'user', content: query }],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      content: response.data.choices[0].message.content,
      tokens: response.data.usage?.total_tokens
    };
  }

  /**
   * Get fallback model for error recovery
   */
  getFallbackModel(failedModel) {
    if (failedModel.size === 'large') {
      return Object.values(this.models).find(m => m.size === 'medium');
    } else if (failedModel.size === 'medium') {
      return Object.values(this.models).find(m => m.size === 'small');
    }
    return null;
  }

  /**
   * Estimate tokens (rough approximation)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get all available models
   */
  getAvailableModels() {
    return Object.entries(this.models).map(([key, model]) => ({
      key,
      ...model
    }));
  }
}

module.exports = new ModelRouter();
