import { describe, it, expect } from 'vitest';
import {
  calculateTrapAnalysis,
  calculateDimensionScores,
  applyScenarioAdjustments,
  calculateVentureFitScores,
  calculateStyleTraits,
  calculateTeamCompatibilityScores,
  determinePrimaryFounderType,
  determineSecondaryFounderType,
  getConfidenceLevel,
  generateSummary,
  getStrengths,
  getWeaknesses,
  generateWeaknessSummary,
  identifyTopTraits,
  calculateAssessmentResults,
  type AssessmentResponse,
  type DimensionScores,
  type VentureFitScores,
  type StyleTraits,
} from './assessmentScoring';

describe('assessmentScoring', () => {
  describe('calculateTrapAnalysis', () => {
    it('returns normal level for no trap questions', () => {
      const responses: AssessmentResponse[] = [];
      const result = calculateTrapAnalysis(responses);

      expect(result).toEqual({
        trapScore: 0,
        level: 'normal',
        shouldFlag: false,
      });
    });

    it('returns normal level for low trap scores (≤10)', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '37', question_number: 37, response: 2, dimension: 'trap', is_trap: true },
        { question_id: '38', question_number: 38, response: 2, dimension: 'trap', is_trap: true },
        { question_id: '39', question_number: 39, response: 3, dimension: 'trap', is_trap: true },
        { question_id: '40', question_number: 40, response: 3, dimension: 'trap', is_trap: true },
      ];
      const result = calculateTrapAnalysis(responses);

      expect(result.trapScore).toBe(10);
      expect(result.level).toBe('normal');
      expect(result.shouldFlag).toBe(false);
    });

    it('returns elevated level for trap scores 11-15', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '37', question_number: 37, response: 3, dimension: 'trap', is_trap: true },
        { question_id: '38', question_number: 38, response: 3, dimension: 'trap', is_trap: true },
        { question_id: '39', question_number: 39, response: 3, dimension: 'trap', is_trap: true },
        { question_id: '40', question_number: 40, response: 3, dimension: 'trap', is_trap: true },
      ];
      const result = calculateTrapAnalysis(responses);

      expect(result.trapScore).toBe(12);
      expect(result.level).toBe('elevated');
      expect(result.shouldFlag).toBe(true);
    });

    it('returns likely_exaggeration level for trap scores ≥16', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '37', question_number: 37, response: 4, dimension: 'trap', is_trap: true },
        { question_id: '38', question_number: 38, response: 4, dimension: 'trap', is_trap: true },
        { question_id: '39', question_number: 39, response: 4, dimension: 'trap', is_trap: true },
        { question_id: '40', question_number: 40, response: 4, dimension: 'trap', is_trap: true },
      ];
      const result = calculateTrapAnalysis(responses);

      expect(result.trapScore).toBe(16);
      expect(result.level).toBe('likely_exaggeration');
      expect(result.shouldFlag).toBe(true);
    });

    it('filters out non-trap questions', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '1', question_number: 1, response: 5, dimension: 'ownership', is_trap: false },
        { question_id: '37', question_number: 37, response: 4, dimension: 'trap', is_trap: true },
        { question_id: '38', question_number: 38, response: 4, dimension: 'trap', is_trap: true },
      ];
      const result = calculateTrapAnalysis(responses);

      expect(result.trapScore).toBe(8); // Only counts trap questions
    });

    it('filters out string responses', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '37', question_number: 37, response: 'A', dimension: 'trap', is_trap: true },
        { question_id: '38', question_number: 38, response: 4, dimension: 'trap', is_trap: true },
      ];
      const result = calculateTrapAnalysis(responses);

      expect(result.trapScore).toBe(4); // Only counts numeric responses
    });
  });

  describe('calculateDimensionScores', () => {
    it('calculates ownership scores (Q1-8)', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '1', question_number: 1, response: 4, dimension: 'ownership', question_type: 'likert' },
        { question_id: '2', question_number: 2, response: 5, dimension: 'ownership', question_type: 'likert' },
        { question_id: '3', question_number: 3, response: 3, dimension: 'ownership', question_type: 'likert' },
        { question_id: '4', question_number: 4, response: 4, dimension: 'ownership', question_type: 'likert' },
        { question_id: '5', question_number: 5, response: 4, dimension: 'ownership', question_type: 'likert' },
        { question_id: '6', question_number: 6, response: 5, dimension: 'ownership', question_type: 'likert' },
        { question_id: '7', question_number: 7, response: 3, dimension: 'ownership', question_type: 'likert' },
        { question_id: '8', question_number: 8, response: 4, dimension: 'ownership', question_type: 'likert' },
      ];
      const result = calculateDimensionScores(responses);

      expect(result.ownership).toBe(32); // 4+5+3+4+4+5+3+4
    });

    it('applies reverse scoring when is_reverse is true', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '1', question_number: 1, response: 5, dimension: 'ownership', question_type: 'likert', is_reverse: false },
        { question_id: '2', question_number: 2, response: 5, dimension: 'ownership', question_type: 'likert', is_reverse: true },
      ];
      const result = calculateDimensionScores(responses);

      expect(result.ownership).toBe(6); // 5 + (6-5) = 6
    });

    it('calculates execution scores (Q9-16)', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '9', question_number: 9, response: 4, dimension: 'execution', question_type: 'likert' },
        { question_id: '10', question_number: 10, response: 4, dimension: 'execution', question_type: 'likert' },
        { question_id: '11', question_number: 11, response: 4, dimension: 'execution', question_type: 'likert' },
        { question_id: '12', question_number: 12, response: 4, dimension: 'execution', question_type: 'likert' },
        { question_id: '13', question_number: 13, response: 4, dimension: 'execution', question_type: 'likert' },
        { question_id: '14', question_number: 14, response: 4, dimension: 'execution', question_type: 'likert' },
        { question_id: '15', question_number: 15, response: 4, dimension: 'execution', question_type: 'likert' },
        { question_id: '16', question_number: 16, response: 4, dimension: 'execution', question_type: 'likert' },
      ];
      const result = calculateDimensionScores(responses);

      expect(result.execution).toBe(32);
    });

    it('calculates hustle scores (Q17-24)', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '17', question_number: 17, response: 3, dimension: 'hustle', question_type: 'likert' },
        { question_id: '18', question_number: 18, response: 3, dimension: 'hustle', question_type: 'likert' },
        { question_id: '19', question_number: 19, response: 3, dimension: 'hustle', question_type: 'likert' },
        { question_id: '20', question_number: 20, response: 3, dimension: 'hustle', question_type: 'likert' },
        { question_id: '21', question_number: 21, response: 3, dimension: 'hustle', question_type: 'likert' },
        { question_id: '22', question_number: 22, response: 3, dimension: 'hustle', question_type: 'likert' },
        { question_id: '23', question_number: 23, response: 3, dimension: 'hustle', question_type: 'likert' },
        { question_id: '24', question_number: 24, response: 3, dimension: 'hustle', question_type: 'likert' },
      ];
      const result = calculateDimensionScores(responses);

      expect(result.hustle).toBe(24);
    });

    it('calculates problem-solving scores (Q25-30)', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '25', question_number: 25, response: 5, dimension: 'problemSolving', question_type: 'likert' },
        { question_id: '26', question_number: 26, response: 5, dimension: 'problemSolving', question_type: 'likert' },
        { question_id: '27', question_number: 27, response: 5, dimension: 'problemSolving', question_type: 'likert' },
        { question_id: '28', question_number: 28, response: 5, dimension: 'problemSolving', question_type: 'likert' },
        { question_id: '29', question_number: 29, response: 5, dimension: 'problemSolving', question_type: 'likert' },
        { question_id: '30', question_number: 30, response: 5, dimension: 'problemSolving', question_type: 'likert' },
      ];
      const result = calculateDimensionScores(responses);

      expect(result.problemSolving).toBe(30);
    });

    it('calculates leadership scores (Q31-36)', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '31', question_number: 31, response: 4, dimension: 'leadership', question_type: 'likert' },
        { question_id: '32', question_number: 32, response: 4, dimension: 'leadership', question_type: 'likert' },
        { question_id: '33', question_number: 33, response: 4, dimension: 'leadership', question_type: 'likert' },
        { question_id: '34', question_number: 34, response: 4, dimension: 'leadership', question_type: 'likert' },
        { question_id: '35', question_number: 35, response: 4, dimension: 'leadership', question_type: 'likert' },
        { question_id: '36', question_number: 36, response: 4, dimension: 'leadership', question_type: 'likert' },
      ];
      const result = calculateDimensionScores(responses);

      expect(result.leadership).toBe(24);
    });

    it('handles mixed construct questions (Q41-50) with weighted contributions', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '41', question_number: 41, response: 4, dimension: 'mixed', question_type: 'likert' }, // execution * 0.5
        { question_id: '42', question_number: 42, response: 4, dimension: 'mixed', question_type: 'likert' }, // execution * 0.5 + hustle * 0.25
        { question_id: '43', question_number: 43, response: 4, dimension: 'mixed', question_type: 'likert' }, // leadership * 0.5 + problemSolving * 0.25
        { question_id: '44', question_number: 44, response: 4, dimension: 'mixed', question_type: 'likert' }, // leadership * 0.5
        { question_id: '45', question_number: 45, response: 4, dimension: 'mixed', question_type: 'likert' }, // ownership * 0.5 + hustle * 0.25
      ];
      const result = calculateDimensionScores(responses);

      expect(result.execution).toBe(4); // 4*0.5 + 4*0.5
      expect(result.hustle).toBe(2); // 4*0.25 + 4*0.25
      expect(result.leadership).toBe(4); // 4*0.5 + 4*0.5
      expect(result.problemSolving).toBe(1); // 4*0.25
      expect(result.ownership).toBe(2); // 4*0.5
    });

    it('filters out trap questions', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '1', question_number: 1, response: 5, dimension: 'ownership', question_type: 'likert' },
        { question_id: '37', question_number: 37, response: 5, dimension: 'trap', question_type: 'likert', is_trap: true },
      ];
      const result = calculateDimensionScores(responses);

      expect(result.ownership).toBe(5); // Trap question not counted
    });

    it('filters out non-likert questions', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '1', question_number: 1, response: 5, dimension: 'ownership', question_type: 'likert' },
        { question_id: '61', question_number: 61, response: 'A', dimension: 'style', question_type: 'forced_choice' },
      ];
      const result = calculateDimensionScores(responses);

      expect(result.ownership).toBe(5); // Forced choice not counted
    });

    it('initializes all dimensions to zero', () => {
      const responses: AssessmentResponse[] = [];
      const result = calculateDimensionScores(responses);

      expect(result).toEqual({
        ownership: 0,
        execution: 0,
        hustle: 0,
        problemSolving: 0,
        leadership: 0,
      });
    });
  });

  describe('applyScenarioAdjustments', () => {
    it('applies small adjustments based on scenario responses', () => {
      const baseScores: DimensionScores = {
        ownership: 20,
        execution: 20,
        hustle: 20,
        problemSolving: 20,
        leadership: 20,
      };

      const responses: AssessmentResponse[] = [
        {
          question_id: 'scenario1',
          question_number: 66,
          response: 1,
          dimension: 'scenario',
          question_type: 'scenario',
          option_mappings: {
            '1': { ownership: 1, execution: -1 },
            '2': { hustle: 1 },
          },
        },
      ];

      const result = applyScenarioAdjustments(baseScores, responses);

      expect(result.ownership).toBe(20.5); // 20 + (1 * 0.5)
      expect(result.execution).toBe(19.5); // 20 + (-1 * 0.5)
      expect(result.hustle).toBe(20); // No change
    });

    it('handles multiple scenario adjustments', () => {
      const baseScores: DimensionScores = {
        ownership: 20,
        execution: 20,
        hustle: 20,
        problemSolving: 20,
        leadership: 20,
      };

      const responses: AssessmentResponse[] = [
        {
          question_id: 'scenario1',
          question_number: 66,
          response: 1,
          dimension: 'scenario',
          question_type: 'scenario',
          option_mappings: {
            '1': { ownership: 1 },
          },
        },
        {
          question_id: 'scenario2',
          question_number: 67,
          response: 2,
          dimension: 'scenario',
          question_type: 'scenario',
          option_mappings: {
            '2': { ownership: 1 },
          },
        },
      ];

      const result = applyScenarioAdjustments(baseScores, responses);

      expect(result.ownership).toBe(21); // 20 + 0.5 + 0.5
    });

    it('handles problem_solving trait name mapping', () => {
      const baseScores: DimensionScores = {
        ownership: 20,
        execution: 20,
        hustle: 20,
        problemSolving: 20,
        leadership: 20,
      };

      const responses: AssessmentResponse[] = [
        {
          question_id: 'scenario1',
          question_number: 66,
          response: 1,
          dimension: 'scenario',
          question_type: 'scenario',
          option_mappings: {
            '1': { problem_solving: 2 },
          },
        },
      ];

      const result = applyScenarioAdjustments(baseScores, responses);

      expect(result.problemSolving).toBe(21); // 20 + (2 * 0.5)
    });

    it('ignores non-scenario questions', () => {
      const baseScores: DimensionScores = {
        ownership: 20,
        execution: 20,
        hustle: 20,
        problemSolving: 20,
        leadership: 20,
      };

      const responses: AssessmentResponse[] = [
        {
          question_id: '1',
          question_number: 1,
          response: 5,
          dimension: 'ownership',
          question_type: 'likert',
        },
      ];

      const result = applyScenarioAdjustments(baseScores, responses);

      expect(result).toEqual(baseScores);
    });

    it('ignores scenarios without option_mappings', () => {
      const baseScores: DimensionScores = {
        ownership: 20,
        execution: 20,
        hustle: 20,
        problemSolving: 20,
        leadership: 20,
      };

      const responses: AssessmentResponse[] = [
        {
          question_id: 'scenario1',
          question_number: 66,
          response: 1,
          dimension: 'scenario',
          question_type: 'scenario',
        },
      ];

      const result = applyScenarioAdjustments(baseScores, responses);

      expect(result).toEqual(baseScores);
    });
  });

  describe('calculateVentureFitScores', () => {
    it('calculates operator score (Q51-53)', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '51', question_number: 51, response: 4, dimension: 'venture_fit', question_type: 'likert' },
        { question_id: '52', question_number: 52, response: 5, dimension: 'venture_fit', question_type: 'likert' },
        { question_id: '53', question_number: 53, response: 4, dimension: 'venture_fit', question_type: 'likert' },
      ];
      const result = calculateVentureFitScores(responses);

      expect(result.operator).toBeCloseTo(4.33, 2); // (4+5+4)/3
    });

    it('calculates product score (Q54-56)', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '54', question_number: 54, response: 5, dimension: 'venture_fit', question_type: 'likert' },
        { question_id: '55', question_number: 55, response: 5, dimension: 'venture_fit', question_type: 'likert' },
        { question_id: '56', question_number: 56, response: 4, dimension: 'venture_fit', question_type: 'likert' },
      ];
      const result = calculateVentureFitScores(responses);

      expect(result.product).toBeCloseTo(4.67, 2); // (5+5+4)/3
    });

    it('calculates growth score (Q57-59)', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '57', question_number: 57, response: 3, dimension: 'venture_fit', question_type: 'likert' },
        { question_id: '58', question_number: 58, response: 4, dimension: 'venture_fit', question_type: 'likert' },
        { question_id: '59', question_number: 59, response: 3, dimension: 'venture_fit', question_type: 'likert' },
      ];
      const result = calculateVentureFitScores(responses);

      expect(result.growth).toBeCloseTo(3.33, 2); // (3+4+3)/3
    });

    it('calculates vision score (Q60 - single question)', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '60', question_number: 60, response: 5, dimension: 'venture_fit', question_type: 'likert' },
      ];
      const result = calculateVentureFitScores(responses);

      expect(result.vision).toBe(5); // Single question, no averaging
    });

    it('filters out non-likert questions', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '51', question_number: 51, response: 4, dimension: 'venture_fit', question_type: 'likert' },
        { question_id: '52', question_number: 52, response: 5, dimension: 'venture_fit', question_type: 'likert' },
        { question_id: '53', question_number: 53, response: 4, dimension: 'venture_fit', question_type: 'likert' },
        { question_id: '61', question_number: 61, response: 'A', dimension: 'style', question_type: 'forced_choice' },
      ];
      const result = calculateVentureFitScores(responses);

      expect(result.operator).toBeCloseTo(4.33, 2);
    });

    it('returns zeros when no venture fit questions answered', () => {
      const responses: AssessmentResponse[] = [];
      const result = calculateVentureFitScores(responses);

      expect(result).toEqual({
        operator: 0,
        product: 0,
        growth: 0,
        vision: 0,
      });
    });
  });

  describe('calculateStyleTraits', () => {
    it('calculates style traits from forced choice questions', () => {
      const responses: AssessmentResponse[] = [
        {
          question_id: '61',
          question_number: 61,
          response: 'A',
          dimension: 'style',
          question_type: 'forced_choice',
          option_mappings: {
            'A': { action_bias: 1, deliberation_bias: 0 },
            'B': { action_bias: 0, deliberation_bias: 1 },
          },
        },
      ];
      const result = calculateStyleTraits(responses);

      expect(result.action_bias).toBe(1);
      expect(result.deliberation_bias).toBe(0);
    });

    it('accumulates traits from multiple forced choice questions', () => {
      const responses: AssessmentResponse[] = [
        {
          question_id: '61',
          question_number: 61,
          response: 'A',
          dimension: 'style',
          question_type: 'forced_choice',
          option_mappings: {
            'A': { action_bias: 1 },
            'B': { deliberation_bias: 1 },
          },
        },
        {
          question_id: '62',
          question_number: 62,
          response: 'B',
          dimension: 'style',
          question_type: 'forced_choice',
          option_mappings: {
            'A': { autonomy: 1 },
            'B': { collaboration: 1 },
          },
        },
      ];
      const result = calculateStyleTraits(responses);

      expect(result.action_bias).toBe(1);
      expect(result.collaboration).toBe(1);
    });

    it('ignores non-forced-choice questions', () => {
      const responses: AssessmentResponse[] = [
        {
          question_id: '1',
          question_number: 1,
          response: 5,
          dimension: 'ownership',
          question_type: 'likert',
        },
      ];
      const result = calculateStyleTraits(responses);

      expect(result).toEqual({
        action_bias: 0,
        deliberation_bias: 0,
        autonomy: 0,
        collaboration: 0,
        direct: 0,
        diplomatic: 0,
        vision_focus: 0,
        execution_focus: 0,
      });
    });

    it('handles missing option_mappings', () => {
      const responses: AssessmentResponse[] = [
        {
          question_id: '61',
          question_number: 61,
          response: 'A',
          dimension: 'style',
          question_type: 'forced_choice',
        },
      ];
      const result = calculateStyleTraits(responses);

      expect(result.action_bias).toBe(0);
    });
  });

  describe('calculateTeamCompatibilityScores', () => {
    it('calculates working style based on autonomy vs collaboration', () => {
      const styleTraits: StyleTraits = {
        action_bias: 0,
        deliberation_bias: 0,
        autonomy: 3,
        collaboration: 1,
        direct: 0,
        diplomatic: 0,
        vision_focus: 0,
        execution_focus: 0,
      };
      const result = calculateTeamCompatibilityScores(styleTraits, []);

      expect(result.workingStyle).toBe(4); // autonomy > collaboration
    });

    it('calculates communication based on direct vs diplomatic', () => {
      const styleTraits: StyleTraits = {
        action_bias: 0,
        deliberation_bias: 0,
        autonomy: 0,
        collaboration: 0,
        direct: 2,
        diplomatic: 1,
        vision_focus: 0,
        execution_focus: 0,
      };
      const result = calculateTeamCompatibilityScores(styleTraits, []);

      expect(result.communication).toBe(4); // direct > diplomatic
    });

    it('calculates conflict response based on diplomatic vs direct', () => {
      const styleTraits: StyleTraits = {
        action_bias: 0,
        deliberation_bias: 0,
        autonomy: 0,
        collaboration: 0,
        direct: 1,
        diplomatic: 2,
        vision_focus: 0,
        execution_focus: 0,
      };
      const result = calculateTeamCompatibilityScores(styleTraits, []);

      expect(result.conflictResponse).toBe(4); // diplomatic > direct
    });

    it('calculates decision making based on action vs deliberation bias', () => {
      const styleTraits: StyleTraits = {
        action_bias: 3,
        deliberation_bias: 1,
        autonomy: 0,
        collaboration: 0,
        direct: 0,
        diplomatic: 0,
        vision_focus: 0,
        execution_focus: 0,
      };
      const result = calculateTeamCompatibilityScores(styleTraits, []);

      expect(result.decisionMaking).toBe(4); // action_bias > deliberation_bias
    });

    it('applies scenario adjustments for communication and collaboration', () => {
      const styleTraits: StyleTraits = {
        action_bias: 0,
        deliberation_bias: 0,
        autonomy: 0,
        collaboration: 0,
        direct: 0,
        diplomatic: 0,
        vision_focus: 0,
        execution_focus: 0,
      };

      const responses: AssessmentResponse[] = [
        {
          question_id: 'scenario1',
          question_number: 66,
          response: 1,
          dimension: 'scenario',
          question_type: 'scenario',
          option_mappings: {
            '1': { communication: 1, collaboration: 1 },
          },
        },
      ];

      const result = calculateTeamCompatibilityScores(styleTraits, responses);

      expect(result.communication).toBe(3.2); // 3 + 0.2
      expect(result.collaboration).toBe(3.2); // 3 + 0.2
    });

    it('caps scores at 5', () => {
      const styleTraits: StyleTraits = {
        action_bias: 0,
        deliberation_bias: 0,
        autonomy: 0,
        collaboration: 5,
        direct: 0,
        diplomatic: 0,
        vision_focus: 0,
        execution_focus: 0,
      };

      // Add multiple scenarios to push the score over 5
      const responses: AssessmentResponse[] = Array.from({ length: 10 }, (_, i) => ({
        question_id: `scenario${i}`,
        question_number: 66 + i,
        response: 1,
        dimension: 'scenario',
        question_type: 'scenario' as const,
        option_mappings: {
          '1': { collaboration: 1 },
        },
      }));

      const result = calculateTeamCompatibilityScores(styleTraits, responses);

      // Base 4 + (10 scenarios * 0.2) = 6, capped at 5
      expect(result.collaboration).toBe(5); // Capped at 5
    });
  });

  describe('determinePrimaryFounderType', () => {
    it('returns Operational Leader when operator score is highest', () => {
      const ventureFitScores: VentureFitScores = {
        operator: 4.5,
        product: 3.0,
        growth: 3.2,
        vision: 3.5,
      };
      const result = determinePrimaryFounderType(ventureFitScores);

      expect(result).toBe('Operational Leader');
    });

    it('returns Product Architect when product score is highest', () => {
      const ventureFitScores: VentureFitScores = {
        operator: 3.0,
        product: 4.5,
        growth: 3.2,
        vision: 3.5,
      };
      const result = determinePrimaryFounderType(ventureFitScores);

      expect(result).toBe('Product Architect');
    });

    it('returns Growth Catalyst when growth score is highest', () => {
      const ventureFitScores: VentureFitScores = {
        operator: 3.0,
        product: 3.2,
        growth: 4.5,
        vision: 3.5,
      };
      const result = determinePrimaryFounderType(ventureFitScores);

      expect(result).toBe('Growth Catalyst');
    });

    it('returns Visionary Builder when vision score is highest', () => {
      const ventureFitScores: VentureFitScores = {
        operator: 3.0,
        product: 3.2,
        growth: 3.5,
        vision: 4.5,
      };
      const result = determinePrimaryFounderType(ventureFitScores);

      expect(result).toBe('Visionary Builder');
    });

    it('breaks ties consistently by returning the first highest score', () => {
      const ventureFitScores: VentureFitScores = {
        operator: 4.0,
        product: 4.0,
        growth: 3.0,
        vision: 3.0,
      };
      const result = determinePrimaryFounderType(ventureFitScores);

      // Should return one of the tied types consistently
      expect(['Operational Leader', 'Product Architect']).toContain(result);
    });
  });

  describe('determineSecondaryFounderType', () => {
    it('returns secondary type when within 0.4 threshold', () => {
      const ventureFitScores: VentureFitScores = {
        operator: 4.5,
        product: 4.2, // Within 0.4 of 4.5
        growth: 3.0,
        vision: 3.0,
      };
      const result = determineSecondaryFounderType(ventureFitScores, 'Operational Leader');

      expect(result).toBe('Product Architect');
    });

    it('returns null when secondary score is too far from primary', () => {
      const ventureFitScores: VentureFitScores = {
        operator: 4.5,
        product: 3.8, // More than 0.4 from 4.5
        growth: 3.0,
        vision: 3.0,
      };
      const result = determineSecondaryFounderType(ventureFitScores, 'Operational Leader');

      expect(result).toBeNull();
    });

    it('returns the highest non-primary type', () => {
      const ventureFitScores: VentureFitScores = {
        operator: 4.5,
        product: 4.3,
        growth: 4.2,
        vision: 4.1,
      };
      const result = determineSecondaryFounderType(ventureFitScores, 'Operational Leader');

      expect(result).toBe('Product Architect'); // 4.3 is highest non-primary
    });

    it('handles values very close to 0.4 threshold', () => {
      const ventureFitScores: VentureFitScores = {
        operator: 4.5,
        product: 4.15, // 0.35 difference, within threshold
        growth: 3.0,
        vision: 3.0,
      };
      const result = determineSecondaryFounderType(ventureFitScores, 'Operational Leader');

      expect(result).toBe('Product Architect');
    });
  });

  describe('getConfidenceLevel', () => {
    it('returns Strong for high scores with normal trap level', () => {
      const trapAnalysis = { trapScore: 10, level: 'normal' as const, shouldFlag: false };
      const result = getConfidenceLevel(4.5, trapAnalysis);

      expect(result).toBe('Strong');
    });

    it('returns Moderate for medium scores with normal trap level', () => {
      const trapAnalysis = { trapScore: 10, level: 'normal' as const, shouldFlag: false };
      const result = getConfidenceLevel(3.7, trapAnalysis);

      expect(result).toBe('Moderate');
    });

    it('returns Emerging for low scores', () => {
      const trapAnalysis = { trapScore: 10, level: 'normal' as const, shouldFlag: false };
      const result = getConfidenceLevel(3.0, trapAnalysis);

      expect(result).toBe('Emerging');
    });

    it('downgrades to Emerging when trap level is likely_exaggeration', () => {
      const trapAnalysis = { trapScore: 18, level: 'likely_exaggeration' as const, shouldFlag: true };
      const result = getConfidenceLevel(4.8, trapAnalysis);

      expect(result).toBe('Emerging');
    });

    it('downgrades confidence when trap level is elevated', () => {
      const trapAnalysis = { trapScore: 13, level: 'elevated' as const, shouldFlag: true };
      const highScore = getConfidenceLevel(4.5, trapAnalysis);
      const mediumScore = getConfidenceLevel(3.7, trapAnalysis);

      expect(highScore).toBe('Moderate'); // Would be Strong without trap
      expect(mediumScore).toBe('Emerging'); // Would be Moderate without trap
    });

    it('handles exact threshold values', () => {
      const trapAnalysis = { trapScore: 10, level: 'normal' as const, shouldFlag: false };

      expect(getConfidenceLevel(4.0, trapAnalysis)).toBe('Strong');
      expect(getConfidenceLevel(3.4, trapAnalysis)).toBe('Moderate');
    });
  });

  describe('generateSummary', () => {
    it('generates summary for Operational Leader', () => {
      const trapAnalysis = { trapScore: 10, level: 'normal' as const, shouldFlag: false };
      const result = generateSummary('John', 'Operational Leader', 'Strong', null, trapAnalysis);

      expect(result).toContain('John');
      expect(result).toContain('Operational Leader');
      expect(result).toContain('Exceptional'); // Strong -> Exceptional
      expect(result).toContain('structure');
    });

    it('generates summary with secondary type', () => {
      const trapAnalysis = { trapScore: 10, level: 'normal' as const, shouldFlag: false };
      const result = generateSummary('Sarah', 'Product Architect', 'Moderate', 'Growth Catalyst', trapAnalysis);

      expect(result).toContain('Sarah');
      expect(result).toContain('Product Architect');
      expect(result).toContain('Growth Catalyst');
      expect(result).toContain('growth and distribution');
    });

    it('adds trap warning when trap score is elevated', () => {
      const trapAnalysis = { trapScore: 14, level: 'elevated' as const, shouldFlag: true };
      const result = generateSummary('Alex', 'Visionary Builder', 'Moderate', null, trapAnalysis);

      expect(result).toContain('[Note: High social desirability score detected');
      expect(result).toContain('14/20');
    });

    it('adds trap warning for likely_exaggeration', () => {
      const trapAnalysis = { trapScore: 18, level: 'likely_exaggeration' as const, shouldFlag: true };
      const result = generateSummary('Taylor', 'Growth Catalyst', 'Emerging', null, trapAnalysis);

      expect(result).toContain('[Note: High social desirability score detected');
      expect(result).toContain('18/20');
    });

    it('does not add trap warning for normal level', () => {
      const trapAnalysis = { trapScore: 8, level: 'normal' as const, shouldFlag: false };
      const result = generateSummary('Morgan', 'Operational Leader', 'Strong', null, trapAnalysis);

      expect(result).not.toContain('[Note:');
    });
  });

  describe('getStrengths', () => {
    it('returns strengths for Operational Leader', () => {
      const result = getStrengths('Operational Leader');

      expect(result).toHaveLength(5);
      expect(result).toContain('High ownership and follow-through');
    });

    it('returns strengths for Product Architect', () => {
      const result = getStrengths('Product Architect');

      expect(result).toHaveLength(5);
      expect(result).toContain('Strong empathy for users and customer problems');
    });

    it('returns strengths for Growth Catalyst', () => {
      const result = getStrengths('Growth Catalyst');

      expect(result).toHaveLength(5);
      expect(result).toContain('Strong communication and storytelling');
    });

    it('returns strengths for Visionary Builder', () => {
      const result = getStrengths('Visionary Builder');

      expect(result).toHaveLength(5);
      expect(result).toContain('Strong long-term vision and narrative');
    });
  });

  describe('getWeaknesses', () => {
    it('returns weaknesses for Operational Leader', () => {
      const result = getWeaknesses('Operational Leader');

      expect(result).toHaveLength(4);
      expect(result[0]).toContain('over-focus on internal process');
    });

    it('returns weaknesses for Product Architect', () => {
      const result = getWeaknesses('Product Architect');

      expect(result).toHaveLength(4);
      expect(result[0]).toContain('too long refining product');
    });

    it('returns weaknesses for Growth Catalyst', () => {
      const result = getWeaknesses('Growth Catalyst');

      expect(result).toHaveLength(4);
      expect(result[0]).toContain('under-focus on underlying systems');
    });

    it('returns weaknesses for Visionary Builder', () => {
      const result = getWeaknesses('Visionary Builder');

      expect(result).toHaveLength(4);
      expect(result[0]).toContain('underinvest in details');
    });
  });

  describe('generateWeaknessSummary', () => {
    it('generates weakness summary for Operational Leader', () => {
      const result = generateWeaknessSummary('John', 'Operational Leader', null);

      expect(result).toContain('John');
      expect(result).toContain('delegation');
    });

    it('generates weakness summary for all operator types', () => {
      const types: Array<'Operational Leader' | 'Product Architect' | 'Growth Catalyst' | 'Visionary Builder'> = [
        'Operational Leader',
        'Product Architect',
        'Growth Catalyst',
        'Visionary Builder',
      ];

      types.forEach(type => {
        const result = generateWeaknessSummary('Test', type, null);
        expect(result).toContain('Test');
        expect(result.length).toBeGreaterThan(50);
      });
    });
  });

  describe('identifyTopTraits', () => {
    it('returns top 3 traits sorted by score', () => {
      const dimensionScores: DimensionScores = {
        ownership: 35,
        execution: 38,
        hustle: 30,
        problemSolving: 25,
        leadership: 28,
      };
      const result = identifyTopTraits(dimensionScores);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Execution'); // Highest
      expect(result[1]).toBe('Ownership'); // Second
      expect(result[2]).toBe('Hustle'); // Third
    });

    it('handles ties consistently', () => {
      const dimensionScores: DimensionScores = {
        ownership: 30,
        execution: 30,
        hustle: 30,
        problemSolving: 20,
        leadership: 20,
      };
      const result = identifyTopTraits(dimensionScores);

      expect(result).toHaveLength(3);
      expect(result.every(trait => ['Ownership', 'Execution', 'Hustle'].includes(trait))).toBe(true);
    });
  });

  describe('calculateAssessmentResults', () => {
    it('integrates all scoring components correctly', () => {
      const responses: AssessmentResponse[] = [
        // Ownership (Q1-8)
        ...Array.from({ length: 8 }, (_, i) => ({
          question_id: `${i + 1}`,
          question_number: i + 1,
          response: 4,
          dimension: 'ownership',
          question_type: 'likert' as const,
        })),
        // Execution (Q9-16)
        ...Array.from({ length: 8 }, (_, i) => ({
          question_id: `${i + 9}`,
          question_number: i + 9,
          response: 4,
          dimension: 'execution',
          question_type: 'likert' as const,
        })),
        // Hustle (Q17-24)
        ...Array.from({ length: 8 }, (_, i) => ({
          question_id: `${i + 17}`,
          question_number: i + 17,
          response: 3,
          dimension: 'hustle',
          question_type: 'likert' as const,
        })),
        // Problem-solving (Q25-30)
        ...Array.from({ length: 6 }, (_, i) => ({
          question_id: `${i + 25}`,
          question_number: i + 25,
          response: 4,
          dimension: 'problemSolving',
          question_type: 'likert' as const,
        })),
        // Leadership (Q31-36)
        ...Array.from({ length: 6 }, (_, i) => ({
          question_id: `${i + 31}`,
          question_number: i + 31,
          response: 4,
          dimension: 'leadership',
          question_type: 'likert' as const,
        })),
        // Trap questions (Q37-40)
        { question_id: '37', question_number: 37, response: 2, dimension: 'trap', question_type: 'likert' as const, is_trap: true },
        { question_id: '38', question_number: 38, response: 2, dimension: 'trap', question_type: 'likert' as const, is_trap: true },
        { question_id: '39', question_number: 39, response: 3, dimension: 'trap', question_type: 'likert' as const, is_trap: true },
        { question_id: '40', question_number: 40, response: 3, dimension: 'trap', question_type: 'likert' as const, is_trap: true },
        // Venture fit (Q51-60)
        { question_id: '51', question_number: 51, response: 5, dimension: 'venture_fit', question_type: 'likert' as const },
        { question_id: '52', question_number: 52, response: 4, dimension: 'venture_fit', question_type: 'likert' as const },
        { question_id: '53', question_number: 53, response: 5, dimension: 'venture_fit', question_type: 'likert' as const },
        { question_id: '54', question_number: 54, response: 3, dimension: 'venture_fit', question_type: 'likert' as const },
        { question_id: '55', question_number: 55, response: 3, dimension: 'venture_fit', question_type: 'likert' as const },
        { question_id: '56', question_number: 56, response: 3, dimension: 'venture_fit', question_type: 'likert' as const },
        { question_id: '57', question_number: 57, response: 3, dimension: 'venture_fit', question_type: 'likert' as const },
        { question_id: '58', question_number: 58, response: 3, dimension: 'venture_fit', question_type: 'likert' as const },
        { question_id: '59', question_number: 59, response: 3, dimension: 'venture_fit', question_type: 'likert' as const },
        { question_id: '60', question_number: 60, response: 4, dimension: 'venture_fit', question_type: 'likert' as const },
        // Style traits (forced choice)
        {
          question_id: '61',
          question_number: 61,
          response: 'A',
          dimension: 'style',
          question_type: 'forced_choice' as const,
          option_mappings: {
            'A': { action_bias: 1 },
            'B': { deliberation_bias: 1 },
          },
        },
      ];

      const result = calculateAssessmentResults(responses, 'Test User');

      // Verify all components are present
      expect(result.dimensionScores).toBeDefined();
      expect(result.ventureFitScores).toBeDefined();
      expect(result.teamCompatibilityScores).toBeDefined();
      expect(result.styleTraits).toBeDefined();
      expect(result.trapAnalysis).toBeDefined();
      expect(result.primaryFounderType).toBeDefined();
      expect(result.confidenceLevel).toBeDefined();
      expect(result.summary).toContain('Test User');
      expect(result.strengths).toHaveLength(5);
      expect(result.weaknesses).toHaveLength(4);
      expect(result.weaknessSummary).toContain('Test User');

      // Verify trap analysis
      expect(result.trapAnalysis.trapScore).toBe(10);
      expect(result.trapAnalysis.level).toBe('normal');

      // Verify primary type is Operational Leader (highest venture fit)
      expect(result.primaryFounderType).toBe('Operational Leader');

      // Verify confidence
      expect(['Strong', 'Moderate', 'Emerging']).toContain(result.confidenceLevel);
    });

    it('handles minimal responses gracefully', () => {
      const responses: AssessmentResponse[] = [
        { question_id: '1', question_number: 1, response: 3, dimension: 'ownership', question_type: 'likert' as const },
      ];

      const result = calculateAssessmentResults(responses, 'Minimal User');

      expect(result).toBeDefined();
      expect(result.summary).toContain('Minimal User');
      expect(result.primaryFounderType).toBeDefined();
    });

    it('properly chains all calculation steps', () => {
      const responses: AssessmentResponse[] = [
        // Add scenario adjustment
        {
          question_id: 'scenario1',
          question_number: 66,
          response: 1,
          dimension: 'scenario',
          question_type: 'scenario' as const,
          option_mappings: {
            '1': { ownership: 2, execution: -1 },
          },
        },
        // Base ownership score
        { question_id: '1', question_number: 1, response: 4, dimension: 'ownership', question_type: 'likert' as const },
        { question_id: '2', question_number: 2, response: 4, dimension: 'ownership', question_type: 'likert' as const },
        // Venture fit
        { question_id: '60', question_number: 60, response: 5, dimension: 'venture_fit', question_type: 'likert' as const },
      ];

      const result = calculateAssessmentResults(responses, 'Chained User');

      // Verify scenario adjustments were applied to dimension scores
      expect(result.dimensionScores.ownership).toBeGreaterThan(8); // 8 base + 1 scenario adjustment
    });
  });
});
