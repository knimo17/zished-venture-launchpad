
-- Update tasks SELECT policy to include users with view_all_goals permission
DROP POLICY IF EXISTS "Team members can view own and assigned tasks" ON public.tasks;

CREATE POLICY "Team members can view own and assigned tasks"
ON public.tasks
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
      AND (tm.id = tasks.created_by OR tm.id = tasks.assigned_to)
  ))
  OR is_task_collaborator(id, auth.uid())
  OR team_member_has_permission(auth.uid(), 'view_all_goals'::text)
);
