// Venture Matching Algorithm
// Hybrid scoring: 40% Founder Type + 40% Dimension Match + 20% Team Compatibility

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

export interface VentureProfile {
  id: string;
  name: string;
  description: string;
  industry: string;
  ideal_operator_type: string;
  secondary_operator_type: string | null;
  dimension_weights: Record<string, number>;
  team_profile: Record<string, string>;
  suggested_roles: string[];
}

export interface AssessmentData {
  dimensionScores: DimensionScores;
  ventureFitScores: VentureFitScores;
  teamCompatibilityScores: TeamCompatibilityScores;
  primaryFounderType: string;
  secondaryFounderType: string | null;
}

export interface VentureMatchResult {
  ventureId: string;
  ventureName: string;
  industry: string;
  overallScore: number;
  founderTypeScore: number;
  dimensionScore: number;
  compatibilityScore: number;
  matchReasons: string[];
  concerns: string[];
  suggestedRole: string;
}

// Weight constants
const WEIGHTS = {
  FOUNDER_TYPE: 0.4,
  DIMENSION: 0.4,
  COMPATIBILITY: 0.2,
};

// Operator type scoring matrix
const OPERATOR_TYPE_SCORES: Record<string, Record<string, number>> = {
  'Operational Leader': {
    'Operational Leader': 100,
    'Product Architect': 60,
    'Growth Catalyst': 55,
    'Visionary Builder': 50,
  },
  'Product Architect': {
    'Product Architect': 100,
    'Visionary Builder': 70,
    'Growth Catalyst': 65,
    'Operational Leader': 55,
  },
  'Growth Catalyst': {
    'Growth Catalyst': 100,
    'Product Architect': 70,
    'Visionary Builder': 65,
    'Operational Leader': 60,
  },
  'Visionary Builder': {
    'Visionary Builder': 100,
    'Product Architect': 70,
    'Growth Catalyst': 70,
    'Operational Leader': 55,
  },
};

// Team profile compatibility mapping
const TEAM_COMPATIBILITY_MAP: Record<string, Record<string, number>> = {
  workingStyle: {
    structured: 0.8,
    high_autonomy: 0.7,
    balanced: 0.9,
    creative_flexible: 0.6,
  },
  communication: {
    direct: 0.8,
    frequent: 0.7,
    structured: 0.9,
    storytelling: 0.6,
  },
  decisionMaking: {
    analytical: 0.9,
    data_driven: 0.85,
    instinct_based: 0.6,
    quick: 0.7,
  },
};

/**
 * Calculate operator type score (40% of total)
 */
function calculateOperatorTypeScore(
  applicantPrimary: string,
  applicantSecondary: string | null,
  ventureIdeal: string,
  ventureSecondary: string | null
): number {
  let score = 40; // Base score

  // Primary match with ideal
  if (applicantPrimary === ventureIdeal) {
    score = 100;
  } else if (ventureSecondary && applicantPrimary === ventureSecondary) {
    score = 85;
  } else if (applicantSecondary && applicantSecondary === ventureIdeal) {
    score = 75;
  } else {
    // Use scoring matrix for partial matches
    score = OPERATOR_TYPE_SCORES[applicantPrimary]?.[ventureIdeal] || 50;
  }

  return score;
}

/**
 * Calculate dimension score (40% of total)
 */
function calculateDimensionScore(
  dimensionScores: DimensionScores,
  ventureWeights: Record<string, number>
): number {
  const dimensions: (keyof DimensionScores)[] = [
    'ownership',
    'execution',
    'hustle',
    'problemSolving',
    'leadership',
  ];

  let weightedScore = 0;
  let totalWeight = 0;

  dimensions.forEach((dim) => {
    const weight = ventureWeights[dim] || 0.5;
    const score = (dimensionScores[dim] / 50) * 100; // Normalize to 0-100
    weightedScore += score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedScore / totalWeight : 50;
}

/**
 * Calculate team compatibility score (20% of total)
 */
function calculateCompatibilityScore(
  teamScores: TeamCompatibilityScores,
  ventureTeamProfile: Record<string, string>
): number {
  const teamDimensions: (keyof TeamCompatibilityScores)[] = [
    'workingStyle',
    'communication',
    'conflictResponse',
    'decisionMaking',
    'collaboration',
  ];

  let totalScore = 0;
  let count = 0;

  teamDimensions.forEach((dim) => {
    const applicantScore = (teamScores[dim] / 5) * 100; // Normalize to 0-100
    const venturePreference = ventureTeamProfile[dim];
    
    // Apply compatibility modifier if exists
    const modifier = TEAM_COMPATIBILITY_MAP[dim]?.[venturePreference] || 1;
    totalScore += applicantScore * modifier;
    count++;
  });

  return count > 0 ? totalScore / count : 50;
}

/**
 * Generate match reasons based on scores
 */
function generateMatchReasons(
  assessmentData: AssessmentData,
  venture: VentureProfile,
  founderTypeScore: number,
  dimensionScore: number
): string[] {
  const reasons: string[] = [];
  const { dimensionScores, primaryFounderType } = assessmentData;

  // Operator type alignment
  if (founderTypeScore >= 85) {
    reasons.push(
      `Strong ${primaryFounderType} profile aligns well with ${venture.name}'s operational needs`
    );
  } else if (founderTypeScore >= 70) {
    reasons.push(
      `${primaryFounderType} tendencies complement ${venture.name}'s team structure`
    );
  }

  // Dimension-specific reasons
  const weights = venture.dimension_weights;
  
  if (weights.execution >= 0.9 && dimensionScores.execution >= 40) {
    reasons.push('High execution score matches the venture\'s fast-paced environment');
  }
  if (weights.ownership >= 0.9 && dimensionScores.ownership >= 40) {
    reasons.push('Strong ownership mindset suits the autonomous role requirements');
  }
  if (weights.hustle >= 0.9 && dimensionScores.hustle >= 40) {
    reasons.push('Entrepreneurial hustle aligns with growth-stage needs');
  }
  if (weights.problemSolving >= 0.9 && dimensionScores.problemSolving >= 40) {
    reasons.push('Problem-solving capabilities match operational complexity');
  }
  if (weights.leadership >= 0.9 && dimensionScores.leadership >= 40) {
    reasons.push('Leadership skills suit the team management responsibilities');
  }

  // Industry fit
  if (dimensionScore >= 75) {
    reasons.push(`Overall dimension profile strongly matches ${venture.industry} requirements`);
  }

  return reasons.length > 0 ? reasons : ['General profile alignment with venture needs'];
}

/**
 * Generate concerns/gaps based on scores
 */
function generateConcerns(
  assessmentData: AssessmentData,
  venture: VentureProfile,
  founderTypeScore: number,
  dimensionScore: number
): string[] {
  const concerns: string[] = [];
  const { dimensionScores, teamCompatibilityScores } = assessmentData;
  const weights = venture.dimension_weights;

  // Low dimension scores for high-weight areas
  if (weights.execution >= 0.9 && dimensionScores.execution < 35) {
    concerns.push('May need execution support or structured processes');
  }
  if (weights.ownership >= 0.9 && dimensionScores.ownership < 35) {
    concerns.push('Consider pairing with strong accountability systems');
  }
  if (weights.leadership >= 0.9 && dimensionScores.leadership < 35) {
    concerns.push('May benefit from leadership development or co-lead structure');
  }

  // Operator type mismatch
  if (founderTypeScore < 60) {
    concerns.push(
      `${assessmentData.primaryFounderType} style may require adaptation for this role`
    );
  }

  // Team compatibility concerns
  if (teamCompatibilityScores.communication < 3) {
    concerns.push('Communication style may need alignment with team norms');
  }
  if (teamCompatibilityScores.collaboration < 3) {
    concerns.push('Collaboration approach may require adjustment');
  }

  return concerns;
}

/**
 * Select best suggested role based on profile
 */
function selectSuggestedRole(
  assessmentData: AssessmentData,
  venture: VentureProfile
): string {
  const { dimensionScores, primaryFounderType } = assessmentData;
  const roles = venture.suggested_roles;

  if (roles.length === 0) return 'General Operator';

  // Role selection based on founder type and top dimensions
  const topDimension = Object.entries(dimensionScores).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];

  // Map dimension to preferred role keywords
  const roleKeywords: Record<string, string[]> = {
    ownership: ['Lead', 'Manager', 'Director'],
    execution: ['Operations', 'Manager', 'Coordinator'],
    hustle: ['Growth', 'Business Development', 'Sales'],
    problemSolving: ['Strategy', 'Operations', 'Logistics'],
    leadership: ['Lead', 'Head', 'Director'],
  };

  const preferredKeywords = roleKeywords[topDimension] || [];

  // Find matching role
  for (const role of roles) {
    for (const keyword of preferredKeywords) {
      if (role.toLowerCase().includes(keyword.toLowerCase())) {
        return role;
      }
    }
  }

  return roles[0]; // Default to first role
}

/**
 * Calculate match for a single venture
 */
export function calculateVentureMatch(
  assessmentData: AssessmentData,
  venture: VentureProfile
): VentureMatchResult {
  const founderTypeScore = calculateOperatorTypeScore(
    assessmentData.primaryFounderType,
    assessmentData.secondaryFounderType,
    venture.ideal_operator_type,
    venture.secondary_operator_type
  );

  const dimensionScore = calculateDimensionScore(
    assessmentData.dimensionScores,
    venture.dimension_weights
  );

  const compatibilityScore = calculateCompatibilityScore(
    assessmentData.teamCompatibilityScores,
    venture.team_profile
  );

  // Weighted overall score
  const overallScore = Math.round(
    founderTypeScore * WEIGHTS.FOUNDER_TYPE +
    dimensionScore * WEIGHTS.DIMENSION +
    compatibilityScore * WEIGHTS.COMPATIBILITY
  );

  const matchReasons = generateMatchReasons(
    assessmentData,
    venture,
    founderTypeScore,
    dimensionScore
  );

  const concerns = generateConcerns(
    assessmentData,
    venture,
    founderTypeScore,
    dimensionScore
  );

  const suggestedRole = selectSuggestedRole(assessmentData, venture);

  return {
    ventureId: venture.id,
    ventureName: venture.name,
    industry: venture.industry,
    overallScore,
    founderTypeScore: Math.round(founderTypeScore),
    dimensionScore: Math.round(dimensionScore),
    compatibilityScore: Math.round(compatibilityScore),
    matchReasons,
    concerns,
    suggestedRole,
  };
}

/**
 * Calculate matches for all ventures and rank them
 */
export function calculateAllVentureMatches(
  assessmentData: AssessmentData,
  ventures: VentureProfile[]
): VentureMatchResult[] {
  const matches = ventures.map((venture) =>
    calculateVentureMatch(assessmentData, venture)
  );

  // Sort by overall score descending
  return matches.sort((a, b) => b.overallScore - a.overallScore);
}
