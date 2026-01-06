import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalText, refinementType, teamMemberId } = await req.json();

    if (!originalText || !teamMemberId) {
      return new Response(
        JSON.stringify({ error: "Original text and teamMemberId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const refinementInstructions: Record<string, string> = {
      clarity: "Improve the clarity and readability of the text. Make it easier to understand while preserving the original meaning.",
      grammar: "Fix all grammatical errors, spelling mistakes, and punctuation issues. Improve sentence structure where needed.",
      professional: "Make the text more professional and formal. Use business-appropriate language and tone.",
      concise: "Make the text more concise and to the point. Remove unnecessary words and redundancy while keeping the core message.",
      friendly: "Make the text warmer and more friendly. Use a conversational tone while remaining professional.",
    };

    const instruction = refinementInstructions[refinementType] || refinementInstructions.clarity;

    const systemPrompt = `You are a professional text editor and writing assistant. Your job is to refine and improve text based on specific requirements. Always maintain the original meaning and intent while making improvements.`;

    const userPrompt = `Please refine the following text:

"${originalText}"

Instructions: ${instruction}

Provide the refined version and briefly explain the key changes you made.`;

    console.log("Refining text with Lovable AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "format_refinement",
              description: "Format the refined text with explanation",
              parameters: {
                type: "object",
                properties: {
                  refinedText: { type: "string", description: "The improved version of the text" },
                  changes: { type: "string", description: "Brief explanation of key changes made" },
                },
                required: ["refinedText", "changes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "format_refinement" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data).substring(0, 200));

    let refinementData;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      refinementData = JSON.parse(toolCall.function.arguments);
    } else {
      throw new Error("Failed to parse AI response");
    }

    // Log the communication to the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: logError } = await supabase.from("ai_communications").insert({
      team_member_id: teamMemberId,
      communication_type: "text_refinement",
      original_input: originalText,
      ai_output: refinementData.refinedText,
      context: { refinementType, changes: refinementData.changes },
      status: "draft",
    });

    if (logError) {
      console.error("Failed to log communication:", logError);
    }

    return new Response(
      JSON.stringify({ 
        refinedText: refinementData.refinedText, 
        changes: refinementData.changes 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-refine-text:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
