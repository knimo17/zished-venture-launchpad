// Assessment Scoring Utility - Implements all scoring logic including reverse scoring, trap detection, and behavioral adjustments

export interface AssessmentResponse {
  question_id: string;
  question_number: number;
  response: number | string; // number for likert/scenario, string 'A'/'B' for forced choice
  dimension: string;
  sub_dimension?: string;
  is_reverse?: boolean;
  is_trap?: boolean;
  question_type?: 'likert' | 'forced_choice' | 'scenario';
  option_mappings?: Record<string, Record<string, number>>;
}

export interface DimensionScores {
  ownership: number;
  execution: number;
  hustle: number;
  problemSolving: number;
  leadership: number;
}

export interface VentureFitScores {
  operator: number;
  product: number;
  growth: number;
  vision: number;
}

export interface TeamCompatibilityScores {
  workingStyle: number;
  communication: number;
  conflictResponse: number;
  decisionMaking: number;
  collaboration: number;
}

export interface StyleTraits {
  action_bias: number;
  deliberation_bias: number;
  autonomy: number;
  collaboration: number;
  direct: number;
  diplomatic: number;
  vision_focus: number;
  execution_focus: number;
}

export interface TrapAnalysis {
  trapScore: number; // 4-20 range
  level: 'normal' | 'elevated' | 'likely_exaggeration';
  shouldFlag: boolean;
}

export type OperatorType = 'Operational Leader' | 'Product Architect' | 'Growth Catalyst' | 'Visionary Builder';
export type ConfidenceLevel = 'Strong' | 'Moderate' | 'Emerging';

export interface AssessmentResult {
  dimensionScores: DimensionScores;
  ventureFitScores: VentureFitScores;
  teamCompatibilityScores: TeamCompatibilityScores;
  styleTraits: StyleTraits;
  trapAnalysis: TrapAnalysis;
  primaryFounderType: OperatorType;
  secondaryFounderType: OperatorType | null;
  confidenceLevel: ConfidenceLevel;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  weaknessSummary: string;
}

// Apply reverse scoring: reverse_score = 6 - response
function applyReverseScoring(response: number, isReverse: boolean): number {
  return isReverse ? 6 - response : response;
}

// Calculate trap score (Q37-40) - higher score indicates potential exaggeration
export function calculateTrapAnalysis(responses: AssessmentResponse[]): TrapAnalysis {
  const trapResponses = responses.filter(r => r.is_trap && typeof r.response === 'number');
  
  if (trapResponses.length === 0) {
    return { trapScore: 0, level: 'normal', shouldFlag: false };
  }

  const trapScore = trapResponses.reduce((sum, r) => sum + (r.response as number), 0);
  
  let level: TrapAnalysis['level'] = 'normal';
  let shouldFlag = false;

  if (trapScore >= 16) {
    level = 'likely_exaggeration';
    shouldFlag = true;
  } else if (trapScore >= 11) {
    level = 'elevated';
    shouldFlag = true;
  }

  return { trapScore, level, shouldFlag };
}

// Calculate core dimension scores with reverse scoring (Q1-36)
export function calculateDimensionScores(responses: AssessmentResponse[]): DimensionScores {
  const scores: DimensionScores = {
    ownership: 0,
    execution: 0,
    hustle: 0,
    problemSolving: 0,
    leadership: 0,
  };

  let ownershipCount = 0, executionCount = 0, hustleCount = 0, problemSolvingCount = 0, leadershipCount = 0;

  responses.forEach((r) => {
    if (r.is_trap || r.question_type !== 'likert' || typeof r.response !== 'number') return;
    
    const adjustedScore = applyReverseScoring(r.response, r.is_reverse || false);
    
    // Q1-8: Ownership
    if (r.question_number >= 1 && r.question_number <= 8) {
      scores.ownership += adjustedScore;
      ownershipCount++;
    }
    // Q9-16: Execution
    else if (r.question_number >= 9 && r.question_number <= 16) {
      scores.execution += adjustedScore;
      executionCount++;
    }
    // Q17-24: Hustle
    else if (r.question_number >= 17 && r.question_number <= 24) {
      scores.hustle += adjustedScore;
      hustleCount++;
    }
    // Q25-30: Problem-Solving
    else if (r.question_number >= 25 && r.question_number <= 30) {
      scores.problemSolving += adjustedScore;
      problemSolvingCount++;
    }
    // Q31-36: Leadership
    else if (r.question_number >= 31 && r.question_number <= 36) {
      scores.leadership += adjustedScore;
      leadershipCount++;
    }
    // Q41-50: Mixed construct - contributes to multiple dimensions
    else if (r.question_number >= 41 && r.question_number <= 50) {
      // Mixed construct questions contribute based on their content
      // Q41: focus (reverse) -> execution
      // Q42: process creation -> execution, hustle
      // Q43: calm under pressure -> leadership, problem_solving
      // Q44: avoid leadership (reverse) -> leadership
      // Q45: initiative -> ownership, hustle
      // Q46: clarity preference (reverse) -> execution
      // Q47: multitasking -> execution
      // Q48: comfort over action (reverse) -> hustle
      // Q49: fast decisions -> execution
      // Q50: consistency struggle (reverse) -> execution
      
      switch (r.question_number) {
        case 41:
          scores.execution += adjustedScore * 0.5;
          break;
        case 42:
          scores.execution += adjustedScore * 0.5;
          scores.hustle += adjustedScore * 0.25;
          break;
        case 43:
          scores.leadership += adjustedScore * 0.5;
          scores.problemSolving += adjustedScore * 0.25;
          break;
        case 44:
          scores.leadership += adjustedScore * 0.5;
          break;
        case 45:
          scores.ownership += adjustedScore * 0.5;
          scores.hustle += adjustedScore * 0.25;
          break;
        case 46:
          scores.execution += adjustedScore * 0.5;
          break;
        case 47:
          scores.execution += adjustedScore * 0.5;
          break;
        case 48:
          scores.hustle += adjustedScore * 0.5;
          break;
        case 49:
          scores.execution += adjustedScore * 0.5;
          break;
        case 50:
          scores.execution += adjustedScore * 0.5;
          break;
      }
    }
  });

  return scores;
}

// Apply scenario adjustments to dimension scores
export function applyScenarioAdjustments(
  dimensionScores: DimensionScores,
  responses: AssessmentResponse[]
): DimensionScores {
  const adjustedScores = { ...dimensionScores };
  
  responses.forEach((r) => {
    if (r.question_type !== 'scenario' || typeof r.response !== 'number') return;
    
    const mappings = r.option_mappings;
    if (!mappings) return;
    
    const selectedMapping = mappings[r.response.toString()];
    if (!selectedMapping) return;
    
    // Apply small adjustments (±0.5 per trait)
    Object.entries(selectedMapping).forEach(([trait, value]) => {
      const adjustment = value * 0.5;
      switch (trait) {
        case 'ownership':
          adjustedScores.ownership += adjustment;
          break;
        case 'execution':
          adjustedScores.execution += adjustment;
          break;
        case 'hustle':
          adjustedScores.hustle += adjustment;
          break;
        case 'problem_solving':
          adjustedScores.problemSolving += adjustment;
          break;
        case 'leadership':
          adjustedScores.leadership += adjustment;
          break;
      }
    });
  });
  
  return adjustedScores;
}

// Calculate venture fit scores (Q51-60)
export function calculateVentureFitScores(responses: AssessmentResponse[]): VentureFitScores {
  let operatorRaw = 0;
  let productRaw = 0;
  let growthRaw = 0;
  let visionRaw = 0;

  responses.forEach((r) => {
    if (r.question_type !== 'likert' || typeof r.response !== 'number') return;
    
    if (r.question_number >= 51 && r.question_number <= 53) {
      operatorRaw += r.response;
    } else if (r.question_number >= 54 && r.question_number <= 56) {
      productRaw += r.response;
    } else if (r.question_number >= 57 && r.question_number <= 59) {
      growthRaw += r.response;
    } else if (r.question_number === 60) {
      visionRaw = r.response;
    }
  });

  return {
    operator: operatorRaw / 3,
    product: productRaw / 3,
    growth: growthRaw / 3,
    vision: visionRaw, // Already on 1-5 scale (single question)
  };
}

// Calculate style traits from forced choice questions (Q61-65)
export function calculateStyleTraits(responses: AssessmentResponse[]): StyleTraits {
  const traits: StyleTraits = {
    action_bias: 0,
    deliberation_bias: 0,
    autonomy: 0,
    collaboration: 0,
    direct: 0,
    diplomatic: 0,
    vision_focus: 0,
    execution_focus: 0,
  };

  responses.forEach((r) => {
    if (r.question_type !== 'forced_choice' || typeof r.response !== 'string') return;
    
    const mappings = r.option_mappings;
    if (!mappings) return;
    
    const selectedMapping = mappings[r.response];
    if (!selectedMapping) return;
    
    Object.entries(selectedMapping).forEach(([trait, value]) => {
      if (trait in traits) {
        traits[trait as keyof StyleTraits] += value;
      }
    });
  });

  return traits;
}

// Calculate team compatibility scores from forced choice and scenario responses
export function calculateTeamCompatibilityScores(
  styleTraits: StyleTraits,
  responses: AssessmentResponse[]
): TeamCompatibilityScores {
  // Map style traits to team compatibility dimensions
  const workingStyle = (styleTraits.autonomy + styleTraits.collaboration) > 0 
    ? ((styleTraits.autonomy > styleTraits.collaboration) ? 4 : 3.5) : 3;
  
  const communication = (styleTraits.direct + styleTraits.diplomatic) > 0
    ? ((styleTraits.direct > styleTraits.diplomatic) ? 4 : 3.5) : 3;
  
  const conflictResponse = (styleTraits.direct + styleTraits.diplomatic) > 0
    ? ((styleTraits.diplomatic > styleTraits.direct) ? 4 : 3.5) : 3;
  
  const decisionMaking = (styleTraits.action_bias + styleTraits.deliberation_bias) > 0
    ? ((styleTraits.action_bias > styleTraits.deliberation_bias) ? 4 : 3.5) : 3;
  
  const collaboration = styleTraits.collaboration > 0 ? 4 : 3;

  // Apply scenario adjustments
  const scenarioAdjustments = {
    workingStyle: 0,
    communication: 0,
    conflictResponse: 0,
    decisionMaking: 0,
    collaboration: 0,
  };

  responses.forEach((r) => {
    if (r.question_type !== 'scenario' || typeof r.response !== 'number') return;
    
    const mappings = r.option_mappings;
    if (!mappings) return;
    
    const selectedMapping = mappings[r.response.toString()];
    if (!selectedMapping) return;
    
    if (selectedMapping.communication) scenarioAdjustments.communication += 0.2;
    if (selectedMapping.collaboration) scenarioAdjustments.collaboration += 0.2;
  });

  return {
    workingStyle: Math.min(5, workingStyle + scenarioAdjustments.workingStyle),
    communication: Math.min(5, communication + scenarioAdjustments.communication),
    conflictResponse: Math.min(5, conflictResponse + scenarioAdjustments.conflictResponse),
    decisionMaking: Math.min(5, decisionMaking + scenarioAdjustments.decisionMaking),
    collaboration: Math.min(5, collaboration + scenarioAdjustments.collaboration),
  };
}

// Cross-validate venture fit with core traits
function validateVentureFitConsistency(
  ventureFitScores: VentureFitScores,
  dimensionScores: DimensionScores
): VentureFitScores {
  const adjusted = { ...ventureFitScores };
  
  // Normalize dimension scores to 1-5 scale for comparison
  // Core traits have 8 questions * 5 max = 40, so we normalize
  const normalizedHustle = (dimensionScores.hustle / 40) * 5;
  const normalizedLeadership = (dimensionScores.leadership / 30) * 5;
  
  // If Growth is high but Hustle and Leadership are low, downgrade Growth confidence
  if (adjusted.growth >= 4 && normalizedHustle < 3 && normalizedLeadership < 3) {
    adjusted.growth = adjusted.growth * 0.85; // 15% reduction
  }
  
  // If Operator is high but Execution is low, slight downgrade
  const normalizedExecution = (dimensionScores.execution / 40) * 5;
  if (adjusted.operator >= 4 && normalizedExecution < 3) {
    adjusted.operator = adjusted.operator * 0.9;
  }
  
  return adjusted;
}

// Determine primary operator type
export function determinePrimaryFounderType(ventureFitScores: VentureFitScores): OperatorType {
  const scores = [
    { type: 'Operational Leader' as OperatorType, score: ventureFitScores.operator },
    { type: 'Product Architect' as OperatorType, score: ventureFitScores.product },
    { type: 'Growth Catalyst' as OperatorType, score: ventureFitScores.growth },
    { type: 'Visionary Builder' as OperatorType, score: ventureFitScores.vision },
  ];

  scores.sort((a, b) => b.score - a.score);
  return scores[0].type;
}

// Determine secondary operator type (if within 0.4 threshold)
export function determineSecondaryFounderType(
  ventureFitScores: VentureFitScores,
  primaryType: OperatorType
): OperatorType | null {
  const typeScoreMap: Record<OperatorType, number> = {
    'Operational Leader': ventureFitScores.operator,
    'Product Architect': ventureFitScores.product,
    'Growth Catalyst': ventureFitScores.growth,
    'Visionary Builder': ventureFitScores.vision,
  };

  const primaryScore = typeScoreMap[primaryType];
  const otherTypes = (Object.entries(typeScoreMap) as [OperatorType, number][])
    .filter(([type]) => type !== primaryType)
    .sort((a, b) => b[1] - a[1]);

  const [secondType, secondScore] = otherTypes[0];
  
  if (primaryScore - secondScore <= 0.4) {
    return secondType;
  }
  
  return null;
}

// Get confidence level based on primary type's average score
export function getConfidenceLevel(score: number, trapAnalysis: TrapAnalysis): ConfidenceLevel {
  // Downgrade confidence if trap score is elevated
  if (trapAnalysis.level === 'likely_exaggeration') {
    return 'Emerging';
  }
  
  if (trapAnalysis.level === 'elevated') {
    if (score >= 4.0) return 'Moderate';
    return 'Emerging';
  }
  
  if (score >= 4.0) return 'Strong';
  if (score >= 3.4) return 'Moderate';
  return 'Emerging';
}

// Get the score for an operator type
function getOperatorTypeScore(type: OperatorType, ventureFitScores: VentureFitScores): number {
  const map: Record<OperatorType, number> = {
    'Operational Leader': ventureFitScores.operator,
    'Product Architect': ventureFitScores.product,
    'Growth Catalyst': ventureFitScores.growth,
    'Visionary Builder': ventureFitScores.vision,
  };
  return map[type];
}

// Generate summary based on operator type
export function generateSummary(
  name: string,
  operatorType: OperatorType,
  confidence: ConfidenceLevel,
  secondaryType: OperatorType | null,
  trapAnalysis: TrapAnalysis
): string {
  const readiness = confidence === 'Strong' ? 'Exceptional' : confidence;

  const baseSummaries: Record<OperatorType, string> = {
    'Operational Leader': `${name} shows a ${readiness} operator profile with a strong bias toward Operational Leader traits. They are most energized by building structure, managing complexity, and ensuring that plans actually get executed. This profile is well-suited to operationally intensive ventures where reliability, process, and follow-through are critical.`,
    'Product Architect': `${name} presents a ${readiness} operator profile with a dominant Product Architect orientation. They are naturally drawn to understanding users, mapping journeys, and turning insights into concrete product decisions. This makes them a strong fit for product-led ventures where differentiation comes from what is built and how it feels to use it.`,
    'Growth Catalyst': `${name} has a ${readiness} operator profile with a strong Growth Catalyst orientation. They are energized by talking to people, pitching ideas, building relationships, and getting traction. This profile is ideal for go-to-market heavy ventures that depend on sales, partnerships, and community to grow.`,
    'Visionary Builder': `${name} shows a ${readiness} operator profile with a strong Visionary Builder orientation. They think in missions, long-term direction, and the bigger story of what the venture could become. This profile is powerful for category-creating or long-horizon ventures where narrative, alignment, and ambition matter.`,
  };

  const hybridAdditions: Record<OperatorType, Record<OperatorType, string>> = {
    'Operational Leader': {
      'Product Architect': 'product thinking',
      'Growth Catalyst': 'sales and storytelling',
      'Visionary Builder': 'strategic vision',
    },
    'Product Architect': {
      'Operational Leader': 'execution discipline',
      'Growth Catalyst': 'growth and distribution',
      'Visionary Builder': 'long-term vision',
    },
    'Growth Catalyst': {
      'Operational Leader': 'operational excellence',
      'Product Architect': 'product thinking',
      'Visionary Builder': 'strategic direction',
    },
    'Visionary Builder': {
      'Operational Leader': 'operational grounding',
      'Product Architect': 'product expertise',
      'Growth Catalyst': 'growth execution',
    },
  } as Record<OperatorType, Record<OperatorType, string>>;

  let summary = '';
  
  if (secondaryType) {
    const secondaryFocus = hybridAdditions[operatorType][secondaryType];
    summary = `${name} shows a ${readiness} operator profile as an ${operatorType} with ${secondaryType} tendencies. They combine their primary strengths with secondary capabilities in ${secondaryFocus}, making them especially valuable in ventures that need both stable core execution and ${secondaryFocus}-style contribution.`;
  } else {
    summary = baseSummaries[operatorType];
  }

  // Add trap warning for admin visibility
  if (trapAnalysis.shouldFlag) {
    summary += ` [Note: High social desirability score detected (${trapAnalysis.trapScore}/20) - results may be inflated.]`;
  }

  return summary;
}

// Get strengths for operator type
export function getStrengths(operatorType: OperatorType): string[] {
  const strengthsMap: Record<OperatorType, string[]> = {
    'Operational Leader': [
      'High ownership and follow-through',
      'Strong bias for action and detail orientation',
      'Good at turning chaos into repeatable processes',
      'Reliable executor under pressure',
      'Naturally brings order to teams and projects',
    ],
    'Product Architect': [
      'Strong empathy for users and customer problems',
      'Thinks in features, flows, and product trade-offs',
      'Enjoys prototyping and iterating on MVPs',
      'Good at translating messy needs into clear product specs',
      'Often spots UX issues and friction before others',
    ],
    'Growth Catalyst': [
      'Strong communication and storytelling',
      'Comfortable with outreach, networking, and cold conversations',
      'Good at spotting opportunities and alliances',
      'Brings energy and momentum to the team',
      'Pushes the product in front of real users early',
    ],
    'Visionary Builder': [
      'Strong long-term vision and narrative',
      'Can rally people around a mission or cause',
      'Good at setting direction and high-level priorities',
      'Thinks in systems, markets, and multi-year outcomes',
      'Often acts as the "face" or storyteller of the venture',
    ],
  };

  return strengthsMap[operatorType];
}

// Get weaknesses for operator type
export function getWeaknesses(operatorType: OperatorType): string[] {
  const weaknessesMap: Record<OperatorType, string[]> = {
    'Operational Leader': [
      'May over-focus on internal process vs external opportunity',
      'Can be less comfortable with big unstructured vision work',
      'Might delay bold bets in favor of "what\'s proven"',
      'Risk of micromanaging if trust and delegation are underdeveloped',
    ],
    'Product Architect': [
      'May spend too long refining product vs pushing it to market',
      'Can underinvest in sales, growth, and distribution early on',
      'Risk of over-indexing on "nice to have" vs core value',
      'Might struggle in heavily operations-led environments',
    ],
    'Growth Catalyst': [
      'May under-focus on underlying systems, operations, or technical depth',
      'Risk of overselling relative to current product reality',
      'Might move on to "the next opportunity" too quickly',
      'Can become frustrated with slower, detail-heavy work',
    ],
    'Visionary Builder': [
      'May underinvest in details, systems, and operational reality',
      'Risk of "vision drift" without enough grounding in feedback',
      'Can move on mentally before the team has caught up',
      'Might struggle to translate big ideas into concrete next steps',
    ],
  };

  return weaknessesMap[operatorType];
}

// Generate weakness summary
export function generateWeaknessSummary(
  name: string,
  operatorType: OperatorType,
  secondaryType: OperatorType | null
): string {
  const summariesMap: Record<OperatorType, string> = {
    'Operational Leader': `The main development areas for this profile include making time for bigger-picture thinking, avoiding over-optimization of processes too early, and practicing delegation so they don't become a bottleneck. Supporting ${name} with a strong product or vision co-operator can unlock even more leverage.`,
    'Product Architect': `Key growth areas include balancing product craft with commercial urgency, staying close to sales and adoption metrics, and making sure they ship fast enough to learn from the market. Pairing ${name} with a Growth Catalyst or Operational Leader can create a well-rounded team.`,
    'Growth Catalyst': `${name} may benefit from strengthening execution discipline, staying tightly aligned with product and operations, and ensuring promises closely match reality. Partnering them with an Operational Leader or Product Architect helps turn generated demand into durable value.`,
    'Visionary Builder': `Development areas often include grounding the vision in near-term execution, staying close to operational and product realities, and building mechanisms for feedback and iteration. Surrounding ${name} with strong operators and product thinkers helps translate their vision into consistent progress.`,
  };

  return summariesMap[operatorType];
}

// Identify top traits from dimension scores
export function identifyTopTraits(dimensionScores: DimensionScores): string[] {
  const traits = [
    { name: 'Ownership', score: dimensionScores.ownership },
    { name: 'Execution', score: dimensionScores.execution },
    { name: 'Hustle', score: dimensionScores.hustle },
    { name: 'Problem-Solving', score: dimensionScores.problemSolving },
    { name: 'Leadership', score: dimensionScores.leadership },
  ];

  traits.sort((a, b) => b.score - a.score);
  return traits.slice(0, 3).map((t) => t.name);
}

// Main function to calculate complete assessment results
export function calculateAssessmentResults(
  responses: AssessmentResponse[],
  applicantName: string
): AssessmentResult {
  // Calculate trap analysis first
  const trapAnalysis = calculateTrapAnalysis(responses);
  
  // Calculate base dimension scores with reverse scoring
  let dimensionScores = calculateDimensionScores(responses);
  
  // Apply scenario adjustments to dimension scores
  dimensionScores = applyScenarioAdjustments(dimensionScores, responses);
  
  // Calculate venture fit scores
  let ventureFitScores = calculateVentureFitScores(responses);
  
  // Cross-validate venture fit with core traits
  ventureFitScores = validateVentureFitConsistency(ventureFitScores, dimensionScores);
  
  // Calculate style traits from forced choice
  const styleTraits = calculateStyleTraits(responses);
  
  // Calculate team compatibility from style traits and scenarios
  const teamCompatibilityScores = calculateTeamCompatibilityScores(styleTraits, responses);

  const primaryFounderType = determinePrimaryFounderType(ventureFitScores);
  const secondaryFounderType = determineSecondaryFounderType(ventureFitScores, primaryFounderType);
  
  const primaryScore = getOperatorTypeScore(primaryFounderType, ventureFitScores);
  const confidenceLevel = getConfidenceLevel(primaryScore, trapAnalysis);

  const summary = generateSummary(applicantName, primaryFounderType, confidenceLevel, secondaryFounderType, trapAnalysis);
  const strengths = getStrengths(primaryFounderType);
  const weaknesses = getWeaknesses(primaryFounderType);
  const weaknessSummary = generateWeaknessSummary(applicantName, primaryFounderType, secondaryFounderType);

  return {
    dimensionScores,
    ventureFitScores,
    teamCompatibilityScores,
    styleTraits,
    trapAnalysis,
    primaryFounderType,
    secondaryFounderType,
    confidenceLevel,
    summary,
    strengths,
    weaknesses,
    weaknessSummary,
  };
}
