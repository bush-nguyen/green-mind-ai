# 🏗️ Eco-LLM Switcher Architecture

## System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Node.js Backend │    │   LLM APIs      │
│                 │    │                 │    │                 │
│ • Search Bar    │◄──►│ • Express API   │◄──►│ • Claude API    │
│ • Carbon Slider │    │ • Classifier    │    │ • OpenAI API    │
│ • Dashboard     │    │ • Model Router  │    │ • Anthropic     │
│ • Transparency  │    │ • Carbon Calc   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Architecture

### Frontend (React + TypeScript)
```
src/
├── App.tsx                 # Main application component
├── components/
│   └── Dashboard.tsx      # Analytics dashboard
└── App.css               # Styling with Tailwind CSS
```

### Backend (Node.js + Express)
```
server/
├── index.js              # Main server entry point
├── src/
│   ├── classifier.js     # Query complexity analysis
│   ├── router.js         # Model selection & API routing
│   └── carbonCalculator.js # CO₂ impact estimation
└── package.json
```

## Data Flow

1. **User Input**: User enters query and selects preference
2. **Complexity Analysis**: Backend classifies query complexity
3. **Model Selection**: Router selects appropriate model based on:
   - Query complexity (simple/moderate/complex)
   - User preference (sustainability/speed/accuracy)
4. **API Call**: Selected model processes the query
5. **Carbon Calculation**: System estimates environmental impact
6. **Response**: User receives answer with transparency tags
7. **Dashboard Update**: Analytics track cumulative impact

## Model Selection Logic

### Complexity Classification
- **Simple**: < 50 tokens, basic keywords, single question
- **Moderate**: 50-200 tokens, some analysis keywords
- **Complex**: > 200 tokens, technical keywords, multiple parts

### Preference Routing
- **Sustainability**: Always choose lowest carbon model for complexity level
- **Speed**: Choose fastest model for complexity level  
- **Accuracy**: May override complexity to use larger models

### Available Models
- **Small**: Claude Haiku, GPT-4o Mini (0.02g CO₂/1k tokens)
- **Medium**: Claude Sonnet (0.05g CO₂/1k tokens)
- **Large**: Claude Opus, GPT-4o (0.15g CO₂/1k tokens)

## API Endpoints

### POST /api/query
```json
{
  "query": "What is machine learning?",
  "preference": "sustainability"
}
```

### Response
```json
{
  "response": "Machine learning is...",
  "metadata": {
    "modelUsed": "Claude Haiku",
    "complexity": "simple",
    "carbonImpact": {
      "totalCO2": 0.004,
      "tokens": 200,
      "equivalent": {...}
    },
    "savings": 0.026,
    "preference": "sustainability"
  }
}
```

## Carbon Impact Calculation

### Formula
```
CO₂ Impact = (Tokens / 1000) × Carbon Factor
```

### Environmental Equivalents
- Car miles: 0.411 kg CO₂ per mile
- Phone charges: 0.0008 kg CO₂ per charge
- Google searches: 0.0002 kg CO₂ per search

## Deployment Options

### Development
```bash
npm run dev  # Runs both frontend and backend
```

### Production
```bash
# Frontend: Vercel
npm run build  # Builds React app

# Backend: Vercel/Render/Railway
npm start      # Starts Express server
```

### Docker
```bash
docker-compose up  # Full stack deployment
```

## Security & Performance

### Security
- Helmet.js for security headers
- CORS configuration
- Environment variable protection
- Input validation

### Performance
- Concurrent requests handling
- Model fallback on errors
- Efficient token estimation
- Caching-ready architecture

## Monitoring & Analytics

### Metrics Tracked
- Query complexity distribution
- Model usage patterns
- Carbon savings over time
- User preference trends

### Dashboard Features
- Cumulative CO₂ savings
- Model performance metrics
- Environmental impact visualization
- Usage analytics

---

This architecture enables intelligent, sustainable AI usage while maintaining transparency and user control over environmental impact.
