-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create todo_lists table
CREATE TABLE public.todo_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.todo_lists(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.team_members(id) ON DELETE SET NULL NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_collaborators table
CREATE TABLE public.task_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  role_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, team_member_id)
);

-- Create task_reminders table
CREATE TABLE public.task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before_due', 'on_due', 'overdue')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
CREATE POLICY "Admins can manage team members"
ON public.team_members FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team members can view all team members"
ON public.team_members FOR SELECT
USING (has_role(auth.uid(), 'team_member') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Team members can update own profile"
ON public.team_members FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for todo_lists
CREATE POLICY "Admins can manage all lists"
ON public.todo_lists FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team members can view lists they own or collaborate on"
ON public.todo_lists FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id = owner_id)
  OR EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.task_collaborators tc ON tc.task_id = t.id
    JOIN public.team_members tm ON tm.id = tc.team_member_id
    WHERE t.list_id = todo_lists.id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create lists"
ON public.todo_lists FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id = owner_id)
);

CREATE POLICY "Team members can update own lists"
ON public.todo_lists FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id = owner_id))
WITH CHECK (EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id = owner_id));

CREATE POLICY "Team members can delete own lists"
ON public.todo_lists FOR DELETE
USING (EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id = owner_id));

-- RLS Policies for tasks
CREATE POLICY "Admins can manage all tasks"
ON public.tasks FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team members can view tasks they created, are assigned to, or collaborate on"
ON public.tasks FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND (tm.id = created_by OR tm.id = assigned_to))
  OR EXISTS (
    SELECT 1 FROM public.task_collaborators tc
    JOIN public.team_members tm ON tm.id = tc.team_member_id
    WHERE tc.task_id = tasks.id AND tm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.todo_lists tl
    JOIN public.team_members tm ON tm.id = tl.owner_id
    WHERE tl.id = tasks.list_id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create tasks in their lists"
ON public.tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.todo_lists tl
    JOIN public.team_members tm ON tm.id = tl.owner_id
    WHERE tl.id = list_id AND tm.user_id = auth.uid()
  )
  AND EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id = created_by)
);

CREATE POLICY "Team members can update tasks they own or are assigned to"
ON public.tasks FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND (tm.id = created_by OR tm.id = assigned_to))
  OR EXISTS (
    SELECT 1 FROM public.todo_lists tl
    JOIN public.team_members tm ON tm.id = tl.owner_id
    WHERE tl.id = tasks.list_id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete tasks they created"
ON public.tasks FOR DELETE
USING (EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id = created_by));

-- RLS Policies for task_collaborators
CREATE POLICY "Admins can manage all collaborators"
ON public.task_collaborators FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team members can view collaborators on their tasks"
ON public.task_collaborators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.team_members tm ON tm.id = t.created_by
    WHERE t.id = task_id AND tm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.team_members tm WHERE tm.id = team_member_id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Task creators can manage collaborators"
ON public.task_collaborators FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.team_members tm ON tm.id = t.created_by
    WHERE t.id = task_id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Task creators can delete collaborators"
ON public.task_collaborators FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.team_members tm ON tm.id = t.created_by
    WHERE t.id = task_id AND tm.user_id = auth.uid()
  )
);

-- RLS Policies for task_reminders
CREATE POLICY "Admins can manage all reminders"
ON public.task_reminders FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team members can view reminders for their tasks"
ON public.task_reminders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.team_members tm ON tm.id = t.created_by OR tm.id = t.assigned_to
    WHERE t.id = task_id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can create reminders for their tasks"
ON public.task_reminders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.team_members tm ON tm.id = t.created_by
    WHERE t.id = task_id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can update reminders"
ON public.task_reminders FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_todo_lists_updated_at
BEFORE UPDATE ON public.todo_lists
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;