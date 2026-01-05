-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Team members can view tasks" ON public.tasks;

-- Create a properly scoped SELECT policy
-- Team members can only see:
-- 1. Tasks they created
-- 2. Tasks assigned to them
-- 3. Tasks where they are collaborators
CREATE POLICY "Team members can view own and assigned tasks"
ON public.tasks
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND (tm.id = tasks.created_by OR tm.id = tasks.assigned_to)
  )
  OR is_task_collaborator(tasks.id, auth.uid())
);