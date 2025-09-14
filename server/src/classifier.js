/**
 * Rule-based complexity classifier for determining query difficulty
 * Routes queries to appropriate model sizes based on complexity
 */

class ComplexityClassifier {
  constructor() {
    // Keywords that indicate complex queries
    this.complexKeywords = [
      // Programming & Technical
      'code', 'programming', 'debug', 'algorithm', 'optimize', 'refactor',
      'architecture', 'design pattern', 'framework', 'library', 'API',
      'database', 'SQL', 'query', 'schema', 'migration',
      
      // Analysis & Reasoning
      'analyze', 'analysis', 'evaluate', 'compare', 'contrast', 'explain',
      'why', 'how does', 'what causes', 'pros and cons', 'advantages',
      'disadvantages', 'trade-offs', 'implications',
      
      // Creative & Complex Tasks
      'write', 'create', 'generate', 'design', 'plan', 'strategy',
      'proposal', 'essay', 'article', 'story', 'script',
      'research', 'investigate', 'study', 'examine',
      
      // Problem Solving
      'solve', 'fix', 'troubleshoot', 'resolve', 'implement',
      'build', 'develop', 'construct', 'engineer'
    ];

    // Keywords that indicate simple queries
    this.simpleKeywords = [
      'what is', 'define', 'meaning', 'explain briefly', 'quick',
      'simple', 'basic', 'overview', 'summary', 'list',
      'yes', 'no', 'true', 'false', 'when', 'where', 'who',
      'fact', 'facts', 'info', 'information'
    ];

    // Token length thresholds
    this.tokenThresholds = {
      simple: 50,    // Less than 50 tokens
      moderate: 200, // 50-200 tokens
      complex: 500   // More than 200 tokens
    };
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   * @param {string} text - Input text
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if query contains complex keywords
   * @param {string} query - User query
   * @returns {number} Score based on complex keywords found
   */
  checkComplexKeywords(query) {
    const lowerQuery = query.toLowerCase();
    let score = 0;
    
    this.complexKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword)) {
        score += 1;
      }
    });
    
    return score;
  }

  /**
   * Check if query contains simple keywords
   * @param {string} query - User query
   * @returns {number} Score based on simple keywords found
   */
  checkSimpleKeywords(query) {
    const lowerQuery = query.toLowerCase();
    let score = 0;
    
    this.simpleKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword)) {
        score += 1;
      }
    });
    
    return score;
  }

  /**
   * Analyze query structure for complexity indicators
   * @param {string} query - User query
   * @returns {object} Structure analysis
   */
  analyzeStructure(query) {
    const sentences = query.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = query.split(/\s+/).filter(w => w.length > 0);
    
    return {
      sentenceCount: sentences.length,
      wordCount: words.length,
      avgWordsPerSentence: words.length / sentences.length,
      hasMultipleQuestions: (query.match(/\?/g) || []).length > 1,
      hasConditionals: /\b(if|when|unless|provided|assuming)\b/i.test(query),
      hasComparisons: /\b(compare|versus|vs|against|better|worse)\b/i.test(query)
    };
  }

  /**
   * Classify query complexity
   * @param {string} query - User query
   * @returns {object} Classification result
   */
  classify(query) {
    const tokens = this.estimateTokens(query);
    const complexScore = this.checkComplexKeywords(query);
    const simpleScore = this.checkSimpleKeywords(query);
    const structure = this.analyzeStructure(query);
    
    let complexityScore = 0;
    
    // Token-based scoring
    if (tokens > this.tokenThresholds.complex) {
      complexityScore += 3;
    } else if (tokens > this.tokenThresholds.moderate) {
      complexityScore += 2;
    } else if (tokens > this.tokenThresholds.simple) {
      complexityScore += 1;
    }
    
    // Keyword-based scoring
    complexityScore += complexScore * 2;
    complexityScore -= simpleScore * 1;
    
    // Structure-based scoring
    if (structure.hasMultipleQuestions) complexityScore += 2;
    if (structure.hasConditionals) complexityScore += 1;
    if (structure.hasComparisons) complexityScore += 2;
    if (structure.sentenceCount > 3) complexityScore += 1;
    if (structure.avgWordsPerSentence > 15) complexityScore += 1;
    
    // Determine complexity level
    let level, description, recommendedModel;
    
    if (complexityScore >= 5) {
      level = 'complex';
      description = 'Requires advanced reasoning, analysis, or creative generation';
      recommendedModel = 'large';
    } else if (complexityScore >= 2) {
      level = 'moderate';
      description = 'Moderate complexity requiring some analysis or explanation';
      recommendedModel = 'medium';
    } else {
      level = 'simple';
      description = 'Simple query that can be answered concisely';
      recommendedModel = 'small';
    }
    
    return {
      level,
      description,
      recommendedModel,
      score: complexityScore,
      analysis: {
        tokens,
        complexKeywords: complexScore,
        simpleKeywords: simpleScore,
        structure
      }
    };
  }
}

module.exports = new ComplexityClassifier();
