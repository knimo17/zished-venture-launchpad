import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goalName, goalDescription, targetDate } = await req.json();
    
    if (!goalName) {
      return new Response(
        JSON.stringify({ error: 'Goal name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const daysUntilTarget = targetDate 
      ? Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    const timeContext = daysUntilTarget 
      ? `The goal should be completed in ${daysUntilTarget} days (by ${targetDate}). Space out the tasks appropriately.`
      : 'No specific deadline, but suggest reasonable timeframes.';

    const systemPrompt = `You are a productivity coach helping break down goals into actionable steps. 
Keep tasks simple, specific, and achievable. Each task should be something that can be done in a single sitting.
Return exactly 4-6 tasks, ordered from first to last.`;

    const userPrompt = `Break down this goal into simple, actionable steps:

Goal: ${goalName}
${goalDescription ? `Description: ${goalDescription}` : ''}
${timeContext}

Return tasks as a JSON array. Each task should have:
- title: short action (start with a verb like "Create", "Set up", "Research", etc.)
- description: one sentence explaining what to do
- priority: "high", "medium", or "low"
- is_required: true if essential for the goal, false if optional
- days_from_now: suggested number of days from today to complete this`;

    console.log("Calling Lovable AI for task suggestions...");

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_tasks",
              description: "Return 4-6 actionable task suggestions for the goal.",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        is_required: { type: "boolean" },
                        days_from_now: { type: "number" }
                      },
                      required: ["title", "description", "priority", "is_required", "days_from_now"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["tasks"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_tasks" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits needed. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate suggestions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract tasks from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const suggestions = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify({ tasks: suggestions.tasks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in suggest-tasks:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
