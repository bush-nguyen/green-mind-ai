# Python Backend for Eco-LLM Switcher

This is the Python backend implementation that integrates with your React frontend.

## Features

- **Multi-Model Support**: TinyLLaMA, GPT-2, and Claude Haiku
- **Intelligent Model Selection**: Based on query complexity and user preference
- **Carbon Footprint Calculation**: Real-time CO₂ impact estimation
- **Quality Control**: Automatic response validation and fallback
- **REST API**: Compatible with your React frontend

## Setup

1. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Server**:
   ```bash
   python app.py
   ```

   The server will run on `http://localhost:5000`

## API Endpoints

- `GET /health` - Health check
- `POST /api/query` - Process queries with model selection
- `GET /api/models` - Get available models

## Model Selection Logic

### Sustainability Mode (Default)
1. TinyLLaMA (smallest carbon footprint)
2. GPT-2 (medium footprint)
3. Claude Haiku (largest footprint)

### Speed Mode
1. TinyLLaMA (fastest)
2. GPT-2 (medium speed)
3. Claude Haiku (slowest)

### Accuracy Mode
1. Claude Haiku (most accurate)
2. GPT-2 (medium accuracy)
3. TinyLLaMA (basic accuracy)

## Carbon Footprint

Models are ranked by carbon efficiency:
- **TinyLLaMA**: 0.0000005 g CO₂ per token
- **GPT-2**: 0.0000001 g CO₂ per token  
- **Claude Haiku**: 0.000002 g CO₂ per token

## Integration

This backend is designed to work seamlessly with your React frontend. The API responses match the expected format for your Eco-LLM Switcher interface.
