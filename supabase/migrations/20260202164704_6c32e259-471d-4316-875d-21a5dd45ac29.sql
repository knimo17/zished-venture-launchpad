
-- Drop the existing restrictive INSERT policy for tasks
DROP POLICY IF EXISTS "Team members can create tasks in their lists" ON public.tasks;

-- Create a new policy that allows:
-- 1. Goal owners to create tasks in their own goals
-- 2. Team members with 'assign_tasks' permission to create tasks in any goal
CREATE POLICY "Team members can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  -- Must be setting created_by to their own team_member_id
  (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid() AND tm.id = tasks.created_by
  ))
  AND
  (
    -- Either they own the goal
    (EXISTS (
      SELECT 1 FROM goals g
      JOIN team_members tm ON tm.id = g.owner_id
      WHERE g.id = tasks.goal_id AND tm.user_id = auth.uid()
    ))
    OR
    -- Or they have the assign_tasks permission
    team_member_has_permission(auth.uid(), 'assign_tasks')
  )
);
