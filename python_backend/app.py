#!/usr/bin/env python
# coding: utf-8

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
from anthropic import Anthropic
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)

# --- Model Setup ---
# Get API key from environment variable
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("Warning: ANTHROPIC_API_KEY environment variable not set")
    api_key = "your-api-key-here"  # Placeholder for development

claude_client = Anthropic(api_key=api_key)

def preprocess_prompt(prompt):
    return prompt.strip()

# --- Remove Duplicate Lines ---
def remove_duplicate_lines(text):
    seen = set()
    result = []
    for line in text.split('\n'):
        # Remove leading numbers and punctuation
        line_clean = re.sub(r'^\d+[\.\)]\s*', '', line.strip())
        if line_clean and line_clean not in seen:
            seen.add(line_clean)
            result.append(line.strip())
    return '\n'.join(result)

# --- Model Query Functions ---
def query_claude(prompt, max_tokens=100):
    try:
        response = claude_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=max_tokens,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        answer = remove_duplicate_lines(response.content[0].text.strip())
        return answer
    except Exception as e:
        return f"Claude API error: {str(e)}"

def query_simple(prompt):
    """Simple model with basic responses"""
    # Simple keyword-based responses for common questions
    prompt_lower = prompt.lower()
    
    if "renewable energy" in prompt_lower:
        return """Renewable energy refers to energy sources that are naturally replenished and virtually inexhaustible on human timescales. The main types include:

• Solar energy - from sunlight using photovoltaic panels or solar thermal systems
• Wind energy - from wind turbines that convert wind motion into electricity  
• Hydroelectric power - from flowing water in rivers and dams
• Geothermal energy - from heat stored beneath the Earth's surface
• Biomass energy - from organic materials like wood, crops, and waste

These sources produce little to no greenhouse gas emissions compared to fossil fuels, making them crucial for combating climate change and achieving sustainable development."""
    
    elif "climate change" in prompt_lower:
        return """Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations occur naturally, human activities have been the main driver since the 1800s, primarily through burning fossil fuels.

Key impacts include:
• Rising global temperatures
• More frequent extreme weather events
• Sea level rise
• Ocean acidification
• Ecosystem disruption

Solutions involve reducing greenhouse gas emissions through renewable energy, energy efficiency, sustainable transportation, and protecting natural carbon sinks like forests."""
    
    elif "sustainability" in prompt_lower:
        return """Sustainability means meeting present needs without compromising future generations' ability to meet their own needs. It has three main pillars:

Environmental: Protecting natural resources and ecosystems
Economic: Supporting long-term economic growth and prosperity  
Social: Ensuring social equity and human well-being

Key practices include using renewable energy, reducing waste, conserving water, supporting local communities, and making environmentally conscious choices in daily life."""
    
    elif "carbon footprint" in prompt_lower:
        return """A carbon footprint is the total amount of greenhouse gases (primarily CO₂) emitted directly or indirectly by an individual, organization, event, or product.

It's measured in tons of CO₂ equivalent and includes:
• Direct emissions from activities you control (driving, heating)
• Indirect emissions from products you use (food, clothing, services)

Ways to reduce your carbon footprint:
• Use renewable energy
• Drive less, walk/bike more
• Eat less meat, more plant-based foods
• Reduce, reuse, recycle
• Choose energy-efficient appliances
• Support sustainable companies"""
    
    else:
        return f"""I understand you're asking about: {prompt}

This is a simplified response. For more detailed information, I'd recommend:
• Consulting reliable sources like scientific journals
• Checking government environmental websites
• Speaking with experts in the field
• Using more advanced AI models for complex queries

The topic you're interested in is important for understanding environmental issues and sustainability."""

# --- Capability Logic ---
def can_simple(prompt):
    return len(prompt.split()) < 50

def can_claude(prompt):
    return True

# --- Output Quality Check ---
def is_unhelpful_response(prompt, response):
    if not response or not response.strip():
        return True
    prompt_clean = re.sub(r'[^\w\s]', '', prompt.strip().lower())
    response_clean = re.sub(r'[^\w\s]', '', response.strip().lower())
    if response_clean == prompt_clean:
        return True
    if "write" in response.lower() and "poem" in response.lower():
        return True
    if len(response.strip().split()) < 4:
        return True
    lines = [line.strip() for line in response.split('\n') if line.strip()]
    if lines and all('by' in line.lower() for line in lines):
        return True
    if "poem" in prompt.lower() and not any(word in response.lower() for word in ["cat", "snow"]):
        return True
    return False

# --- Realistic Carbon Footprint Calculation ---
def get_carbon_footprint(model, tokens_used):
    energy_per_token = {
        "simple": 0.0000001,
        "claude": 0.000002
    }
    co2_per_kwh = 0.4
    co2_per_token = energy_per_token[model] * co2_per_kwh * 1000
    total_co2 = co2_per_token * tokens_used
    return round(total_co2, 6)

# --- Model Suggestion Logic ---
def suggest_optimal_model(prompt):
    """Suggest the lowest-carbon model that can handle the query"""
    processed_prompt = preprocess_prompt(prompt)
    token_count = len(processed_prompt.split())
    
    complexity_score = 0
    
    # Check for complex reasoning keywords
    if re.search(r"\b(explain|analyze|compare|contrast|evaluate|critique|discuss|describe|define)\b", prompt.lower()):
        complexity_score += 2
    
    if re.search(r"\b(algorithm|function|code|programming|technical|scientific|research)\b", prompt.lower()):
        complexity_score += 3
    
    if re.search(r"\b(write|create|generate|compose|design|imagine|story|poem|essay)\b", prompt.lower()):
        complexity_score += 3
    
    if re.search(r"\b(solve|calculate|compute|formula|equation|math|statistics|probability)\b", prompt.lower()):
        complexity_score += 3
    
    if re.search(r"\b(step|process|how to|tutorial|guide|instructions)\b", prompt.lower()):
        complexity_score += 2
    
    if re.search(r"\b(detailed|comprehensive|thorough|in-depth|extensive|policy|recommendations|analysis)\b", prompt.lower()):
        complexity_score += 4
    
    if re.search(r"\b(and|also|additionally|furthermore|moreover|plus)\b", prompt.lower()):
        complexity_score += 1
    
    if token_count > 50:
        complexity_score += 1
    elif token_count > 100:
        complexity_score += 2
    
    # Determine optimal model based on complexity
    if complexity_score <= 3 and can_simple(prompt):
        return {
            "suggested_model": "simple",
            "confidence": "high",
            "reason": "Simple query that can be handled efficiently with basic knowledge",
            "carbon_savings": "95%"
        }
    elif complexity_score <= 6 and can_claude(prompt):
        return {
            "suggested_model": "claude",
            "confidence": "medium",
            "reason": "Complex query requiring advanced reasoning and analysis",
            "carbon_savings": "0%"
        }
    else:
        return {
            "suggested_model": "claude",
            "confidence": "high",
            "reason": "Very complex query requiring Claude's advanced capabilities",
            "carbon_savings": "0%"
        }

# --- Main Query Function with Fallback and Quality Check ---
def query_prompt(prompt, suggested_model=None):
    processed_prompt = preprocess_prompt(prompt)
    token_count = len(processed_prompt.split())
    
    # Use suggested model if provided, otherwise default to sustainability mode
    if suggested_model:
        model_order = [suggested_model]
    else:
        # Default to sustainability mode (simple first, then claude)
        model_order = []
        if can_simple(prompt):
            model_order.append("simple")
        if can_claude(prompt):
            model_order.append("claude")
    
    response = ""
    model_choice = None
    carbon_grams = None
    
    for model in model_order:
        if model == "simple":
            response = query_simple(prompt)
        elif model == "claude":
            response = query_claude(prompt)
        
        if not is_unhelpful_response(prompt, response):
            model_choice = model
            carbon_grams = get_carbon_footprint(model, token_count)
            break
    
    if not response or not response.strip():
        response = "Sorry, none of the available models could generate a response."
        model_choice = "none"
        carbon_grams = 0
    
    return {
        "prompt": prompt,
        "response": response,
        "model_used": model_choice,
        "tokens_used": token_count,
        "carbon_footprint_grams": carbon_grams,
        "preference": "auto-suggested"
    }

# --- API Endpoints ---
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Eco-LLM Switcher API is running"})

@app.route('/api/query', methods=['POST'])
def api_query():
    try:
        data = request.get_json()
        query = data.get('query', '')
        suggested_model = data.get('suggested_model')
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        result = query_prompt(query, suggested_model)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/suggest-model', methods=['POST'])
def suggest_model():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        suggestion = suggest_optimal_model(query)
        return jsonify({
            "query": query,
            "suggestion": suggestion
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    return jsonify({
        "models": [
            {
                "id": "simple",
                "name": "Simple Model",
                "description": "Efficient model for basic queries",
                "carbon_footprint": "Very Low"
            },
            {
                "id": "claude",
                "name": "Claude Haiku",
                "description": "Advanced AI model for complex queries",
                "carbon_footprint": "Low"
            }
        ]
    })

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(host='0.0.0.0', port=5001, debug=True)
