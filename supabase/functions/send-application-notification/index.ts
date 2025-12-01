import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationNotificationRequest {
  applicantName: string;
  applicantEmail: string;
  phone: string;
  linkedinUrl?: string;
  expectedSalary: string;
  applicationType: "internship" | "general";
  internshipTitle?: string;
  portfolioCompany?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ApplicationNotificationRequest = await req.json();
    console.log("Received application notification request:", data);

    const applicationTypeLabel = data.applicationType === "internship" 
      ? `Internship: ${data.internshipTitle} at ${data.portfolioCompany}`
      : "Venture Operator";

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "verigo54 <admin@verigo54.com>",
      to: ["admin@verigo54.com"],
      subject: `New Application: ${data.applicantName} - ${applicationTypeLabel}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Application Received</h1>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Application Type</h2>
            <p style="font-size: 16px; color: #666;">${applicationTypeLabel}</p>
          </div>

          <div style="margin: 20px 0;">
            <h2 style="color: #333;">Applicant Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Name</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${data.applicantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Email</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;"><a href="mailto:${data.applicantEmail}">${data.applicantEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Phone</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${data.phone}</td>
              </tr>
              ${data.linkedinUrl ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">LinkedIn</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;"><a href="${data.linkedinUrl}">${data.linkedinUrl}</a></td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Expected Salary</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${data.expectedSalary}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #333; color: #fff; border-radius: 8px; text-align: center;">
            <p style="margin: 0;">View full application details in the admin dashboard</p>
          </div>
        </div>
      `,
    });

    console.log("Admin email sent:", adminEmailResponse);

    // Send confirmation to applicant
    const applicantEmailResponse = await resend.emails.send({
      from: "verigo54 <admin@verigo54.com>",
      to: [data.applicantEmail],
      subject: "Application Received - verigo54",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Thank you for applying, ${data.applicantName}!</h1>
          
          <p style="font-size: 16px; color: #666; line-height: 1.6;">
            We've received your application${data.applicationType === "internship" ? ` for the ${data.internshipTitle} position at ${data.portfolioCompany}` : " as a Venture Operator"}.
          </p>

          <p style="font-size: 16px; color: #666; line-height: 1.6;">
            Our team will review your application and get back to you soon. We typically respond within 5-7 business days.
          </p>

          <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">What happens next?</h3>
            <ol style="color: #666; line-height: 1.8;">
              <li>We review your application and responses</li>
              <li>If shortlisted, we'll schedule a conversation</li>
              <li>Final selection and onboarding</li>
            </ol>
          </div>

          <p style="font-size: 14px; color: #999;">
            If you have any questions, feel free to reach out to us at admin@verigo54.com
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 14px; color: #999; margin: 0;">
              Best regards,<br>
              The verigo54 Team
            </p>
          </div>
        </div>
      `,
    });

    console.log("Applicant confirmation email sent:", applicantEmailResponse);

    return new Response(
      JSON.stringify({ success: true, adminEmail: adminEmailResponse, applicantEmail: applicantEmailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification emails:", error);
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
