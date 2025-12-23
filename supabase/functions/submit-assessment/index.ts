import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface SubmitAssessmentRequest {
  token: string;
  assessment_result: {
    dimension_scores: Json;
    venture_fit_scores: Json;
    team_compatibility_scores: Json;
    primary_operator_type: string;
    secondary_operator_type?: string | null;
    confidence_level: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    weakness_summary: string;
  };
  venture_matches?: Array<{
    venture_id: string;
    overall_score: number;
    operator_type_score: number;
    dimension_score: number;
    compatibility_score: number;
    match_reasons: string[];
    concerns: string[];
    suggested_role?: string | null;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: SubmitAssessmentRequest = await req.json();

    if (!payload?.token) {
      return new Response(JSON.stringify({ error: "token is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!payload?.assessment_result) {
      return new Response(JSON.stringify({ error: "assessment_result is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("submit-assessment: starting", {
      token: payload.token,
      has_matches: Array.isArray(payload.venture_matches),
      matches_len: payload.venture_matches?.length ?? 0,
    });

    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("id, status")
      .eq("token", payload.token)
      .maybeSingle();

    if (sessionError) {
      console.error("submit-assessment: session lookup error", sessionError);
      return new Response(JSON.stringify({ error: "Failed to load session" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const insertPayload = {
      session_id: session.id,
      dimension_scores: payload.assessment_result.dimension_scores,
      venture_fit_scores: payload.assessment_result.venture_fit_scores,
      team_compatibility_scores: payload.assessment_result.team_compatibility_scores,
      primary_operator_type: payload.assessment_result.primary_operator_type,
      secondary_operator_type: payload.assessment_result.secondary_operator_type ?? null,
      confidence_level: payload.assessment_result.confidence_level,
      summary: payload.assessment_result.summary,
      strengths: payload.assessment_result.strengths,
      weaknesses: payload.assessment_result.weaknesses,
      weakness_summary: payload.assessment_result.weakness_summary,
    };

    // Idempotent: upsert on unique session_id
    const { data: resultRow, error: resultError } = await supabase
      .from("assessment_results")
      .upsert(insertPayload, { onConflict: "session_id" })
      .select("id")
      .single();

    if (resultError || !resultRow) {
      console.error("submit-assessment: results upsert error", resultError);
      return new Response(JSON.stringify({ error: "Failed to save assessment results" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const assessment_result_id = resultRow.id as string;

    // Replace venture matches to avoid duplicates on retries
    if (Array.isArray(payload.venture_matches)) {
      const { error: deleteError } = await supabase
        .from("venture_matches")
        .delete()
        .eq("assessment_result_id", assessment_result_id);

      if (deleteError) {
        console.error("submit-assessment: venture_matches delete error", deleteError);
        return new Response(JSON.stringify({ error: "Failed to save venture matches" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (payload.venture_matches.length > 0) {
        const rows = payload.venture_matches.map((m) => ({
          assessment_result_id,
          venture_id: m.venture_id,
          overall_score: m.overall_score,
          operator_type_score: m.operator_type_score,
          dimension_score: m.dimension_score,
          compatibility_score: m.compatibility_score,
          match_reasons: m.match_reasons,
          concerns: m.concerns,
          suggested_role: m.suggested_role ?? null,
        }));

        const { error: insertError } = await supabase.from("venture_matches").insert(rows);
        if (insertError) {
          console.error("submit-assessment: venture_matches insert error", insertError);
          return new Response(JSON.stringify({ error: "Failed to save venture matches" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
    }

    // Mark session complete
    const { error: sessionUpdateError } = await supabase
      .from("assessment_sessions")
      .update({
        status: "completed",
        interview_status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (sessionUpdateError) {
      console.error("submit-assessment: session update error", sessionUpdateError);
      return new Response(JSON.stringify({ error: "Failed to complete session" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("submit-assessment: success", {
      session_id: session.id,
      previous_status: session.status,
      assessment_result_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        session_id: session.id,
        assessment_result_id,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: unknown) {
    console.error("submit-assessment: unexpected error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
