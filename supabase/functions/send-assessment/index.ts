import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendAssessmentRequest {
  application_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { application_id }: SendAssessmentRequest = await req.json();

    if (!application_id) {
      console.error("Missing application_id");
      return new Response(
        JSON.stringify({ error: "application_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing assessment request for application: ${application_id}`);

    // Get application details
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, name, email")
      .eq("id", application_id)
      .single();

    if (appError || !application) {
      console.error("Application not found:", appError);
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if assessment already exists
    const { data: existingSession } = await supabase
      .from("assessment_sessions")
      .select("id, status")
      .eq("application_id", application_id)
      .maybeSingle();

    if (existingSession) {
      console.log(`Assessment already exists for application ${application_id}, status: ${existingSession.status}`);
      return new Response(
        JSON.stringify({ 
          error: "Assessment already sent", 
          status: existingSession.status 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate unique token
    const token = crypto.randomUUID();

    // Create assessment session
    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .insert({
        application_id,
        token,
        status: "pending",
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Failed to create session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to create assessment session" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Created assessment session: ${session.id}`);

    // Build assessment URL (remove trailing slash if present)
    const rawAppUrl = Deno.env.get("APP_URL") || "https://fezjiutlszkrvdubfvnc.lovableproject.com";
    const appUrl = rawAppUrl.replace(/\/+$/, '');
    const assessmentUrl = `${appUrl}/assessment/${token}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "verigo54 <onboarding@resend.dev>",
      to: [application.email],
      subject: "Complete Your Founder Assessment - verigo54",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #1a1a1a; margin-bottom: 10px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
            .button { 
              display: inline-block; 
              background: #1a1a1a; 
              color: white !important; 
              padding: 14px 28px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>verigo54</h1>
              <p>Founder Assessment</p>
            </div>
            <div class="content">
              <p>Hi ${application.name},</p>
              
              <p>Thank you for applying to verigo54. As the next step in our evaluation process, we'd like you to complete a Founder Assessment.</p>
              
              <p><strong>About the Assessment:</strong></p>
              <ul>
                <li>70 questions designed to understand your founder profile</li>
                <li>Takes approximately 15-20 minutes</li>
                <li>Your progress is saved automatically - you can continue later if needed</li>
                <li>There are no right or wrong answers - be honest and authentic</li>
              </ul>
              
              <p style="text-align: center;">
                <a href="${assessmentUrl}" class="button">Start Assessment</a>
              </p>
              
              <p>Or copy this link into your browser:</p>
              <p style="word-break: break-all; font-size: 14px; color: #666;">${assessmentUrl}</p>
              
              <p>This assessment helps us understand how you think, operate, and where you might best fit within our portfolio of ventures.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} verigo54. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        session_id: session.id,
        message: "Assessment email sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-assessment function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
