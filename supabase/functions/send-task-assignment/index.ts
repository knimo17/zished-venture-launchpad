import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskAssignmentRequest {
  task_id: string;
  assigned_to_id: string;
  assigned_by_id: string;
  is_new_task: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const appUrl = Deno.env.get("APP_URL") || "https://lovable.dev";

    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ message: "Email not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { task_id, assigned_to_id, assigned_by_id, is_new_task }: TaskAssignmentRequest = await req.json();

    console.log(`Processing task assignment: task=${task_id}, assignee=${assigned_to_id}, assigner=${assigned_by_id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        description,
        priority,
        status,
        due_date,
        todo_lists!inner (name)
      `)
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      console.error("Error fetching task:", taskError);
      throw new Error("Task not found");
    }

    // Get assignee details
    const { data: assignee, error: assigneeError } = await supabase
      .from("team_members")
      .select("id, name, email")
      .eq("id", assigned_to_id)
      .single();

    if (assigneeError || !assignee) {
      console.error("Error fetching assignee:", assigneeError);
      throw new Error("Assignee not found");
    }

    // Get assigner details
    const { data: assigner, error: assignerError } = await supabase
      .from("team_members")
      .select("id, name, email")
      .eq("id", assigned_by_id)
      .single();

    if (assignerError || !assigner) {
      console.error("Error fetching assigner:", assignerError);
      throw new Error("Assigner not found");
    }

    // Don't send email if assigning to self
    if (assigned_to_id === assigned_by_id) {
      console.log("Self-assignment, skipping email");
      return new Response(
        JSON.stringify({ message: "Self-assignment, no email sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    const dueDate = task.due_date
      ? new Date(task.due_date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "No due date set";

    const priorityColors: Record<string, string> = {
      high: "#ef4444",
      medium: "#f59e0b",
      low: "#22c55e",
    };

    const subject = is_new_task
      ? `New Task Assigned: ${task.title}`
      : `Task Reassigned: ${task.title}`;

    const actionText = is_new_task ? "assigned you a new task" : "reassigned a task to you";

    const emailResponse = await resend.emails.send({
      from: "Task Manager <onboarding@resend.dev>",
      to: [assignee.email],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Task Assignment</h2>
          <p style="color: #666;">Hi ${assignee.name},</p>
          <p style="color: #666;">${assigner.name} ${actionText}:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${task.title}</h3>
            ${task.description ? `<p style="margin: 0 0 10px 0; color: #666;">${task.description}</p>` : ""}
            <p style="margin: 0; color: #888;">
              <strong>Priority:</strong> 
              <span style="color: ${priorityColors[task.priority] || '#888'}; text-transform: capitalize;">
                ${task.priority}
              </span>
            </p>
            <p style="margin: 5px 0 0 0; color: #888;"><strong>Due:</strong> ${dueDate}</p>
            <p style="margin: 5px 0 0 0; color: #888;"><strong>List:</strong> ${(task as any).todo_lists.name}</p>
          </div>
          <p style="color: #666;">
            <a href="${appUrl}/team/tasks" style="background: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Task
            </a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            You're receiving this because you were assigned to a task in the team task manager.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-task-assignment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
