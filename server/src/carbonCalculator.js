/**
 * Carbon Calculator - Estimates CO2 emissions for LLM usage
 */

class CarbonCalculator {
  constructor() {
    // Carbon factors in grams CO2 per 1k tokens (estimated values)
    this.carbonFactors = {
      'claude-haiku': parseFloat(process.env.CARBON_FACTOR_SMALL) || 0.02,
      'claude-sonnet': parseFloat(process.env.CARBON_FACTOR_MEDIUM) || 0.05,
      'claude-opus': parseFloat(process.env.CARBON_FACTOR_LARGE) || 0.15,
      'gpt-4o-mini': parseFloat(process.env.CARBON_FACTOR_SMALL) || 0.02,
      'gpt-4o': parseFloat(process.env.CARBON_FACTOR_LARGE) || 0.15,
      'default': 0.05
    };

    // Reference values for context
    this.referenceValues = {
      carMile: 0.411, // kg CO2 per mile (average car)
      treeYear: 22, // kg CO2 absorbed per tree per year
      phoneCharge: 0.0008, // kg CO2 per phone charge
      googleSearch: 0.0002, // kg CO2 per Google search
      email: 0.000004 // kg CO2 per email
    };
  }

  /**
   * Calculate carbon impact for a response
   * @param {object} response - Model response with token count
   * @param {object} model - Model configuration
   * @returns {object} Carbon impact calculation
   */
  calculate(response, model) {
    const tokens = response.tokens || 0;
    const carbonFactor = this.carbonFactors[model.key] || this.carbonFactors.default;
    const totalCO2 = (tokens / 1000) * carbonFactor;
    
    return {
      tokens,
      carbonFactor,
      totalCO2: Math.round(totalCO2 * 1000) / 1000, // Round to 3 decimal places
      equivalent: this.getEquivalent(totalCO2),
      model: model.name
    };
  }

  /**
   * Get equivalent activities for CO2 amount
   * @param {number} co2Grams - CO2 in grams
   * @returns {object} Equivalent activities
   */
  getEquivalent(co2Grams) {
    const co2Kg = co2Grams / 1000;
    
    return {
      carMiles: Math.round((co2Kg / this.referenceValues.carMile) * 100) / 100,
      phoneCharges: Math.round((co2Kg / this.referenceValues.phoneCharge)),
      googleSearches: Math.round((co2Kg / this.referenceValues.googleSearch)),
      emails: Math.round((co2Kg / this.referenceValues.email)),
      treeHours: Math.round((co2Kg / (this.referenceValues.treeYear / (365 * 24))) * 10) / 10
    };
  }

  /**
   * Calculate savings compared to using largest model
   * @param {object} response - Current response
   * @param {object} currentModel - Currently used model
   * @param {object} largeModel - Large model for comparison
   * @returns {object} Savings calculation
   */
  calculateSavings(response, currentModel, largeModel = null) {
    if (!largeModel) {
      // Default to Claude Opus as the largest model
      largeModel = {
        key: 'claude-opus',
        name: 'Claude Opus',
        carbonFactor: this.carbonFactors['claude-opus']
      };
    }

    const currentImpact = this.calculate(response, currentModel);
    const largeModelImpact = this.calculate(response, largeModel);
    
    const savings = largeModelImpact.totalCO2 - currentImpact.totalCO2;
    const savingsPercentage = (savings / largeModelImpact.totalCO2) * 100;
    
    return {
      savedCO2: Math.round(savings * 1000) / 1000,
      savingsPercentage: Math.round(savingsPercentage * 10) / 10,
      equivalent: this.getEquivalent(savings * 1000), // Convert to grams
      comparison: {
        current: currentImpact,
        largeModel: largeModelImpact
      }
    };
  }

  /**
   * Calculate cumulative savings over time
   * @param {array} queries - Array of query results with carbon data
   * @returns {object} Cumulative savings summary
   */
  calculateCumulativeSavings(queries) {
    let totalTokens = 0;
    let totalCO2 = 0;
    let totalSavings = 0;
    let modelUsage = {};

    queries.forEach(query => {
      if (query.metadata && query.metadata.carbonImpact) {
        totalTokens += query.metadata.carbonImpact.tokens;
        totalCO2 += query.metadata.carbonImpact.totalCO2;
        totalSavings += query.metadata.savings || 0;
        
        const model = query.metadata.modelUsed;
        modelUsage[model] = (modelUsage[model] || 0) + 1;
      }
    });

    return {
      totalQueries: queries.length,
      totalTokens,
      totalCO2: Math.round(totalCO2 * 1000) / 1000,
      totalSavings: Math.round(totalSavings * 1000) / 1000,
      modelUsage,
      equivalent: this.getEquivalent(totalSavings * 1000),
      averageCO2PerQuery: queries.length > 0 ? Math.round((totalCO2 / queries.length) * 1000) / 1000 : 0
    };
  }

  /**
   * Get carbon factors for all models
   * @returns {object} Carbon factors
   */
  getCarbonFactors() {
    return {
      factors: this.carbonFactors,
      referenceValues: this.referenceValues,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Format carbon impact for display
   * @param {number} co2Grams - CO2 in grams
   * @returns {string} Formatted string
   */
  formatCarbonImpact(co2Grams) {
    if (co2Grams < 1) {
      return `${Math.round(co2Grams * 1000)}mg CO₂`;
    } else {
      return `${Math.round(co2Grams * 10) / 10}g CO₂`;
    }
  }

  /**
   * Get environmental impact message
   * @param {number} co2Grams - CO2 in grams
   * @returns {string} Environmental impact message
   */
  getImpactMessage(co2Grams) {
    const equivalent = this.getEquivalent(co2Grams);
    
    if (equivalent.carMiles > 0.01) {
      return `Equivalent to driving ${equivalent.carMiles} miles in a car`;
    } else if (equivalent.phoneCharges > 1) {
      return `Equivalent to ${equivalent.phoneCharges} phone charges`;
    } else if (equivalent.googleSearches > 1) {
      return `Equivalent to ${equivalent.googleSearches} Google searches`;
    } else if (equivalent.emails > 1) {
      return `Equivalent to ${equivalent.emails} emails sent`;
    } else {
      return `Minimal environmental impact`;
    }
  }
}

module.exports = new CarbonCalculator();
