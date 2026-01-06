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
    const { customerMessage, situationContext, desiredOutcome, teamMemberId } = await req.json();

    if (!customerMessage || !teamMemberId) {
      return new Response(
        JSON.stringify({ error: "Customer message and teamMemberId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert customer service representative. Generate helpful, empathetic, and professional responses to customer inquiries. Focus on:
1. Acknowledging the customer's concern
2. Providing clear and helpful information
3. Offering solutions or next steps
4. Maintaining a warm but professional tone`;

    const userPrompt = `Generate a customer service response for the following situation:

Customer Message/Inquiry:
"${customerMessage}"

${situationContext ? `Additional Context: ${situationContext}` : ""}
${desiredOutcome ? `Desired Outcome: ${desiredOutcome}` : ""}

Please provide three response variations:
1. Empathetic - Focus on understanding and acknowledging feelings
2. Solution-Focused - Focus on providing clear solutions and next steps
3. Brief - A shorter, more direct response for simple queries`;

    console.log("Generating customer service response with Lovable AI...");

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
              name: "format_responses",
              description: "Format the customer service responses",
              parameters: {
                type: "object",
                properties: {
                  empathetic: { type: "string", description: "Empathetic response variation" },
                  solutionFocused: { type: "string", description: "Solution-focused response variation" },
                  brief: { type: "string", description: "Brief response variation" },
                },
                required: ["empathetic", "solutionFocused", "brief"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "format_responses" } },
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

    let responsesData;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      responsesData = JSON.parse(toolCall.function.arguments);
    } else {
      throw new Error("Failed to parse AI response");
    }

    // Log the communication to the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: logError } = await supabase.from("ai_communications").insert({
      team_member_id: teamMemberId,
      communication_type: "customer_service",
      original_input: customerMessage,
      ai_output: JSON.stringify(responsesData),
      context: { situationContext, desiredOutcome },
      status: "draft",
    });

    if (logError) {
      console.error("Failed to log communication:", logError);
    }

    return new Response(
      JSON.stringify({ 
        responses: responsesData
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-customer-service:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
