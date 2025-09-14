# 🌍 Eco-LLM Switcher

A middleware application that reduces the carbon footprint of AI usage by dynamically selecting the most efficient large language model (LLM) for each user query. Instead of always routing to heavy models, the system intelligently switches between small, medium, and large models based on query complexity and user preferences.

## 🎯 Features

### Core Features
- **Intelligent Model Routing**: Automatically selects appropriate model size based on query complexity
- **Carbon Slider UI**: Choose between Sustainability, Speed, or Accuracy priorities
- **Real-time Carbon Tracking**: Shows estimated CO₂ impact for each query
- **Transparency Tags**: Display which model was used and environmental impact
- **Query History**: Track your AI usage and carbon savings over time

### Advanced Features
- **Complexity Classifier**: Rule-based system that analyzes query complexity
- **Dynamic Model Switching**: Routes to Claude Haiku/Sonnet/Opus and GPT models
- **Carbon Impact Dashboard**: Visualize cumulative savings and usage patterns
- **Environmental Equivalents**: Compare AI usage to real-world activities

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- API keys for Anthropic and/or OpenAI

### Installation

1. **Clone and setup the project:**
```bash
git clone <repository-url>
cd eco-llm-switcher
npm install
```

2. **Configure environment variables:**
```bash
cd server
cp env.example .env
```

Edit `.env` with your API keys:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

3. **Install server dependencies:**
```bash
cd server
npm install
```

4. **Install client dependencies:**
```bash
cd client
npm install
```

### Running the Application

**Option 1: Run both server and client together:**
```bash
npm run dev
```

**Option 2: Run separately:**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🎮 How to Use

1. **Enter a Query**: Type your question or prompt in the search bar
2. **Choose Priority**: Use the carbon slider to select your preference:
   - 🌍 **Sustainability**: Lowest carbon impact
   - ⚡ **Speed**: Fastest response time
   - 🎯 **Accuracy**: Highest quality output
3. **Get Response**: Receive AI response with transparency tags showing:
   - Model used
   - Query complexity
   - Carbon impact
   - Environmental savings

## 🏗️ Architecture

### Backend (`/server`)
- **Express.js API** with CORS and security middleware
- **Complexity Classifier** (`/src/classifier.js`) - Rule-based query analysis
- **Model Router** (`/src/router.js`) - Dynamic LLM selection and API routing
- **Carbon Calculator** (`/src/carbonCalculator.js`) - CO₂ impact estimation

### Frontend (`/client`)
- **React + TypeScript** with modern UI components
- **Tailwind CSS** for responsive styling
- **Lucide React** for icons
- **Dashboard** component for analytics visualization

### API Endpoints
- `POST /api/query` - Process user queries with model routing
- `GET /api/models` - Get available models and their configurations
- `GET /api/carbon-factors` - Get carbon emission factors
- `GET /health` - Health check endpoint

## 🔧 Configuration

### Model Configuration
Models are configured in `/server/src/router.js` with:
- Carbon factors (CO₂ per 1k tokens)
- Speed ratings
- Capability descriptions
- Provider information

### Carbon Factors
Default carbon factors (grams CO₂ per 1k tokens):
- Small models (Haiku, GPT-4o Mini): 0.02g
- Medium models (Sonnet): 0.05g  
- Large models (Opus, GPT-4o): 0.15g

## 📊 Carbon Impact

The system estimates carbon emissions based on:
- Token usage per query
- Model-specific carbon factors
- Real-world equivalents (car miles, phone charges, etc.)

### Environmental Equivalents
- **Car miles**: 0.411 kg CO₂ per mile
- **Phone charges**: 0.0008 kg CO₂ per charge
- **Google searches**: 0.0002 kg CO₂ per search
- **Email**: 0.000004 kg CO₂ per email

## 🎯 Demo Script

1. **Simple Query**: "What is photosynthesis?" → Answered by Claude Haiku 🌍 (low CO₂)
2. **Complex Query**: "Write a Python function to optimize database queries" → Escalated to Claude Sonnet ⚡ (medium CO₂)
3. **Toggle to Accuracy**: Switch preference → Reroute to Claude Opus 🎯 (higher CO₂)
4. **View Dashboard**: See "You saved 80g CO₂ today (equivalent to skipping a ½ mile drive)"

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Render/Railway)
```bash
cd server
# Deploy with environment variables configured
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built for the Infosys Carbon-Conscious Intelligence challenge
- Inspired by the need for sustainable AI practices
- Thanks to Anthropic and OpenAI for their API services

---

**🌍 Make AI more sustainable, one query at a time!**
