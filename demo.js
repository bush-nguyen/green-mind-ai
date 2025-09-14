#!/usr/bin/env node

/**
 * Demo script for Eco-LLM Switcher
 * Tests different query types and preferences
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

const demoQueries = [
  {
    query: "What is photosynthesis?",
    preference: "sustainability",
    expected: "Simple query - should use small model"
  },
  {
    query: "Write a Python function to optimize database queries with proper error handling and logging",
    preference: "accuracy", 
    expected: "Complex query - should use large model for accuracy"
  },
  {
    query: "Explain the difference between machine learning and deep learning",
    preference: "speed",
    expected: "Moderate query - should use medium model for speed"
  },
  {
    query: "List 5 benefits of renewable energy",
    preference: "sustainability",
    expected: "Simple query - should prioritize low carbon"
  }
];

async function testQuery(query, preference, expected) {
  try {
    console.log(`\n🧪 Testing: "${query}"`);
    console.log(`📊 Preference: ${preference}`);
    console.log(`💡 Expected: ${expected}`);
    
    const response = await axios.post(`${API_BASE_URL}/api/query`, {
      query,
      preference
    });
    
    const { response: aiResponse, metadata } = response.data;
    
    console.log(`✅ Response: ${aiResponse.substring(0, 100)}...`);
    console.log(`🤖 Model Used: ${metadata.modelUsed}`);
    console.log(`📈 Complexity: ${metadata.complexity}`);
    console.log(`🌍 Carbon Impact: ${metadata.carbonImpact.totalCO2}g CO₂`);
    console.log(`💚 Savings: ${metadata.savings}g CO₂`);
    console.log(`⚡ Reasoning: ${metadata.reasoning || 'N/A'}`);
    
    return {
      success: true,
      model: metadata.modelUsed,
      complexity: metadata.complexity,
      carbonImpact: metadata.carbonImpact.totalCO2,
      savings: metadata.savings
    };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDemo() {
  console.log('🌍 Eco-LLM Switcher Demo');
  console.log('========================');
  
  // Test health endpoint
  try {
    const health = await axios.get(`${API_BASE_URL}/health`);
    console.log(`✅ Server is healthy: ${health.data.status}`);
  } catch (error) {
    console.error('❌ Server is not responding. Make sure it\'s running on port 3001');
    process.exit(1);
  }
  
  // Get available models
  try {
    const models = await axios.get(`${API_BASE_URL}/api/models`);
    console.log(`\n📋 Available Models:`);
    models.data.forEach(model => {
      console.log(`   • ${model.name} (${model.size}) - ${model.carbonFactor}g CO₂/1k tokens`);
    });
  } catch (error) {
    console.log('⚠️  Could not fetch models info');
  }
  
  // Run demo queries
  const results = [];
  for (const demo of demoQueries) {
    const result = await testQuery(demo.query, demo.preference, demo.expected);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between queries
  }
  
  // Summary
  console.log('\n📊 Demo Summary');
  console.log('================');
  
  const successful = results.filter(r => r.success);
  const totalCarbon = successful.reduce((sum, r) => sum + r.carbonImpact, 0);
  const totalSavings = successful.reduce((sum, r) => sum + r.savings, 0);
  
  console.log(`✅ Successful queries: ${successful.length}/${results.length}`);
  console.log(`🌍 Total carbon used: ${totalCarbon.toFixed(3)}g CO₂`);
  console.log(`💚 Total savings: ${totalSavings.toFixed(3)}g CO₂`);
  console.log(`📈 Average per query: ${(totalCarbon / successful.length).toFixed(3)}g CO₂`);
  
  if (totalSavings > 0) {
    const carMiles = (totalSavings / 1000) / 0.411;
    console.log(`🚗 Equivalent to driving ${carMiles.toFixed(2)} fewer miles!`);
  }
  
  console.log('\n🎉 Demo completed successfully!');
}

// Run the demo
runDemo().catch(console.error);
