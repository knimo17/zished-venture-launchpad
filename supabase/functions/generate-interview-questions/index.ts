import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InterviewQuestionsRequest {
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

    const data: InterviewQuestionsRequest = await req.json();
    console.log("Generating interview questions for:", data.applicant_name);

    // Identify areas to probe
    const scores = data.dimension_scores;
    const lowestDimension = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b);
    const highestDimension = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);

    const topVentures = data.venture_matches.slice(0, 2);

    const prompt = `Generate 5-7 personalized interview questions for this candidate assessment.

Candidate Profile:
- Name: ${data.applicant_name}
- Primary Founder Type: ${data.primary_founder_type} (${data.confidence_level} confidence)
${data.secondary_founder_type ? `- Secondary Type: ${data.secondary_founder_type}` : ''}

Scores (out of 50):
- Ownership: ${scores.ownership}
- Execution: ${scores.execution}
- Hustle: ${scores.hustle}
- Problem-Solving: ${scores.problemSolving}
- Leadership: ${scores.leadership}

Strongest Area: ${highestDimension[0]} (${highestDimension[1]}/50)
Growth Area: ${lowestDimension[0]} (${lowestDimension[1]}/50)

Top Venture Matches:
${topVentures.map((v, i) => `${i + 1}. ${v.venture_name} (${v.industry}) - ${v.overall_score}%
   Industry: ${v.industry}
   Concerns: ${v.concerns.join(', ') || 'None identified'}`).join('\n')}

CRITICAL CONTEXT:
- Candidate is likely a NEW GRADUATE or INTERN
- Do NOT assume any direct work experience
- Focus on: potential, learning ability, academic/personal projects, hypothetical scenarios
- Use questions about school projects, volunteer work, personal initiatives, or "if you were..." scenarios

Generate questions that:
1. Validate their top strength (${highestDimension[0]}) using school/personal project examples
2. Explore their approach to their growth area (${lowestDimension[0]}) 
3. Assess curiosity about their top venture match (${topVentures[0]?.venture_name || 'ventures'})
4. Test problem-solving with a hypothetical scenario
5. Understand their initiative and self-starting ability
6. Probe any concerns from venture matching`;

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
            content: `You are an expert interviewer for a startup studio that recruits new graduates and interns as venture operators. Your questions are:
- Potential-focused: Assess capability to learn and grow, not past experience
- Specific: Tied to their actual assessment results
- Open-ended: Allow candidates to share their thought process
- Practical: Use hypothetical scenarios they could actually face

Always respond with valid JSON only.`,
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: "Generate personalized interview questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_text: {
                          type: "string",
                          description: "The interview question to ask",
                        },
                        question_context: {
                          type: "string",
                          description: "Brief explanation of why this question is being asked (shown to admin)",
                        },
                        probing_area: {
                          type: "string",
                          enum: ["strength_validation", "growth_exploration", "venture_curiosity", "problem_solving", "initiative", "concern_probing", "learning_agility"],
                          description: "What aspect this question probes",
                        },
                        related_venture_name: {
                          type: "string",
                          description: "Name of related venture if this is a venture-specific question, null otherwise",
                        },
                      },
                      required: ["question_text", "question_context", "probing_area"],
                    },
                    description: "5-7 personalized interview questions",
                  },
                },
                required: ["questions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } },
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

    const result = JSON.parse(toolCall.function.arguments);
    console.log(`Generated ${result.questions.length} interview questions`);

    // Find venture IDs for questions
    const ventureNameToId: Record<string, string> = {};
    data.venture_matches.forEach(v => {
      ventureNameToId[v.venture_name] = v.venture_id;
    });

    // Save questions to database
    const questionsToInsert = result.questions.map((q: any, index: number) => ({
      assessment_result_id: data.assessment_result_id,
      question_text: q.question_text,
      question_context: q.question_context,
      probing_area: q.probing_area,
      related_venture_id: q.related_venture_name ? ventureNameToId[q.related_venture_name] || null : null,
      question_order: index + 1,
    }));

    const { data: insertedQuestions, error: insertError } = await supabase
      .from("ai_interview_questions")
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error("Failed to save interview questions:", insertError);
      throw insertError;
    }

    console.log(`Saved ${insertedQuestions.length} interview questions`);

    return new Response(
      JSON.stringify({ success: true, questions: insertedQuestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating interview questions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
