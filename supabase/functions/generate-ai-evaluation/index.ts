import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvaluationRequest {
  assessment_result_id: string;
  applicant_name: string;
  dimension_scores: {
    ownership: number;
    execution: number;
    hustle: number;
    problemSolving: number;
    leadership: number;
  };
  venture_fit_scores: {
    operator: number;
    product: number;
    growth: number;
    vision: number;
  };
  team_compatibility_scores: {
    workingStyle: number;
    communication: number;
    conflictResponse: number;
    decisionMaking: number;
    collaboration: number;
  };
  primary_founder_type: string;
  secondary_founder_type: string | null;
  confidence_level: string;
  venture_matches: Array<{
    venture_id: string;
    venture_name: string;
    industry: string;
    overall_score: number;
    match_reasons: string[];
    concerns: string[];
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: EvaluationRequest = await req.json();
    console.log("Generating AI evaluation for:", data.applicant_name);

    const prompt = `Analyze this candidate's assessment for a venture operator position at a startup studio. 
The candidate is likely a new graduate or intern - focus on potential, not experience.

Name: ${data.applicant_name}

Assessment Scores (out of 50 for dimensions, 5.0 for others):
- Ownership: ${data.dimension_scores.ownership}/50
- Execution: ${data.dimension_scores.execution}/50
- Hustle: ${data.dimension_scores.hustle}/50
- Problem-Solving: ${data.dimension_scores.problemSolving}/50
- Leadership: ${data.dimension_scores.leadership}/50

Founder Type: ${data.primary_founder_type} (${data.confidence_level} confidence)
${data.secondary_founder_type ? `Secondary Type: ${data.secondary_founder_type}` : ''}

Venture Fit Scores:
- Operator: ${data.venture_fit_scores.operator}
- Product: ${data.venture_fit_scores.product}
- Growth: ${data.venture_fit_scores.growth}
- Vision: ${data.venture_fit_scores.vision}

Team Compatibility:
- Working Style: ${data.team_compatibility_scores.workingStyle}
- Communication: ${data.team_compatibility_scores.communication}
- Conflict Response: ${data.team_compatibility_scores.conflictResponse}
- Decision Making: ${data.team_compatibility_scores.decisionMaking}
- Collaboration: ${data.team_compatibility_scores.collaboration}

Top Venture Matches:
${data.venture_matches.slice(0, 3).map((v, i) => `${i + 1}. ${v.venture_name} (${v.industry}) - ${v.overall_score}%
   Reasons: ${v.match_reasons.join(', ')}
   Concerns: ${v.concerns.join(', ')}`).join('\n')}

IMPORTANT: This is a new graduate/intern candidate. Focus on potential, learning indicators, and growth mindset rather than experience.

Generate a comprehensive evaluation. Be specific and evidence-based.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert talent evaluator for a startup studio. You analyze assessment results to provide actionable insights for hiring decisions. Your evaluations are:
- Evidence-based: Every insight ties to specific scores
- Balanced: Acknowledge both strengths and growth areas
- Actionable: Provide specific recommendations
- Empathetic: Remember candidates are early-career and evaluating potential, not past achievements

Always respond with valid JSON only, no markdown.`,
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_evaluation",
              description: "Generate a comprehensive AI evaluation of the candidate",
              parameters: {
                type: "object",
                properties: {
                  personalized_summary: {
                    type: "string",
                    description: "3-4 sentence personalized narrative explaining what makes this candidate unique. Focus on patterns and potential, not just restating scores.",
                  },
                  strengths: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        strength: { type: "string", description: "Name of the strength" },
                        evidence: { type: "string", description: "Evidence from scores supporting this strength" },
                        application: { type: "string", description: "How this strength applies to venture work" },
                      },
                      required: ["strength", "evidence", "application"],
                    },
                    description: "3-4 specific strengths with evidence",
                  },
                  growth_areas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string", description: "Name of the growth area" },
                        observation: { type: "string", description: "What the scores indicate" },
                        recommendation: { type: "string", description: "Actionable development suggestion" },
                      },
                      required: ["area", "observation", "recommendation"],
                    },
                    description: "2-3 growth areas with actionable recommendations",
                  },
                  response_patterns: {
                    type: "object",
                    properties: {
                      consistency: { type: "string", description: "Note any patterns in how they answered related questions" },
                      notable_patterns: { type: "array", items: { type: "string" }, description: "2-3 interesting patterns observed" },
                    },
                    required: ["consistency", "notable_patterns"],
                  },
                  red_flags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Any concerns that warrant attention. Empty if none.",
                  },
                  overall_recommendation: {
                    type: "string",
                    enum: ["Strong Recommend", "Recommend", "Consider", "Concerns"],
                    description: "Overall hiring recommendation",
                  },
                  recommendation_reasoning: {
                    type: "string",
                    description: "2-3 sentences explaining the recommendation",
                  },
                },
                required: [
                  "personalized_summary",
                  "strengths",
                  "growth_areas",
                  "response_patterns",
                  "red_flags",
                  "overall_recommendation",
                  "recommendation_reasoning",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_evaluation" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const evaluation = JSON.parse(toolCall.function.arguments);
    console.log("AI evaluation generated:", evaluation.overall_recommendation);

    // Save to database
    const { error: insertError } = await supabase.from("ai_evaluation").insert({
      assessment_result_id: data.assessment_result_id,
      personalized_summary: evaluation.personalized_summary,
      personalized_strengths: evaluation.strengths,
      personalized_growth_areas: evaluation.growth_areas,
      response_patterns: evaluation.response_patterns,
      red_flags: evaluation.red_flags || [],
      overall_recommendation: evaluation.overall_recommendation,
      recommendation_reasoning: evaluation.recommendation_reasoning,
    });

    if (insertError) {
      console.error("Failed to save AI evaluation:", insertError);
      throw insertError;
    }

    // Generate venture-specific analyses for top 3 matches
    for (const venture of data.venture_matches.slice(0, 3)) {
      await generateVentureAnalysis(
        supabase,
        LOVABLE_API_KEY,
        data.assessment_result_id,
        venture,
        data.applicant_name,
        data.primary_founder_type,
        data.dimension_scores
      );
    }

    return new Response(
      JSON.stringify({ success: true, evaluation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating AI evaluation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateVentureAnalysis(
  supabase: any,
  apiKey: string,
  assessmentResultId: string,
  venture: any,
  applicantName: string,
  founderType: string,
  dimensionScores: any
) {
  try {
    const prompt = `Generate a specific fit analysis for ${applicantName} (${founderType}) for ${venture.venture_name} (${venture.industry}).

Match Score: ${venture.overall_score}%
Match Reasons: ${venture.match_reasons.join(', ')}
Concerns: ${venture.concerns.join(', ')}

Candidate's dimension scores:
- Ownership: ${dimensionScores.ownership}/50
- Execution: ${dimensionScores.execution}/50
- Hustle: ${dimensionScores.hustle}/50

Remember: This is a new graduate/intern. Focus on potential and learning ability, not experience.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert at matching talent to ventures. Provide specific, actionable insights. Respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_venture_analysis",
              description: "Generate venture-specific fit analysis",
              parameters: {
                type: "object",
                properties: {
                  fit_narrative: {
                    type: "string",
                    description: "3-4 sentences explaining why this person fits (or doesn't fit) this specific venture",
                  },
                  role_recommendation: {
                    type: "string",
                    description: "Recommended starting role with brief reasoning",
                  },
                  onboarding_suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 specific onboarding suggestions to help them succeed",
                  },
                },
                required: ["fit_narrative", "role_recommendation", "onboarding_suggestions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_venture_analysis" } },
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate venture analysis:", await response.text());
      return;
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error("No tool call for venture analysis");
      return;
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    await supabase.from("ai_venture_analysis").insert({
      assessment_result_id: assessmentResultId,
      venture_id: venture.venture_id,
      fit_narrative: analysis.fit_narrative,
      role_recommendation: analysis.role_recommendation,
      onboarding_suggestions: analysis.onboarding_suggestions || [],
    });

    console.log(`Venture analysis saved for ${venture.venture_name}`);
  } catch (error) {
    console.error(`Error generating venture analysis for ${venture.venture_name}:`, error);
  }
}
