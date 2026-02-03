-- Drop the existing INSERT policy on tasks
DROP POLICY IF EXISTS "Team members can create tasks" ON public.tasks;

-- Recreate the policy to include goal assignees (using the security definer function)
CREATE POLICY "Team members can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  -- User must be the creator
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid() AND tm.id = tasks.created_by
  )
  AND (
    -- And either: they own the goal
    EXISTS (
      SELECT 1 FROM goals g
      JOIN team_members tm ON tm.id = g.owner_id
      WHERE g.id = tasks.goal_id AND tm.user_id = auth.uid()
    )
    -- Or: they are assigned to the goal
    OR is_goal_assignee(tasks.goal_id, auth.uid())
    -- Or: they have assign_tasks permission
    OR team_member_has_permission(auth.uid(), 'assign_tasks'::text)
  )
);