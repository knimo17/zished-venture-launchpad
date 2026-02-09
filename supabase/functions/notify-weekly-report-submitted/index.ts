import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  operator_name: string;
  operator_email: string;
  week_ending: string;
  report_id: string;
  session_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const appUrl = Deno.env.get("APP_URL") || "https://fezjiutlszkrvdubfvnc.lovableproject.com";
    const resend = new Resend(resendApiKey);

    const { operator_name, operator_email, week_ending, session_id }: NotifyRequest = await req.json();

    const adminEmails = ["admin@verigo54.com", "nana@verigo54.com"];
    const reportViewUrl = `${appUrl}/admin/weekly-report/${session_id}`;

    const emailResponse = await resend.emails.send({
      from: "Verigo54 Admin <admin@verigo54.com>",
      to: adminEmails,
      subject: `Weekly Report Submitted: ${operator_name} — Week Ending ${week_ending}`,
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
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #0f0f0f; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">verigo54</h1>
                      <p style="margin: 10px 0 0; color: #9ca3af; font-size: 14px;">Weekly Report Submission Notification</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        A weekly business report has been submitted.
                      </p>
                      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Operator:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${operator_name}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${operator_email}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Week Ending:</td>
                            <td style="padding: 8px 0; color: #6b7280;">${week_ending}</td>
                          </tr>
                        </table>
                      </div>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${reportViewUrl}" style="display: inline-block; padding: 16px 32px; background-color: #0f0f0f; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                          View Full Report
                        </a>
                      </div>
                    </td>
                  </tr>
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

    console.log("Admin notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-weekly-report-submitted:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
