-- Create security definer function to check if user is a task collaborator
CREATE OR REPLACE FUNCTION public.is_task_collaborator(_user_id uuid, _task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM task_collaborators tc
    JOIN team_members tm ON tm.id = tc.team_member_id
    WHERE tc.task_id = _task_id AND tm.user_id = _user_id
  )
$$;

-- Create security definer function to check if user owns/is assigned to a task
CREATE OR REPLACE FUNCTION public.is_task_member(_user_id uuid, _task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tasks t
    JOIN team_members tm ON (tm.id = t.created_by OR tm.id = t.assigned_to)
    WHERE t.id = _task_id AND tm.user_id = _user_id
  )
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can view collaborators on their tasks" ON public.task_collaborators;

-- Recreate tasks SELECT policy using security definer function
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
  is_task_collaborator(auth.uid(), tasks.id)
);

-- Recreate task_collaborators SELECT policy using security definer function
CREATE POLICY "Team members can view collaborators on their tasks"
ON public.task_collaborators
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  is_task_member(auth.uid(), task_id) OR
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.id = task_collaborators.team_member_id AND tm.user_id = auth.uid()
  )
);