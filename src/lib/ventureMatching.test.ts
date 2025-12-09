import { describe, it, expect } from 'vitest';
import {
  calculateVentureMatch,
  calculateAllVentureMatches,
  type AssessmentData,
  type VentureProfile,
  type DimensionScores,
  type VentureFitScores,
  type TeamCompatibilityScores,
} from './ventureMatching';

describe('ventureMatching', () => {
  // Test data factories
  const createAssessmentData = (overrides?: Partial<AssessmentData>): AssessmentData => ({
    dimensionScores: {
      ownership: 30,
      execution: 32,
      hustle: 28,
      problemSolving: 24,
      leadership: 26,
    },
    ventureFitScores: {
      operator: 4.0,
      product: 3.5,
      growth: 3.2,
      vision: 3.8,
    },
    teamCompatibilityScores: {
      workingStyle: 4,
      communication: 4,
      conflictResponse: 3.5,
      decisionMaking: 4,
      collaboration: 4,
    },
    primaryFounderType: 'Operational Leader',
    secondaryFounderType: null,
    ...overrides,
  });

  const createVentureProfile = (overrides?: Partial<VentureProfile>): VentureProfile => ({
    id: 'venture-1',
    name: 'Test Venture',
    description: 'A test venture',
    industry: 'Technology',
    ideal_operator_type: 'Operational Leader',
    secondary_operator_type: null,
    dimension_weights: {
      ownership: 0.8,
      execution: 0.9,
      hustle: 0.7,
      problemSolving: 0.6,
      leadership: 0.7,
    },
    team_profile: {
      workingStyle: 'structured',
      communication: 'direct',
      decisionMaking: 'data_driven',
    },
    suggested_roles: ['Operations Manager', 'Lead Coordinator', 'Director of Operations'],
    ...overrides,
  });

  describe('calculateVentureMatch', () => {
    describe('operator type scoring', () => {
      it('gives perfect score (100) when primary types match exactly', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Operational Leader',
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Operational Leader',
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.founderTypeScore).toBe(100);
      });

      it('gives 85 score when primary matches secondary ideal type', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Product Architect',
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Operational Leader',
          secondary_operator_type: 'Product Architect',
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.founderTypeScore).toBe(85);
      });

      it('gives 75 score when secondary matches ideal type', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Product Architect',
          secondaryFounderType: 'Operational Leader',
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Operational Leader',
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.founderTypeScore).toBe(75);
      });

      it('uses scoring matrix for partial matches', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Product Architect',
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Growth Catalyst',
        });

        const result = calculateVentureMatch(assessment, venture);

        // Product Architect -> Growth Catalyst = 65 in scoring matrix
        expect(result.founderTypeScore).toBe(65);
      });

      it('handles Growth Catalyst to Product Architect match', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Growth Catalyst',
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Product Architect',
        });

        const result = calculateVentureMatch(assessment, venture);

        // Growth Catalyst -> Product Architect = 70 in scoring matrix
        expect(result.founderTypeScore).toBe(70);
      });

      it('handles Visionary Builder matches', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Visionary Builder',
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Product Architect',
        });

        const result = calculateVentureMatch(assessment, venture);

        // Visionary Builder -> Product Architect = 70 in scoring matrix
        expect(result.founderTypeScore).toBe(70);
      });
    });

    describe('dimension scoring', () => {
      it('calculates weighted dimension scores correctly', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 40, // High
            execution: 40, // High
            hustle: 20, // Low
            problemSolving: 20, // Low
            leadership: 20, // Low
          },
        });
        const venture = createVentureProfile({
          dimension_weights: {
            ownership: 1.0, // High weight
            execution: 1.0, // High weight
            hustle: 0.5, // Low weight
            problemSolving: 0.5, // Low weight
            leadership: 0.5, // Low weight
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        // High scores in high-weight dimensions should yield high dimension score
        expect(result.dimensionScore).toBeGreaterThan(60);
      });

      it('normalizes dimension scores to 0-100 scale', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 50, // Max
            execution: 50, // Max
            hustle: 50, // Max
            problemSolving: 50, // Max
            leadership: 50, // Max
          },
        });
        const venture = createVentureProfile({
          dimension_weights: {
            ownership: 1.0,
            execution: 1.0,
            hustle: 1.0,
            problemSolving: 1.0,
            leadership: 1.0,
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        // Perfect scores should yield 100
        expect(result.dimensionScore).toBe(100);
      });

      it('handles zero dimension scores', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 0,
            execution: 0,
            hustle: 0,
            problemSolving: 0,
            leadership: 0,
          },
        });
        const venture = createVentureProfile();

        const result = calculateVentureMatch(assessment, venture);

        expect(result.dimensionScore).toBe(0);
      });

      it('applies dimension weights correctly', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 50,
            execution: 0,
            hustle: 0,
            problemSolving: 0,
            leadership: 0,
          },
        });
        const venture = createVentureProfile({
          dimension_weights: {
            ownership: 1.0, // Only ownership matters
            execution: 0.5, // Default weight when not specified
            hustle: 0.5,
            problemSolving: 0.5,
            leadership: 0.5,
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        // Ownership at 100, others at 0, weighted: (100*1.0 + 0*0.5*4) / (1.0 + 0.5*4) = 100/3 = 33.33
        expect(result.dimensionScore).toBeCloseTo(33, 0);
      });
    });

    describe('team compatibility scoring', () => {
      it('calculates compatibility with team profile', () => {
        const assessment = createAssessmentData({
          teamCompatibilityScores: {
            workingStyle: 5, // Max
            communication: 5, // Max
            conflictResponse: 5, // Max
            decisionMaking: 5, // Max
            collaboration: 5, // Max
          },
        });
        const venture = createVentureProfile({
          team_profile: {
            workingStyle: 'balanced', // 0.9 modifier
            communication: 'structured', // 0.9 modifier
            decisionMaking: 'analytical', // 0.9 modifier
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        // High scores with good modifiers should yield high compatibility
        expect(result.compatibilityScore).toBeGreaterThan(80);
      });

      it('normalizes team scores to 0-100 scale', () => {
        const assessment = createAssessmentData({
          teamCompatibilityScores: {
            workingStyle: 5,
            communication: 5,
            conflictResponse: 5,
            decisionMaking: 5,
            collaboration: 5,
          },
        });
        const venture = createVentureProfile({
          team_profile: {
            workingStyle: 'balanced', // No modifier defaults to 1
            communication: 'direct', // No modifier defaults to 1
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.compatibilityScore).toBeGreaterThan(0);
        expect(result.compatibilityScore).toBeLessThanOrEqual(100);
      });

      it('applies compatibility modifiers from team profile', () => {
        const assessment = createAssessmentData({
          teamCompatibilityScores: {
            workingStyle: 5,
            communication: 5,
            conflictResponse: 5,
            decisionMaking: 5,
            collaboration: 5,
          },
        });

        const ventureWithGoodModifiers = createVentureProfile({
          id: 'venture-good',
          team_profile: {
            workingStyle: 'balanced', // 0.9
            communication: 'structured', // 0.9
            decisionMaking: 'analytical', // 0.9
          },
        });

        const ventureWithPoorModifiers = createVentureProfile({
          id: 'venture-poor',
          team_profile: {
            workingStyle: 'creative_flexible', // 0.6
            communication: 'storytelling', // 0.6
            decisionMaking: 'instinct_based', // 0.6
          },
        });

        const resultGood = calculateVentureMatch(assessment, ventureWithGoodModifiers);
        const resultPoor = calculateVentureMatch(assessment, ventureWithPoorModifiers);

        expect(resultGood.compatibilityScore).toBeGreaterThan(resultPoor.compatibilityScore);
      });
    });

    describe('overall score calculation', () => {
      it('calculates weighted overall score (40% founder + 40% dimension + 20% compatibility)', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Operational Leader',
          dimensionScores: {
            ownership: 50,
            execution: 50,
            hustle: 50,
            problemSolving: 50,
            leadership: 50,
          },
          teamCompatibilityScores: {
            workingStyle: 5,
            communication: 5,
            conflictResponse: 5,
            decisionMaking: 5,
            collaboration: 5,
          },
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Operational Leader',
          dimension_weights: {
            ownership: 1,
            execution: 1,
            hustle: 1,
            problemSolving: 1,
            leadership: 1,
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        // Perfect match: 100*0.4 + 100*0.4 + ~high*0.2 = ~100
        expect(result.overallScore).toBeGreaterThan(90);
      });

      it('rounds overall score to integer', () => {
        const assessment = createAssessmentData();
        const venture = createVentureProfile();

        const result = calculateVentureMatch(assessment, venture);

        expect(Number.isInteger(result.overallScore)).toBe(true);
      });

      it('returns all score components rounded to integers', () => {
        const assessment = createAssessmentData();
        const venture = createVentureProfile();

        const result = calculateVentureMatch(assessment, venture);

        expect(Number.isInteger(result.founderTypeScore)).toBe(true);
        expect(Number.isInteger(result.dimensionScore)).toBe(true);
        expect(Number.isInteger(result.compatibilityScore)).toBe(true);
      });
    });

    describe('match reasons generation', () => {
      it('generates strong alignment reason for high founder type scores (≥85)', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Operational Leader',
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Operational Leader',
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.matchReasons).toContainEqual(
          expect.stringContaining('Strong Operational Leader profile aligns well')
        );
      });

      it('generates complement reason for moderate founder type scores (≥70)', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Product Architect',
          secondaryFounderType: 'Operational Leader',
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Operational Leader',
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.matchReasons).toContainEqual(
          expect.stringContaining('tendencies complement')
        );
      });

      it('generates execution match reason when execution is high and weighted', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 20,
            execution: 45, // High execution
            hustle: 20,
            problemSolving: 20,
            leadership: 20,
          },
        });
        const venture = createVentureProfile({
          dimension_weights: {
            execution: 0.95, // High weight
            ownership: 0.5,
            hustle: 0.5,
            problemSolving: 0.5,
            leadership: 0.5,
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.matchReasons).toContainEqual(
          expect.stringContaining('execution score matches')
        );
      });

      it('generates ownership match reason when ownership is high and weighted', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 45, // High ownership
            execution: 20,
            hustle: 20,
            problemSolving: 20,
            leadership: 20,
          },
        });
        const venture = createVentureProfile({
          dimension_weights: {
            ownership: 0.95, // High weight
            execution: 0.5,
            hustle: 0.5,
            problemSolving: 0.5,
            leadership: 0.5,
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.matchReasons).toContainEqual(
          expect.stringContaining('ownership mindset')
        );
      });

      it('generates general alignment reason when no specific matches', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Product Architect',
          dimensionScores: {
            ownership: 20,
            execution: 20,
            hustle: 20,
            problemSolving: 20,
            leadership: 20,
          },
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Growth Catalyst',
          dimension_weights: {
            ownership: 0.5,
            execution: 0.5,
            hustle: 0.5,
            problemSolving: 0.5,
            leadership: 0.5,
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.matchReasons).toContainEqual(
          expect.stringContaining('General profile alignment')
        );
      });
    });

    describe('concerns generation', () => {
      it('generates execution concern when execution is low but highly weighted', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 30,
            execution: 30, // Low execution
            hustle: 30,
            problemSolving: 30,
            leadership: 30,
          },
        });
        const venture = createVentureProfile({
          dimension_weights: {
            execution: 0.95, // High weight
            ownership: 0.5,
            hustle: 0.5,
            problemSolving: 0.5,
            leadership: 0.5,
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.concerns).toContainEqual(
          expect.stringContaining('execution support')
        );
      });

      it('generates ownership concern when ownership is low but highly weighted', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 30, // Low ownership
            execution: 40,
            hustle: 40,
            problemSolving: 40,
            leadership: 40,
          },
        });
        const venture = createVentureProfile({
          dimension_weights: {
            ownership: 0.95, // High weight
            execution: 0.5,
            hustle: 0.5,
            problemSolving: 0.5,
            leadership: 0.5,
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.concerns).toContainEqual(
          expect.stringContaining('accountability systems')
        );
      });

      it('generates leadership concern when leadership is low but highly weighted', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 40,
            execution: 40,
            hustle: 40,
            problemSolving: 40,
            leadership: 30, // Low leadership
          },
        });
        const venture = createVentureProfile({
          dimension_weights: {
            leadership: 0.95, // High weight
            ownership: 0.5,
            execution: 0.5,
            hustle: 0.5,
            problemSolving: 0.5,
          },
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.concerns).toContainEqual(
          expect.stringContaining('leadership development')
        );
      });

      it('generates operator type mismatch concern for low founder score', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Operational Leader',
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Visionary Builder', // Poor match
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.concerns).toContainEqual(
          expect.stringContaining('may require adaptation')
        );
      });

      it('generates communication concern when communication score is low', () => {
        const assessment = createAssessmentData({
          teamCompatibilityScores: {
            workingStyle: 4,
            communication: 2.5, // Low
            conflictResponse: 4,
            decisionMaking: 4,
            collaboration: 4,
          },
        });
        const venture = createVentureProfile();

        const result = calculateVentureMatch(assessment, venture);

        expect(result.concerns).toContainEqual(
          expect.stringContaining('Communication style')
        );
      });

      it('generates collaboration concern when collaboration score is low', () => {
        const assessment = createAssessmentData({
          teamCompatibilityScores: {
            workingStyle: 4,
            communication: 4,
            conflictResponse: 4,
            decisionMaking: 4,
            collaboration: 2.5, // Low
          },
        });
        const venture = createVentureProfile();

        const result = calculateVentureMatch(assessment, venture);

        expect(result.concerns).toContainEqual(
          expect.stringContaining('Collaboration approach')
        );
      });

      it('returns empty concerns array when all scores are good', () => {
        const assessment = createAssessmentData({
          primaryFounderType: 'Operational Leader',
          dimensionScores: {
            ownership: 40,
            execution: 40,
            hustle: 40,
            problemSolving: 40,
            leadership: 40,
          },
          teamCompatibilityScores: {
            workingStyle: 4,
            communication: 4,
            conflictResponse: 4,
            decisionMaking: 4,
            collaboration: 4,
          },
        });
        const venture = createVentureProfile({
          ideal_operator_type: 'Operational Leader',
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.concerns).toHaveLength(0);
      });
    });

    describe('suggested role selection', () => {
      it('selects role based on top dimension - ownership prefers Lead/Manager/Director', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 45, // Highest
            execution: 30,
            hustle: 25,
            problemSolving: 20,
            leadership: 20,
          },
        });
        const venture = createVentureProfile({
          suggested_roles: ['Junior Associate', 'Lead Coordinator', 'Analyst'],
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.suggestedRole).toBe('Lead Coordinator');
      });

      it('selects role based on execution - prefers Operations/Manager/Coordinator', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 20,
            execution: 45, // Highest
            hustle: 25,
            problemSolving: 20,
            leadership: 20,
          },
        });
        const venture = createVentureProfile({
          suggested_roles: ['Sales Lead', 'Operations Manager', 'Product Designer'],
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.suggestedRole).toBe('Operations Manager');
      });

      it('selects role based on hustle - prefers Growth/BD/Sales', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 20,
            execution: 25,
            hustle: 45, // Highest
            problemSolving: 20,
            leadership: 20,
          },
        });
        const venture = createVentureProfile({
          suggested_roles: ['Operations Manager', 'Growth Lead', 'Technical Lead'],
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.suggestedRole).toBe('Growth Lead');
      });

      it('returns first role when no keyword match found', () => {
        const assessment = createAssessmentData({
          dimensionScores: {
            ownership: 40,
            execution: 30,
            hustle: 25,
            problemSolving: 20,
            leadership: 20,
          },
        });
        const venture = createVentureProfile({
          suggested_roles: ['Junior Associate', 'Analyst', 'Specialist'],
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.suggestedRole).toBe('Junior Associate');
      });

      it('returns General Operator when no roles available', () => {
        const assessment = createAssessmentData();
        const venture = createVentureProfile({
          suggested_roles: [],
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.suggestedRole).toBe('General Operator');
      });
    });

    describe('result structure', () => {
      it('returns complete match result with all required fields', () => {
        const assessment = createAssessmentData();
        const venture = createVentureProfile();

        const result = calculateVentureMatch(assessment, venture);

        expect(result).toHaveProperty('ventureId');
        expect(result).toHaveProperty('ventureName');
        expect(result).toHaveProperty('industry');
        expect(result).toHaveProperty('overallScore');
        expect(result).toHaveProperty('founderTypeScore');
        expect(result).toHaveProperty('dimensionScore');
        expect(result).toHaveProperty('compatibilityScore');
        expect(result).toHaveProperty('matchReasons');
        expect(result).toHaveProperty('concerns');
        expect(result).toHaveProperty('suggestedRole');
      });

      it('includes correct venture metadata', () => {
        const assessment = createAssessmentData();
        const venture = createVentureProfile({
          id: 'test-123',
          name: 'Amazing Startup',
          industry: 'FinTech',
        });

        const result = calculateVentureMatch(assessment, venture);

        expect(result.ventureId).toBe('test-123');
        expect(result.ventureName).toBe('Amazing Startup');
        expect(result.industry).toBe('FinTech');
      });
    });
  });

  describe('calculateAllVentureMatches', () => {
    it('calculates matches for all ventures', () => {
      const assessment = createAssessmentData();
      const ventures = [
        createVentureProfile({ id: 'v1', name: 'Venture 1' }),
        createVentureProfile({ id: 'v2', name: 'Venture 2' }),
        createVentureProfile({ id: 'v3', name: 'Venture 3' }),
      ];

      const results = calculateAllVentureMatches(assessment, ventures);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('ventureId');
      expect(results[1]).toHaveProperty('ventureId');
      expect(results[2]).toHaveProperty('ventureId');
    });

    it('sorts matches by overall score in descending order', () => {
      const assessment = createAssessmentData({
        primaryFounderType: 'Operational Leader',
      });

      const ventures = [
        createVentureProfile({
          id: 'low-match',
          name: 'Low Match',
          ideal_operator_type: 'Visionary Builder', // Poor match
        }),
        createVentureProfile({
          id: 'high-match',
          name: 'High Match',
          ideal_operator_type: 'Operational Leader', // Perfect match
        }),
        createVentureProfile({
          id: 'medium-match',
          name: 'Medium Match',
          ideal_operator_type: 'Product Architect', // Medium match
        }),
      ];

      const results = calculateAllVentureMatches(assessment, ventures);

      expect(results[0].ventureId).toBe('high-match');
      expect(results[2].ventureId).toBe('low-match');
      expect(results[0].overallScore).toBeGreaterThan(results[1].overallScore);
      expect(results[1].overallScore).toBeGreaterThan(results[2].overallScore);
    });

    it('handles empty venture list', () => {
      const assessment = createAssessmentData();
      const ventures: VentureProfile[] = [];

      const results = calculateAllVentureMatches(assessment, ventures);

      expect(results).toHaveLength(0);
    });

    it('handles single venture', () => {
      const assessment = createAssessmentData();
      const ventures = [createVentureProfile()];

      const results = calculateAllVentureMatches(assessment, ventures);

      expect(results).toHaveLength(1);
    });

    it('maintains all match data for each venture', () => {
      const assessment = createAssessmentData();
      const ventures = [
        createVentureProfile({ id: 'v1' }),
        createVentureProfile({ id: 'v2' }),
      ];

      const results = calculateAllVentureMatches(assessment, ventures);

      results.forEach(result => {
        expect(result).toHaveProperty('matchReasons');
        expect(result).toHaveProperty('concerns');
        expect(result).toHaveProperty('suggestedRole');
        expect(result).toHaveProperty('founderTypeScore');
        expect(result).toHaveProperty('dimensionScore');
        expect(result).toHaveProperty('compatibilityScore');
      });
    });

    it('sorts correctly with tie scores', () => {
      const assessment = createAssessmentData({
        primaryFounderType: 'Operational Leader',
      });

      // Create ventures that should have same or very similar scores
      const ventures = [
        createVentureProfile({
          id: 'v1',
          ideal_operator_type: 'Operational Leader',
        }),
        createVentureProfile({
          id: 'v2',
          ideal_operator_type: 'Operational Leader',
        }),
      ];

      const results = calculateAllVentureMatches(assessment, ventures);

      expect(results).toHaveLength(2);
      // With identical profiles, scores should be very similar
      expect(Math.abs(results[0].overallScore - results[1].overallScore)).toBeLessThan(5);
    });

    it('preserves individual venture characteristics in sorted results', () => {
      const assessment = createAssessmentData();
      const ventures = [
        createVentureProfile({
          id: 'tech-startup',
          name: 'Tech Startup',
          industry: 'Technology',
        }),
        createVentureProfile({
          id: 'finance-co',
          name: 'Finance Co',
          industry: 'Finance',
        }),
      ];

      const results = calculateAllVentureMatches(assessment, ventures);

      const techResult = results.find(r => r.ventureId === 'tech-startup');
      const financeResult = results.find(r => r.ventureId === 'finance-co');

      expect(techResult?.ventureName).toBe('Tech Startup');
      expect(techResult?.industry).toBe('Technology');
      expect(financeResult?.ventureName).toBe('Finance Co');
      expect(financeResult?.industry).toBe('Finance');
    });
  });

  describe('integration scenarios', () => {
    it('correctly ranks a perfect match highest', () => {
      const assessment = createAssessmentData({
        primaryFounderType: 'Product Architect',
        dimensionScores: {
          ownership: 45,
          execution: 40,
          hustle: 35,
          problemSolving: 45,
          leadership: 38,
        },
        teamCompatibilityScores: {
          workingStyle: 5,
          communication: 5,
          conflictResponse: 4.5,
          decisionMaking: 5,
          collaboration: 5,
        },
      });

      const ventures = [
        createVentureProfile({
          id: 'mismatch',
          ideal_operator_type: 'Growth Catalyst',
          dimension_weights: {
            ownership: 0.5,
            execution: 0.5,
            hustle: 1.0,
            problemSolving: 0.5,
            leadership: 0.7,
          },
        }),
        createVentureProfile({
          id: 'perfect',
          ideal_operator_type: 'Product Architect',
          dimension_weights: {
            ownership: 0.9,
            execution: 0.8,
            hustle: 0.6,
            problemSolving: 1.0,
            leadership: 0.8,
          },
          team_profile: {
            workingStyle: 'balanced',
            communication: 'structured',
            decisionMaking: 'analytical',
          },
        }),
      ];

      const results = calculateAllVentureMatches(assessment, ventures);

      expect(results[0].ventureId).toBe('perfect');
      expect(results[0].overallScore).toBeGreaterThan(results[1].overallScore);
    });

    it('generates appropriate concerns for mismatched profiles', () => {
      const assessment = createAssessmentData({
        primaryFounderType: 'Growth Catalyst',
        dimensionScores: {
          ownership: 25,
          execution: 28,
          hustle: 45,
          problemSolving: 22,
          leadership: 26,
        },
        teamCompatibilityScores: {
          workingStyle: 4,
          communication: 2.5,
          conflictResponse: 3,
          decisionMaking: 4,
          collaboration: 2.5,
        },
      });

      const venture = createVentureProfile({
        ideal_operator_type: 'Operational Leader',
        dimension_weights: {
          ownership: 1.0,
          execution: 1.0,
          hustle: 0.5,
          problemSolving: 0.7,
          leadership: 0.9,
        },
      });

      const result = calculateVentureMatch(assessment, venture);

      // Should have multiple concerns
      expect(result.concerns.length).toBeGreaterThan(0);
      expect(result.concerns).toContainEqual(expect.stringContaining('execution'));
      expect(result.concerns).toContainEqual(expect.stringContaining('accountability'));
    });
  });
});
