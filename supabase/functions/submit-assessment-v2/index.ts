import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface ResponseData {
  question_id: string;
  question_number: number;
  response: number | string;
  dimension: string;
  sub_dimension: string | null;
  is_reverse: boolean;
  is_trap: boolean;
  question_type: string;
  option_mappings: Record<string, Record<string, number>> | null;
}

interface RequestPayload {
  token: string;
  applicant_name: string;
  responses: ResponseData[];
}

// Apply reverse scoring
function applyReverseScoring(response: number, isReverse: boolean): number {
  return isReverse ? 6 - response : response;
}

// Calculate trap analysis
function calculateTrapAnalysis(responses: ResponseData[]): { trapScore: number; level: string; shouldFlag: boolean } {
  const trapResponses = responses.filter(r => r.is_trap && typeof r.response === 'number');
  if (trapResponses.length === 0) return { trapScore: 0, level: 'normal', shouldFlag: false };

  const trapScore = trapResponses.reduce((sum, r) => sum + (r.response as number), 0);
  let level = 'normal';
  let shouldFlag = false;

  if (trapScore >= 16) { level = 'likely_exaggeration'; shouldFlag = true; }
  else if (trapScore >= 11) { level = 'elevated'; shouldFlag = true; }

  return { trapScore, level, shouldFlag };
}

// Calculate dimension scores
function calculateDimensionScores(responses: ResponseData[]) {
  const scores = { ownership: 0, execution: 0, hustle: 0, problemSolving: 0, leadership: 0 };

  responses.forEach((r) => {
    if (r.is_trap || r.question_type !== 'likert' || typeof r.response !== 'number') return;
    const adjusted = applyReverseScoring(r.response, r.is_reverse);
    const qn = r.question_number;

    if (qn >= 1 && qn <= 8) scores.ownership += adjusted;
    else if (qn >= 9 && qn <= 16) scores.execution += adjusted;
    else if (qn >= 17 && qn <= 24) scores.hustle += adjusted;
    else if (qn >= 25 && qn <= 30) scores.problemSolving += adjusted;
    else if (qn >= 31 && qn <= 36) scores.leadership += adjusted;
    else if (qn >= 41 && qn <= 50) {
      // Mixed construct questions
      switch (qn) {
        case 41: scores.execution += adjusted * 0.5; break;
        case 42: scores.execution += adjusted * 0.5; scores.hustle += adjusted * 0.25; break;
        case 43: scores.leadership += adjusted * 0.5; scores.problemSolving += adjusted * 0.25; break;
        case 44: scores.leadership += adjusted * 0.5; break;
        case 45: scores.ownership += adjusted * 0.5; scores.hustle += adjusted * 0.25; break;
        case 46: case 47: case 49: case 50: scores.execution += adjusted * 0.5; break;
        case 48: scores.hustle += adjusted * 0.5; break;
      }
    }
  });

  return scores;
}

// Calculate venture fit scores
function calculateVentureFitScores(responses: ResponseData[]) {
  let operatorRaw = 0, productRaw = 0, growthRaw = 0, visionRaw = 0;

  responses.forEach((r) => {
    if (r.question_type !== 'likert' || typeof r.response !== 'number') return;
    const qn = r.question_number;
    if (qn >= 51 && qn <= 53) operatorRaw += r.response;
    else if (qn >= 54 && qn <= 56) productRaw += r.response;
    else if (qn >= 57 && qn <= 59) growthRaw += r.response;
    else if (qn === 60) visionRaw = r.response;
  });

  return {
    operator: operatorRaw / 3,
    product: productRaw / 3,
    growth: growthRaw / 3,
    vision: visionRaw,
  };
}

// Calculate style traits
function calculateStyleTraits(responses: ResponseData[]) {
  const traits = {
    action_bias: 0, deliberation_bias: 0, autonomy: 0, collaboration: 0,
    direct: 0, diplomatic: 0, vision_focus: 0, execution_focus: 0,
  };

  responses.forEach((r) => {
    if (r.question_type !== 'forced_choice' || typeof r.response !== 'string') return;
    const mappings = r.option_mappings;
    if (!mappings) return;
    const selected = mappings[r.response];
    if (!selected) return;
    Object.entries(selected).forEach(([trait, value]) => {
      if (trait in traits) traits[trait as keyof typeof traits] += value;
    });
  });

  return traits;
}

// Calculate team compatibility
function calculateTeamCompatibilityScores(styleTraits: ReturnType<typeof calculateStyleTraits>) {
  const workingStyle = (styleTraits.autonomy + styleTraits.collaboration) > 0
    ? (styleTraits.autonomy > styleTraits.collaboration ? 4 : 3.5) : 3;
  const communication = (styleTraits.direct + styleTraits.diplomatic) > 0
    ? (styleTraits.direct > styleTraits.diplomatic ? 4 : 3.5) : 3;
  const conflictResponse = (styleTraits.direct + styleTraits.diplomatic) > 0
    ? (styleTraits.diplomatic > styleTraits.direct ? 4 : 3.5) : 3;
  const decisionMaking = (styleTraits.action_bias + styleTraits.deliberation_bias) > 0
    ? (styleTraits.action_bias > styleTraits.deliberation_bias ? 4 : 3.5) : 3;
  const collaboration = styleTraits.collaboration > 0 ? 4 : 3;

  return { workingStyle, communication, conflictResponse, decisionMaking, collaboration };
}

// Determine operator type
function determineOperatorType(ventureFitScores: ReturnType<typeof calculateVentureFitScores>) {
  const scores = [
    { type: 'Operational Leader', score: ventureFitScores.operator },
    { type: 'Product Architect', score: ventureFitScores.product },
    { type: 'Growth Catalyst', score: ventureFitScores.growth },
    { type: 'Visionary Builder', score: ventureFitScores.vision },
  ];
  scores.sort((a, b) => b.score - a.score);
  const primary = scores[0].type;
  const secondary = scores[0].score - scores[1].score <= 0.4 ? scores[1].type : null;
  return { primary, secondary };
}

// Get confidence level
function getConfidenceLevel(score: number, trapLevel: string): string {
  if (trapLevel === 'likely_exaggeration') return 'Emerging';
  if (trapLevel === 'elevated') {
    if (score >= 4.0) return 'Moderate';
    return 'Emerging';
  }
  if (score >= 4.0) return 'Strong';
  if (score >= 3.4) return 'Moderate';
  return 'Emerging';
}

// Generate summary
function generateSummary(name: string, operatorType: string, confidence: string, secondaryType: string | null): string {
  const readiness = confidence === 'Strong' ? 'Exceptional' : confidence;
  const baseSummaries: Record<string, string> = {
    'Operational Leader': `${name} shows a ${readiness} operator profile with a strong bias toward Operational Leader traits. They are most energized by building structure, managing complexity, and ensuring that plans actually get executed.`,
    'Product Architect': `${name} presents a ${readiness} operator profile with a dominant Product Architect orientation. They are naturally drawn to understanding users, mapping journeys, and turning insights into concrete product decisions.`,
    'Growth Catalyst': `${name} has a ${readiness} operator profile with a strong Growth Catalyst orientation. They are energized by talking to people, pitching ideas, building relationships, and getting traction.`,
    'Visionary Builder': `${name} shows a ${readiness} operator profile with a strong Visionary Builder orientation. They think in missions, long-term direction, and the bigger story of what the venture could become.`,
  };
  if (secondaryType) {
    return `${name} shows a ${readiness} operator profile as an ${operatorType} with ${secondaryType} tendencies.`;
  }
  return baseSummaries[operatorType] || `${name} shows a ${readiness} operator profile.`;
}

// Get strengths
function getStrengths(operatorType: string): string[] {
  const map: Record<string, string[]> = {
    'Operational Leader': ['Execution discipline', 'Process optimization', 'Accountability', 'Reliability under pressure'],
    'Product Architect': ['User empathy', 'Product vision', 'Strategic thinking', 'Attention to detail'],
    'Growth Catalyst': ['Relationship building', 'Sales acumen', 'Market awareness', 'Persuasion'],
    'Visionary Builder': ['Strategic vision', 'Inspiring leadership', 'Big-picture thinking', 'Innovation'],
  };
  return map[operatorType] || ['Adaptability', 'Problem-solving'];
}

// Get weaknesses
function getWeaknesses(operatorType: string): string[] {
  const map: Record<string, string[]> = {
    'Operational Leader': ['May over-focus on process', 'Can be rigid', 'May struggle with ambiguity'],
    'Product Architect': ['May overthink decisions', 'Can be perfectionistic', 'May undervalue speed'],
    'Growth Catalyst': ['May spread too thin', 'Can be overconfident', 'May undervalue operations'],
    'Visionary Builder': ['May struggle with details', 'Can be impatient', 'May overlook execution'],
  };
  return map[operatorType] || ['May need development in certain areas'];
}

// Venture matching
const OPERATOR_TYPE_SCORES: Record<string, Record<string, number>> = {
  'Operational Leader': { 'Operational Leader': 100, 'Product Architect': 60, 'Growth Catalyst': 55, 'Visionary Builder': 50 },
  'Product Architect': { 'Product Architect': 100, 'Visionary Builder': 70, 'Growth Catalyst': 65, 'Operational Leader': 55 },
  'Growth Catalyst': { 'Growth Catalyst': 100, 'Product Architect': 70, 'Visionary Builder': 65, 'Operational Leader': 60 },
  'Visionary Builder': { 'Visionary Builder': 100, 'Product Architect': 70, 'Growth Catalyst': 70, 'Operational Leader': 55 },
};

function calculateVentureMatches(
  dimensionScores: ReturnType<typeof calculateDimensionScores>,
  ventureFitScores: ReturnType<typeof calculateVentureFitScores>,
  teamCompatibilityScores: ReturnType<typeof calculateTeamCompatibilityScores>,
  primaryType: string,
  secondaryType: string | null,
  ventures: any[]
) {
  return ventures.map((venture) => {
    // Founder type score (40%)
    let founderScore = 40;
    if (primaryType === venture.ideal_operator_type) founderScore = 100;
    else if (venture.secondary_operator_type && primaryType === venture.secondary_operator_type) founderScore = 85;
    else if (secondaryType && secondaryType === venture.ideal_operator_type) founderScore = 75;
    else founderScore = OPERATOR_TYPE_SCORES[primaryType]?.[venture.ideal_operator_type] || 50;

    // Dimension score (40%)
    const weights = venture.dimension_weights || {};
    let weightedScore = 0, totalWeight = 0;
    const dims = ['ownership', 'execution', 'hustle', 'problemSolving', 'leadership'] as const;
    dims.forEach((dim) => {
      const weight = weights[dim] || 0.5;
      const score = (dimensionScores[dim] / 50) * 100;
      weightedScore += score * weight;
      totalWeight += weight;
    });
    const dimensionScore = totalWeight > 0 ? weightedScore / totalWeight : 50;

    // Compatibility score (20%)
    const teamDims = ['workingStyle', 'communication', 'conflictResponse', 'decisionMaking', 'collaboration'] as const;
    let compTotal = 0;
    teamDims.forEach((dim) => {
      compTotal += (teamCompatibilityScores[dim] / 5) * 100;
    });
    const compatibilityScore = compTotal / teamDims.length;

    const overallScore = Math.round(founderScore * 0.4 + dimensionScore * 0.4 + compatibilityScore * 0.2);

    const matchReasons: string[] = [];
    if (founderScore >= 85) matchReasons.push(`Strong ${primaryType} profile aligns well with ${venture.name}`);
    if (dimensionScore >= 75) matchReasons.push('Overall dimension profile strongly matches requirements');

    const concerns: string[] = [];
    if (founderScore < 60) concerns.push(`${primaryType} style may require adaptation`);

    const suggestedRole = venture.suggested_roles?.[0] || 'General Operator';

    return {
      venture_id: venture.id,
      overall_score: overallScore,
      operator_type_score: Math.round(founderScore),
      dimension_score: Math.round(dimensionScore),
      compatibility_score: Math.round(compatibilityScore),
      match_reasons: matchReasons.length > 0 ? matchReasons : ['General profile alignment'],
      concerns,
      suggested_role: suggestedRole,
    };
  }).sort((a, b) => b.overall_score - a.overall_score);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: RequestPayload = await req.json();
    console.log("submit-assessment-v2: starting", { token: payload.token, responses_count: payload.responses?.length });

    if (!payload.token || !payload.responses || payload.responses.length === 0) {
      return new Response(JSON.stringify({ error: "token and responses are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("id, status")
      .eq("token", payload.token)
      .maybeSingle();

    if (sessionError || !session) {
      console.error("submit-assessment-v2: session not found", sessionError);
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // If already completed, return success (idempotent)
    if (session.status === "completed") {
      const { data: existingResult } = await supabase
        .from("assessment_results")
        .select("id")
        .eq("session_id", session.id)
        .maybeSingle();
      return new Response(
        JSON.stringify({ success: true, assessment_result_id: existingResult?.id, already_completed: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calculate scores
    const trapAnalysis = calculateTrapAnalysis(payload.responses);
    const dimensionScores = calculateDimensionScores(payload.responses);
    const ventureFitScores = calculateVentureFitScores(payload.responses);
    const styleTraits = calculateStyleTraits(payload.responses);
    const teamCompatibilityScores = calculateTeamCompatibilityScores(styleTraits);
    const { primary: primaryType, secondary: secondaryType } = determineOperatorType(ventureFitScores);
    const primaryScore = ventureFitScores[primaryType.toLowerCase().split(' ')[0] as keyof typeof ventureFitScores] || 3;
    const confidenceLevel = getConfidenceLevel(primaryScore, trapAnalysis.level);
    const summary = generateSummary(payload.applicant_name, primaryType, confidenceLevel, secondaryType);
    const strengths = getStrengths(primaryType);
    const weaknesses = getWeaknesses(primaryType);
    const weaknessSummary = `${payload.applicant_name} may benefit from development in: ${weaknesses.join(', ')}.`;

    console.log("submit-assessment-v2: calculated", { primaryType, confidenceLevel, trapLevel: trapAnalysis.level });

    // Insert assessment result
    const { data: resultRow, error: resultError } = await supabase
      .from("assessment_results")
      .upsert({
        session_id: session.id,
        dimension_scores: dimensionScores,
        venture_fit_scores: ventureFitScores,
        team_compatibility_scores: teamCompatibilityScores,
        primary_operator_type: primaryType,
        secondary_operator_type: secondaryType,
        confidence_level: confidenceLevel,
        summary,
        strengths,
        weaknesses,
        weakness_summary: weaknessSummary,
      }, { onConflict: "session_id" })
      .select("id")
      .single();

    if (resultError || !resultRow) {
      console.error("submit-assessment-v2: result insert error", resultError);
      return new Response(JSON.stringify({ error: "Failed to save results" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const assessmentResultId = resultRow.id as string;

    // Fetch ventures and calculate matches
    const { data: ventures } = await supabase.from("ventures").select("*").eq("is_active", true);
    if (ventures && ventures.length > 0) {
      const matches = calculateVentureMatches(
        dimensionScores, ventureFitScores, teamCompatibilityScores, primaryType, secondaryType, ventures
      );

      // Delete old matches
      await supabase.from("venture_matches").delete().eq("assessment_result_id", assessmentResultId);

      // Insert new matches
      const matchRows = matches.map((m) => ({ assessment_result_id: assessmentResultId, ...m }));
      const { error: matchError } = await supabase.from("venture_matches").insert(matchRows);
      if (matchError) console.error("submit-assessment-v2: venture_matches error", matchError);
    }

    // Mark session complete
    const { error: updateError } = await supabase
      .from("assessment_sessions")
      .update({ status: "completed", interview_status: "completed", completed_at: new Date().toISOString() })
      .eq("id", session.id);

    if (updateError) console.error("submit-assessment-v2: session update error", updateError);

    // Trigger AI functions in background
    const topVentures = (ventures || []).slice(0, 3).map((v: any) => ({
      venture_id: v.id,
      venture_name: v.name,
      industry: v.industry,
    }));

    supabase.functions.invoke("generate-interview-questions", {
      body: {
        assessment_result_id: assessmentResultId,
        applicant_name: payload.applicant_name,
        dimension_scores: dimensionScores,
        venture_fit_scores: ventureFitScores,
        primary_operator_type: primaryType,
        secondary_operator_type: secondaryType,
        confidence_level: confidenceLevel,
        venture_matches: topVentures,
        trap_analysis: trapAnalysis,
      },
    }).catch((e) => console.error("AI interview questions error:", e));

    supabase.functions.invoke("generate-ai-evaluation", {
      body: {
        assessment_result_id: assessmentResultId,
        applicant_name: payload.applicant_name,
        dimension_scores: dimensionScores,
        venture_fit_scores: ventureFitScores,
        team_compatibility_scores: teamCompatibilityScores,
        primary_operator_type: primaryType,
        secondary_operator_type: secondaryType,
        confidence_level: confidenceLevel,
        venture_matches: topVentures,
        trap_analysis: trapAnalysis,
        style_traits: styleTraits,
      },
    }).catch((e) => console.error("AI evaluation error:", e));

    console.log("submit-assessment-v2: success", { session_id: session.id, assessment_result_id: assessmentResultId });

    return new Response(
      JSON.stringify({ success: true, session_id: session.id, assessment_result_id: assessmentResultId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("submit-assessment-v2: unexpected error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
