import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const appUrl = Deno.env.get("APP_URL") || "https://lovable.dev";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for pending task reminders...");

    // Get all unsent reminders that are due
    const { data: reminders, error: remindersError } = await supabase
      .from("task_reminders")
      .select(`
        id,
        task_id,
        reminder_type,
        scheduled_for,
        tasks!inner (
          id,
          title,
          description,
          due_date,
          status,
          assigned_to,
          created_by,
          goal_id,
          goals!inner (
            name,
            owner_id
          )
        )
      `)
      .eq("is_sent", false)
      .lte("scheduled_for", new Date().toISOString());

    if (remindersError) {
      console.error("Error fetching reminders:", remindersError);
      throw remindersError;
    }

    console.log(`Found ${reminders?.length || 0} pending reminders`);

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: "No pending reminders" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sentReminders: string[] = [];

    for (const reminder of reminders) {
      const task = reminder.tasks as any;
      
      // Get the team members to notify (assigned_to and created_by)
      const memberIds = [task.assigned_to, task.created_by].filter(Boolean);
      const uniqueMemberIds = [...new Set(memberIds)];

      if (uniqueMemberIds.length === 0) continue;

      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("id, name, email")
        .in("id", uniqueMemberIds);

      if (membersError || !members) {
        console.error("Error fetching team members:", membersError);
        continue;
      }

      // Get collaborators
      const { data: collaborators } = await supabase
        .from("task_collaborators")
        .select(`
          team_member_id,
          team_members!inner (name, email)
        `)
        .eq("task_id", task.id);

      // For overdue tasks, also get admins to notify
      let adminRecipients: { name: string; email: string }[] = [];
      if (reminder.reminder_type === "overdue") {
        // Get all team members with admin role
        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (adminRoles && adminRoles.length > 0) {
          const adminUserIds = adminRoles.map((r: any) => r.user_id);
          
          // Get admin team members by matching user_id
          const { data: adminMembers } = await supabase
            .from("team_members")
            .select("name, email")
            .in("user_id", adminUserIds);

          if (adminMembers) {
            adminRecipients = adminMembers;
          }
        }
      }

      const allRecipients = [
        ...members,
        ...(collaborators?.map((c: any) => c.team_members) || []),
        ...adminRecipients
      ];

      const uniqueRecipients = allRecipients.filter(
        (recipient, index, self) =>
          index === self.findIndex((r) => r.email === recipient.email)
      );

      if (resendApiKey && uniqueRecipients.length > 0) {
        const resend = new Resend(resendApiKey);

        const reminderTypeMap: Record<string, string> = {
          before_due: "Upcoming Due Date",
          on_due: "Due Today",
          overdue: "⚠️ Overdue Task",
        };
        const reminderTypeText = reminderTypeMap[reminder.reminder_type] || "Task Reminder";

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

        // Get assigned member name for context in admin emails
        const assignedMember = members.find((m: any) => m.id === task.assigned_to);
        const assignedToName = assignedMember?.name || "Unassigned";

        for (const recipient of uniqueRecipients) {
          const isAdmin = adminRecipients.some(a => a.email === recipient.email);
          const isAssignee = members.some((m: any) => m.id === task.assigned_to && m.email === recipient.email);
          
          // Customize message based on recipient role
          let introMessage = "This is a reminder about your task:";
          if (reminder.reminder_type === "overdue") {
            if (isAdmin && !isAssignee) {
              introMessage = `A task assigned to <strong>${assignedToName}</strong> is overdue and may need attention:`;
            } else {
              introMessage = "This task is overdue. If you're facing any blockers, please reach out so we can help:";
            }
          }

          try {
            await resend.emails.send({
              from: "Task Manager <onboarding@resend.dev>",
              to: [recipient.email],
              subject: `[${reminderTypeText}] ${task.title}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: ${reminder.reminder_type === 'overdue' ? '#dc2626' : '#333'};">${reminderTypeText}: ${task.title}</h2>
                  <p style="color: #666;">Hi ${recipient.name},</p>
                  <p style="color: #666;">${introMessage}</p>
                  <div style="background: ${reminder.reminder_type === 'overdue' ? '#fef2f2' : '#f5f5f5'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${reminder.reminder_type === 'overdue' ? '#dc2626' : '#333'};">
                    <h3 style="margin: 0 0 10px 0; color: #333;">${task.title}</h3>
                    ${task.description ? `<p style="margin: 0 0 10px 0; color: #666;">${task.description}</p>` : ""}
                    <p style="margin: 0; color: #888;"><strong>Assigned to:</strong> ${assignedToName}</p>
                    <p style="margin: 5px 0 0 0; color: ${reminder.reminder_type === 'overdue' ? '#dc2626' : '#888'};"><strong>Due:</strong> ${dueDate}</p>
                    <p style="margin: 5px 0 0 0; color: #888;"><strong>Status:</strong> ${task.status}</p>
                    <p style="margin: 5px 0 0 0; color: #888;"><strong>Goal:</strong> ${task.goals.name}</p>
                  </div>
                  <p style="color: #666;">
                    <a href="${appUrl}/team/tasks" style="background: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      View Task
                    </a>
                  </p>
                </div>
              `,
            });
            console.log(`Sent ${reminder.reminder_type} reminder email to ${recipient.email} for task ${task.id}`);
          } catch (emailError) {
            console.error(`Failed to send email to ${recipient.email}:`, emailError);
          }
        }
      }

      // Mark reminder as sent
      const { error: updateError } = await supabase
        .from("task_reminders")
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq("id", reminder.id);

      if (updateError) {
        console.error("Error updating reminder:", updateError);
      } else {
        sentReminders.push(reminder.id);
      }
    }

    // Check for overdue tasks that don't have overdue reminders yet
    const { data: overdueTasks } = await supabase
      .from("tasks")
      .select("id, due_date")
      .lt("due_date", new Date().toISOString())
      .neq("status", "completed");

    if (overdueTasks && overdueTasks.length > 0) {
      for (const task of overdueTasks) {
        // Check if an overdue reminder already exists
        const { data: existingReminder } = await supabase
          .from("task_reminders")
          .select("id")
          .eq("task_id", task.id)
          .eq("reminder_type", "overdue")
          .maybeSingle();

        if (!existingReminder) {
          // Create overdue reminder
          await supabase.from("task_reminders").insert({
            task_id: task.id,
            reminder_type: "overdue",
            scheduled_for: new Date().toISOString(),
            is_sent: false,
          });
          console.log(`Created overdue reminder for task ${task.id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Reminders processed",
        sent: sentReminders.length,
        reminderIds: sentReminders,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in check-task-reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
