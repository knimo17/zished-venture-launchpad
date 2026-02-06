
-- Drop and recreate INSERT policy to include goal assignees
DROP POLICY IF EXISTS "Users can add comments to visible goals" ON public.goal_comments;

CREATE POLICY "Users can add comments to visible goals"
ON public.goal_comments
FOR INSERT
WITH CHECK (
  author_id = get_current_team_member_id()
  AND EXISTS (
    SELECT 1 FROM goals g
    WHERE g.id = goal_comments.goal_id
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR g.owner_id = get_current_team_member_id()
      OR team_member_has_permission(auth.uid(), 'view_all_goals'::text)
      OR is_goal_assignee(g.id, auth.uid())
    )
  )
);

-- Also fix SELECT policy so assignees can see comments
DROP POLICY IF EXISTS "Users can view comments on visible goals" ON public.goal_comments;

CREATE POLICY "Users can view comments on visible goals"
ON public.goal_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM goals g
    WHERE g.id = goal_comments.goal_id
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR g.owner_id = get_current_team_member_id()
      OR team_member_has_permission(auth.uid(), 'view_all_goals'::text)
      OR is_goal_assignee(g.id, auth.uid())
    )
  )
);
