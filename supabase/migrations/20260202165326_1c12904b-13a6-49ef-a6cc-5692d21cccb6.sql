-- Create security definer function to check goal assignee without triggering RLS
CREATE OR REPLACE FUNCTION public.is_goal_assignee(_goal_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM goal_assignees ga
    JOIN team_members tm ON tm.id = ga.team_member_id
    WHERE ga.goal_id = _goal_id AND tm.user_id = _user_id
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Team members can view own goals or all if permitted" ON public.goals;

-- Recreate the policy using the security definer function
CREATE POLICY "Team members can view own goals or all if permitted"
ON public.goals
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR owner_id = get_current_team_member_id()
  OR team_member_has_permission(auth.uid(), 'view_all_goals'::text)
  OR is_goal_assignee(id, auth.uid())
);