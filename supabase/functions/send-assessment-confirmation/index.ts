import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  applicantName: string;
  applicantEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicantName, applicantEmail }: ConfirmationEmailRequest = await req.json();

    console.log(`Sending assessment confirmation email to ${applicantEmail}`);

    const emailResponse = await resend.emails.send({
      from: "verigo54 <admin@verigo54.com>",
      to: [applicantEmail],
      subject: "Your Assessment Has Been Received - verigo54",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">verigo54</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${applicantName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We sincerely apologize for any technical difficulty you may have experienced when submitting your Operator Assessment.
            </p>
            
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 16px; color: #166534;">
                <strong>Good news:</strong> Your assessment has been successfully received and processed. All 70 of your responses have been recorded, and your application is now being reviewed by our team.
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for your patience and for taking the time to complete the assessment. We appreciate your interest in joining verigo54, and we'll be in touch soon with next steps.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 8px;">Best regards,</p>
            <p style="font-size: 16px; font-weight: 600; color: #1a1a2e;">The verigo54 Team</p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} verigo54. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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
