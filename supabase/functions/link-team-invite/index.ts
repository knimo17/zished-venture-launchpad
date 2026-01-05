import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LinkInviteRequest {
  invite_token: string;
  user_id: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body: LinkInviteRequest = await req.json();
    const { invite_token, user_id } = body;

    if (!invite_token || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "invite_token and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("link-team-invite: linking user", user_id, "with token", invite_token);

    // Find the team member by invite_token
    const { data: member, error: fetchError } = await supabase
      .from("team_members")
      .select("id, email, user_id")
      .eq("invite_token", invite_token)
      .maybeSingle();

    if (fetchError) {
      console.error("link-team-invite: fetch error", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch invite" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!member) {
      return new Response(
        JSON.stringify({ success: false, error: "Invite not found or already used" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (member.user_id && member.user_id !== user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Invite already linked to a different user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the team member: set user_id, clear invite_token
    const { error: updateError } = await supabase
      .from("team_members")
      .update({ user_id, invite_token: null })
      .eq("id", member.id);

    if (updateError) {
      console.error("link-team-invite: update error", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to link account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure team_member role exists for this user
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id, role: "team_member" }, { onConflict: "user_id,role" });

    if (roleError) {
      console.error("link-team-invite: role upsert error", roleError);
      // Non-blocking: role may already exist via trigger
    }

    console.log("link-team-invite: success for member", member.id);

    return new Response(
      JSON.stringify({ success: true, team_member_id: member.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("link-team-invite: unexpected error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
