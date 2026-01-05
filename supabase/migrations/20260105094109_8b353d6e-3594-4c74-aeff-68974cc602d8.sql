-- Drop and recreate the tasks SELECT policy to allow team members to view all tasks in lists
DROP POLICY IF EXISTS "Team members can view tasks" ON public.tasks;

CREATE POLICY "Team members can view tasks"
ON public.tasks
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'team_member'::app_role)
);