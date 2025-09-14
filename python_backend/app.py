from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
import requests
from anthropic import Anthropic
import logging
from transformers import pipeline

# Configure logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)

# --- Model Setup ---
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("Warning: ANTHROPIC_API_KEY environment variable not set")
    api_key = "your-api-key-here"  # Placeholder for development

claude_client = Anthropic(api_key=api_key)

# Hugging Face local model (using transformers, no API key needed)
hf_pipeline = pipeline("text-generation", model="gpt2")

def preprocess_prompt(prompt):
    return prompt.strip()

def remove_duplicate_lines(text):
    seen = set()
    result = []
    for line in text.split('\n'):
        line_clean = re.sub(r'^\d+[\.\)]\s*', '', line.strip())
        if line_clean and line_clean not in seen:
            seen.add(line_clean)
            result.append(line.strip())
    return '\n'.join(result)

# --- Model Query Functions ---
def query_claude(prompt, max_tokens=200):
    try:
        response = claude_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}]
        )
        answer = remove_duplicate_lines(response.content[0].text.strip())
        return answer
    except Exception as e:
        return f"Claude API error: {str(e)}"

def query_huggingface(prompt, max_tokens=150):
    try:
        outputs = hf_pipeline(
            prompt,
            max_new_tokens=max_tokens,
            num_return_sequences=1,
            do_sample=True,
            temperature=0.7
        )
        return outputs[0]["generated_text"]
    except Exception as e:
        return f"Hugging Face local error: {str(e)}"

def query_ollama(prompt, model="llama2", max_tokens=150):
    try:
        url = "http://localhost:11434/api/generate"
        payload = {"model": model, "prompt": prompt, "options": {"num_predict": max_tokens}}
        response = requests.post(url, json=payload, timeout=60)
        if response.status_code == 200:
            data = response.json()
            return data.get("response", "")
        else:
            return f"Ollama API error: {response.text}"
    except Exception as e:
        return f"Ollama API error: {str(e)}"

# --- Output Quality Check ---
def is_unhelpful_response(prompt, response):
    if not response or not response.strip():
        return True
    if "API error" in response or "local error" in response:
        return True
    prompt_clean = re.sub(r'[^\w\s]', '', prompt.strip().lower())
    response_clean = re.sub(r'[^\w\s]', '', response.strip().lower())
    if response_clean == prompt_clean:
        return True
    if len(response.strip().split()) < 4:
        return True
    return False

# --- Carbon Footprint (simplified) ---
def get_carbon_footprint(model, tokens_used):
    energy_per_token = {
        "ollama": 0.0000012,
        "huggingface": 0.0000015,
        "claude": 0.000002
    }
    co2_per_kwh = 0.4
    co2_per_token = energy_per_token.get(model, 0.000002) * co2_per_kwh * 1000
    total_co2 = co2_per_token * tokens_used
    return round(total_co2, 6)

# --- Main Query Function with Cascade ---
def query_prompt(prompt):
    processed_prompt = preprocess_prompt(prompt)
    token_count = len(processed_prompt.split())

    model_order = ["ollama", "huggingface", "claude"]
    response = ""
    model_choice = None
    carbon_grams = None

    for model in model_order:
        if model == "ollama":
            response = query_ollama(prompt)
        elif model == "huggingface":
            response = query_huggingface(prompt)
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
        "carbon_footprint_grams": carbon_grams
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
        if not query:
            return jsonify({"error": "Query is required"}), 400
        result = query_prompt(query)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    return jsonify({
        "models": [
            {
                "id": "ollama",
                "name": "Ollama (Llama2)",
                "description": "Local LLM (lowest carbon footprint)",
                "carbon_footprint": "Low"
            },
            {
                "id": "huggingface",
                "name": "Hugging Face Transformers (GPT-2)",
                "description": "Local Hugging Face model",
                "carbon_footprint": "Medium"
            },
            {
                "id": "claude",
                "name": "Claude Haiku",
                "description": "Anthropic Claude API (highest carbon footprint)",
                "carbon_footprint": "High"
            }
        ]
    })

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(host='0.0.0.0', port=5001, debug=True)

