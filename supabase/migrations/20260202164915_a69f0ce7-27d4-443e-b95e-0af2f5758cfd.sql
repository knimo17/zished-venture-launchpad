
-- Create goal_assignees table for many-to-many relationship
CREATE TABLE public.goal_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(goal_id, team_member_id)
);

-- Enable RLS
ALTER TABLE public.goal_assignees ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admins can manage all goal assignees"
ON public.goal_assignees
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Goal owners can manage assignees
CREATE POLICY "Goal owners can manage assignees"
ON public.goal_assignees
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM goals g
    JOIN team_members tm ON tm.id = g.owner_id
    WHERE g.id = goal_assignees.goal_id AND tm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM goals g
    JOIN team_members tm ON tm.id = g.owner_id
    WHERE g.id = goal_assignees.goal_id AND tm.user_id = auth.uid()
  )
);

-- Team members with assign_goals permission can manage assignees
CREATE POLICY "Permitted members can manage assignees"
ON public.goal_assignees
FOR ALL
USING (team_member_has_permission(auth.uid(), 'assign_goals'))
WITH CHECK (team_member_has_permission(auth.uid(), 'assign_goals'));

-- Assignees can view their own assignments
CREATE POLICY "Assignees can view own assignments"
ON public.goal_assignees
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.id = goal_assignees.team_member_id AND tm.user_id = auth.uid()
  )
);

-- Update goals SELECT policy to include assignees
DROP POLICY IF EXISTS "Team members can view own goals or all if permitted" ON public.goals;

CREATE POLICY "Team members can view own goals or all if permitted"
ON public.goals
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR owner_id = get_current_team_member_id()
  OR team_member_has_permission(auth.uid(), 'view_all_goals')
  OR EXISTS (
    SELECT 1 FROM goal_assignees ga
    JOIN team_members tm ON tm.id = ga.team_member_id
    WHERE ga.goal_id = goals.id AND tm.user_id = auth.uid()
  )
);
