import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  user_id: string | null;
  is_active: boolean;
}

export function useCurrentTeamMember() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function fetchMember() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from("team_members")
          .select("id, name, email, user_id, is_active")
          .eq("user_id", user.id)
          .is("invite_token", null)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (queryError) {
          console.error("useCurrentTeamMember: error", queryError);
          setError("Failed to load team member data");
        } else if (!data && !isAdmin) {
          setError("You are not registered as a team member.");
        } else {
          setCurrentMember(data);
        }
      } catch (err) {
        console.error("useCurrentTeamMember: unexpected error", err);
        setError("Failed to load team member data");
      } finally {
        setLoading(false);
      }
    }

    fetchMember();
  }, [user, isAdmin, authLoading]);

  return { currentMember, loading: authLoading || loading, error, isAdmin };
}
