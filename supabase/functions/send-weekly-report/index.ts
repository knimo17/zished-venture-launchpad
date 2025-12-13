import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

interface SendWeeklyReportRequest {
  operator_email: string;
  operator_name: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://fezjiutlszkrvdubfvnc.lovableproject.com";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { operator_email, operator_name }: SendWeeklyReportRequest = await req.json();

    if (!operator_email || !operator_name) {
      return new Response(
        JSON.stringify({ error: "operator_email and operator_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique token
    const token = crypto.randomUUID();

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from("weekly_report_sessions")
      .insert({
        token,
        operator_email,
        operator_name,
        status: "pending",
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Error creating session:", sessionError);
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    console.log("Created weekly report session:", session.id);

    const reportUrl = `${appUrl}/weekly-report/${token}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "verigo54 <admin@verigo54.com>",
      to: [operator_email],
      subject: "Weekly Business Report - verigo54",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #0f0f0f; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">verigo54</h1>
                      <p style="margin: 10px 0 0; color: #9ca3af; font-size: 14px;">Weekly Business Report</p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Hello ${operator_name},
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        It's time to submit your weekly business report. Please complete all sections thoughtfully – this report helps us assess leadership, execution, judgment, and business momentum.
                      </p>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${reportUrl}" style="display: inline-block; padding: 16px 32px; background-color: #0f0f0f; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                          Complete Weekly Report
                        </a>
                      </div>
                      
                      <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        <strong>Submission deadline:</strong> Every Friday, 6:00 PM<br>
                        <strong>Reporting currency:</strong> Ghana Cedis (GHS)
                      </p>
                      
                      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If you have any questions, please reach out to the verigo54 team.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} verigo54. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
