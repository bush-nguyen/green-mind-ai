#!/usr/bin/env python
# coding: utf-8

# In[174]:

import streamlit as st
import os
import torch
import re
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline, logging

logging.set_verbosity_error()

# --- Model Setup ---
os.environ["ANTHROPIC_API_KEY"] = your api key here
claude_client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

device = "cuda" if torch.cuda.is_available() else "cpu"
print("Using device:", device)

# TinyLLaMA
tiny_model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
tiny_tokenizer = AutoTokenizer.from_pretrained(tiny_model_id)
tiny_model = AutoModelForCausalLM.from_pretrained(tiny_model_id)
tiny_model.to(device)

# Hugging Face Model
hf_model_id = "gpt2"
hf_tokenizer = AutoTokenizer.from_pretrained(hf_model_id)
hf_model = AutoModelForCausalLM.from_pretrained(hf_model_id)
hf_model.to(device)

hf_pipeline = pipeline(
    "text-generation",
    model=hf_model,
    tokenizer=hf_tokenizer,
    device=0 if device=="cuda" else -1
)

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
def query_tinyllama(prompt, max_new_tokens=100):
    prompt_for_model = prompt.strip() + "\n"
    inputs = tiny_tokenizer(prompt_for_model, return_tensors="pt").to(device)
    output = tiny_model.generate(**inputs, max_new_tokens=max_new_tokens)
    decoded = tiny_tokenizer.decode(output[0], skip_special_tokens=True)
    if decoded.startswith(prompt_for_model):
        answer = decoded[len(prompt_for_model):].strip()
    else:
        answer = decoded.strip()
    answer = remove_duplicate_lines(answer)
    return answer

def query_huggingface(prompt, max_new_tokens=100):
    prompt_for_model = prompt.strip() + "\n"
    try:
        result = hf_pipeline(prompt_for_model, max_new_tokens=max_new_tokens, return_full_text=False)
        answer = result[0]['generated_text'].strip()
    except TypeError:
        result = hf_pipeline(prompt_for_model, max_new_tokens=max_new_tokens)
        generated = result[0]['generated_text']
        if generated.startswith(prompt_for_model):
            answer = generated[len(prompt_for_model):].strip()
        else:
            answer = generated.strip()
    answer = remove_duplicate_lines(answer)
    return answer

def query_claude(prompt, max_tokens=100):
    response = claude_client.completions.create(
        model="claude-3-haiku-20240307",  # Use a valid model name
        prompt=f"{HUMAN_PROMPT} {prompt}{AI_PROMPT}",
        max_tokens_to_sample=max_tokens,
        stop_sequences=[HUMAN_PROMPT]
    )
    answer = remove_duplicate_lines(response.completion.strip())
    return answer

# --- Capability Logic ---
def can_tinyllama(prompt):
    if len(prompt.split()) > 30:
        return False
    if re.search(r"\b(solve|integrate|differentiate|derivative|roots|limit|equation|system of equations|calculate|find|sum|product|factorial|prime|math|number)\b", prompt.lower()):
        return False
    if re.search(r"\b(python|javascript|code|function|script)\b", prompt.lower()):
        return False
    return True

def can_huggingface(prompt):
    if re.search(r"\b(python|javascript|code|function|script)\b", prompt.lower()):
        return True
    if re.search(r"\b(solve|integrate|differentiate|derivative|roots|limit|equation|system of equations|calculate|find|sum|product|factorial|prime|math|number)\b", prompt.lower()):
        return True
    if len(prompt.split()) <= 60:
        return True
    return False

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
        "tinyllama": 0.0000005,
        "huggingface": 0.0000001,
        "claude": 0.000002
    }
    co2_per_kwh = 0.4
    co2_per_token = energy_per_token[model] * co2_per_kwh * 1000
    total_co2 = co2_per_token * tokens_used
    return round(total_co2, 6)

# --- Main Query Function with Fallback and Quality Check ---
def query_prompt(prompt):
    processed_prompt = preprocess_prompt(prompt)
    token_count = len(processed_prompt.split())

    model_order = []
    if can_tinyllama(prompt):
        model_order.append("tinyllama")
    if can_huggingface(prompt):
        model_order.append("huggingface")
    if can_claude(prompt):
        model_order.append("claude")

    response = ""
    model_choice = None
    carbon_grams = None

    for model in model_order:
        if model == "tinyllama":
            response = query_tinyllama(prompt)
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

# # --- Main Interaction ---
# user_prompt = input("Enter your question: ")
# result = query_prompt(user_prompt)

# print("\n--- Results ---")
# print("Prompt:", result["prompt"])
# print("Response:", result["response"])
# print("Model Used:", result["model_used"])
# print("Tokens Used:", result["tokens_used"])
# print("Estimated Carbon Footprint (g CO₂):", result["carbon_footprint_grams"])


# # In[ ]:

# # --- Streamlit UI ---
# st.title("Multi-Model LLM Query App")
# st.write("Enter your question below. The app will select the best model and show the response, model used, and estimated carbon footprint.")

# user_prompt = st.text_area("Your question:", height=100)

# if st.button("Submit") and user_prompt.strip():
#     with st.spinner("Generating response..."):
#         result = query_prompt(user_prompt)
#     st.subheader("Results")
#     st.markdown(f"**Prompt:** {result['prompt']}")
#     st.markdown(f"**Response:** {result['response']}")
#     st.markdown(f"**Model Used:** {result['model_used']}")
#     st.markdown(f"**Tokens Used:** {result['tokens_used']}")
#     st.markdown(f"**Estimated Carbon Footprint (g CO₂):** {result['carbon_footprint_grams']}")




