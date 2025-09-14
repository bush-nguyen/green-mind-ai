const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const complexityClassifier = require('./src/classifier');
const modelRouter = require('./src/router');
const carbonCalculator = require('./src/carbonCalculator');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.post('/api/query', async (req, res) => {
  try {
    const { query, preference = 'sustainability' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Classify query complexity
    const complexity = complexityClassifier.classify(query);
    
    // Select appropriate model based on complexity and preference
    const selectedModel = modelRouter.selectModel(complexity, preference);
    
    // Get response from selected model
    const response = await modelRouter.getResponse(selectedModel, query);
    
    // Calculate carbon impact
    const carbonImpact = carbonCalculator.calculate(response, selectedModel);
    
    // Calculate savings compared to always using large model
    const largeModelImpact = carbonCalculator.calculate(response, 'claude-opus');
    const savings = largeModelImpact.totalCO2 - carbonImpact.totalCO2;
    
    res.json({
      response: response.content,
      metadata: {
        modelUsed: selectedModel.name,
        complexity: complexity.level,
        carbonImpact,
        savings,
        preference,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ 
      error: 'Failed to process query',
      message: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get available models and their carbon factors
app.get('/api/models', (req, res) => {
  const models = modelRouter.getAvailableModels();
  res.json(models);
});

// Get carbon factors
app.get('/api/carbon-factors', (req, res) => {
  const factors = carbonCalculator.getCarbonFactors();
  res.json(factors);
});

app.listen(PORT, () => {
  console.log(`🌍 Eco-LLM Switcher server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
