// Assessment Scoring Utility - Implements all scoring logic and templates

export interface AssessmentResponse {
  question_id: string;
  question_number: number;
  response: number;
  dimension: string;
  sub_dimension?: string;
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

export type OperatorType = 'Operational Leader' | 'Product Architect' | 'Growth Catalyst' | 'Visionary Builder';
export type ConfidenceLevel = 'Strong' | 'Moderate' | 'Emerging';

export interface AssessmentResult {
  dimensionScores: DimensionScores;
  ventureFitScores: VentureFitScores;
  teamCompatibilityScores: TeamCompatibilityScores;
  primaryFounderType: OperatorType;
  secondaryFounderType: OperatorType | null;
  confidenceLevel: ConfidenceLevel;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  weaknessSummary: string;
}

// Calculate core dimension scores (sum of responses for each dimension)
export function calculateDimensionScores(responses: AssessmentResponse[]): DimensionScores {
  const scores: DimensionScores = {
    ownership: 0,
    execution: 0,
    hustle: 0,
    problemSolving: 0,
    leadership: 0,
  };

  responses.forEach((r) => {
    if (r.question_number >= 1 && r.question_number <= 10) {
      scores.ownership += r.response;
    } else if (r.question_number >= 11 && r.question_number <= 20) {
      scores.execution += r.response;
    } else if (r.question_number >= 21 && r.question_number <= 30) {
      scores.hustle += r.response;
    } else if (r.question_number >= 31 && r.question_number <= 40) {
      scores.problemSolving += r.response;
    } else if (r.question_number >= 41 && r.question_number <= 50) {
      scores.leadership += r.response;
    }
  });

  return scores;
}

// Calculate venture fit scores (averaged to 1-5 scale)
export function calculateVentureFitScores(responses: AssessmentResponse[]): VentureFitScores {
  let operatorRaw = 0;
  let productRaw = 0;
  let growthRaw = 0;
  let visionRaw = 0;

  responses.forEach((r) => {
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

// Calculate team compatibility scores
export function calculateTeamCompatibilityScores(responses: AssessmentResponse[]): TeamCompatibilityScores {
  const subDimensionMap: Record<string, number[]> = {
    workingStyle: [61, 62, 63],
    communication: [64, 65],
    conflictResponse: [66, 67],
    decisionMaking: [68, 69],
    collaboration: [70],
  };

  const scores: TeamCompatibilityScores = {
    workingStyle: 0,
    communication: 0,
    conflictResponse: 0,
    decisionMaking: 0,
    collaboration: 0,
  };

  Object.entries(subDimensionMap).forEach(([key, questionNumbers]) => {
    let sum = 0;
    questionNumbers.forEach((qNum) => {
      const response = responses.find((r) => r.question_number === qNum);
      if (response) {
        sum += response.response;
      }
    });
    scores[key as keyof TeamCompatibilityScores] = sum / questionNumbers.length;
  });

  return scores;
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
export function getConfidenceLevel(score: number): ConfidenceLevel {
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
  secondaryType: OperatorType | null
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

  if (secondaryType) {
    const secondaryFocus = hybridAdditions[operatorType][secondaryType];
    return `${name} shows a ${readiness} operator profile as an ${operatorType} with ${secondaryType} tendencies. They combine their primary strengths with secondary capabilities in ${secondaryFocus}, making them especially valuable in ventures that need both stable core execution and ${secondaryFocus}-style contribution.`;
  }

  return baseSummaries[operatorType];
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
  const dimensionScores = calculateDimensionScores(responses);
  const ventureFitScores = calculateVentureFitScores(responses);
  const teamCompatibilityScores = calculateTeamCompatibilityScores(responses);

  const primaryFounderType = determinePrimaryFounderType(ventureFitScores);
  const secondaryFounderType = determineSecondaryFounderType(ventureFitScores, primaryFounderType);
  
  const primaryScore = getOperatorTypeScore(primaryFounderType, ventureFitScores);
  const confidenceLevel = getConfidenceLevel(primaryScore);

  const summary = generateSummary(applicantName, primaryFounderType, confidenceLevel, secondaryFounderType);
  const strengths = getStrengths(primaryFounderType);
  const weaknesses = getWeaknesses(primaryFounderType);
  const weaknessSummary = generateWeaknessSummary(applicantName, primaryFounderType, secondaryFounderType);

  return {
    dimensionScores,
    ventureFitScores,
    teamCompatibilityScores,
    primaryFounderType,
    secondaryFounderType,
    confidenceLevel,
    summary,
    strengths,
    weaknesses,
    weaknessSummary,
  };
}
