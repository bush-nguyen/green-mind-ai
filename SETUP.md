# 🚀 Quick Setup Guide

## Prerequisites
- Node.js 16+ and npm
- Anthropic API key (for Claude models)
- OpenAI API key (optional, for GPT models)

## 🏃‍♂️ Quick Start

1. **Install dependencies:**
```bash
npm install
cd server && npm install
cd ../client && npm install
```

2. **Configure environment:**
```bash
cd server
cp env.example .env
# Edit .env with your API keys
```

3. **Start development servers:**
```bash
# From project root
npm run dev
```

4. **Open the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🧪 Test the Application

Run the demo script to test different query types:
```bash
npm run demo
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker
npm run docker:build
npm run docker:up
```

## 📊 Demo Queries

Try these queries to see the system in action:

1. **Simple Query (Sustainability)**: "What is photosynthesis?"
   - Should use Claude Haiku (small model)
   - Low carbon impact

2. **Complex Query (Accuracy)**: "Write a Python function to optimize database queries"
   - Should use Claude Opus (large model)
   - Higher carbon but better accuracy

3. **Moderate Query (Speed)**: "Explain machine learning vs deep learning"
   - Should use Claude Sonnet (medium model)
   - Balanced approach

## 🎯 Key Features Demonstrated

- ✅ Intelligent model routing based on complexity
- ✅ Carbon slider with sustainability/speed/accuracy preferences
- ✅ Real-time carbon impact calculation
- ✅ Transparency tags showing model usage
- ✅ Environmental equivalents (car miles, phone charges)
- ✅ Dashboard with cumulative savings tracking

## 🔧 Troubleshooting

**Server not starting?**
- Check if port 3001 is available
- Verify API keys in `.env` file
- Run `npm run server` to see detailed logs

**Frontend not connecting?**
- Ensure backend is running on port 3001
- Check browser console for CORS errors
- Verify `REACT_APP_API_URL` in client

**API errors?**
- Verify your Anthropic/OpenAI API keys
- Check API quota and billing
- Test with simple queries first

## 🌍 Environmental Impact

The system estimates carbon emissions based on:
- Token usage per query
- Model-specific carbon factors
- Real-world equivalents

Default carbon factors:
- Small models: 0.02g CO₂ per 1k tokens
- Medium models: 0.05g CO₂ per 1k tokens  
- Large models: 0.15g CO₂ per 1k tokens

---

**Ready to make AI more sustainable! 🌱**
