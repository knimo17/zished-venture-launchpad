-- Drop the problematic policies
DROP POLICY IF EXISTS "Team members can view lists they own or collaborate on" ON public.todo_lists;
DROP POLICY IF EXISTS "Team members can view tasks they created, are assigned to, or c" ON public.tasks;

-- Create a simpler todo_lists SELECT policy (no circular reference)
CREATE POLICY "Team members can view all lists"
ON public.todo_lists
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'team_member'::app_role)
);

-- Simplified tasks SELECT policy (no circular reference to todo_lists)
CREATE POLICY "Team members can view tasks"
ON public.tasks
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
      AND (tm.id = tasks.created_by OR tm.id = tasks.assigned_to)
  ) OR
  EXISTS (
    SELECT 1 FROM task_collaborators tc
    JOIN team_members tm ON tm.id = tc.team_member_id
    WHERE tc.task_id = tasks.id AND tm.user_id = auth.uid()
  )
);