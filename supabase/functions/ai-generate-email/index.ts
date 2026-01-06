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
    const { recipientName, purpose, keyPoints, tone, teamMemberId } = await req.json();

    if (!purpose || !teamMemberId) {
      return new Response(
        JSON.stringify({ error: "Purpose and teamMemberId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional email writing assistant. Generate clear, well-structured emails based on the user's requirements. Always provide both a subject line and email body. Be concise yet thorough.`;

    const userPrompt = `Generate a professional email with the following details:
- Recipient: ${recipientName || "the recipient"}
- Purpose: ${purpose}
- Key points to include: ${keyPoints || "None specified"}
- Tone: ${tone || "professional"}

Please provide:
1. Subject line (concise and clear)
2. Email body (properly formatted with greeting, body, and closing)`;

    console.log("Generating email with Lovable AI...");

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
              name: "format_email",
              description: "Format the generated email with subject and body",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string", description: "Email subject line" },
                  body: { type: "string", description: "Email body content" },
                },
                required: ["subject", "body"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "format_email" } },
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

    let emailData;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      emailData = JSON.parse(toolCall.function.arguments);
    } else {
      throw new Error("Failed to parse AI response");
    }

    // Log the communication to the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: logError } = await supabase.from("ai_communications").insert({
      team_member_id: teamMemberId,
      communication_type: "email",
      original_input: JSON.stringify({ recipientName, purpose, keyPoints, tone }),
      ai_output: JSON.stringify(emailData),
      context: { recipientName, purpose, tone },
      status: "draft",
    });

    if (logError) {
      console.error("Failed to log communication:", logError);
    }

    return new Response(
      JSON.stringify({ 
        subject: emailData.subject, 
        body: emailData.body,
        communicationId: null // Would be returned if we captured the insert ID
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-generate-email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
