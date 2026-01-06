import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentTeamMember } from "@/hooks/useCurrentTeamMember";

export type Permission = "view_applications" | "view_weekly_reports" | "assign_tasks" | "view_all_goals" | "assign_goals" | "manage_team_members" | "view_communications";

export function useTeamMemberPermissions() {
  const { currentMember, loading: memberLoading, isAdmin } = useCurrentTeamMember();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberLoading) return;

    async function fetchPermissions() {
      if (!currentMember) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("team_member_permissions")
          .select("permission")
          .eq("team_member_id", currentMember.id);

        if (error) {
          console.error("Error fetching permissions:", error);
        } else {
          setPermissions((data || []).map((p) => p.permission as Permission));
        }
      } catch (err) {
        console.error("Unexpected error fetching permissions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [currentMember, memberLoading]);

  const hasPermission = (permission: Permission): boolean => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  return { permissions, hasPermission, loading: memberLoading || loading, isAdmin };
}
