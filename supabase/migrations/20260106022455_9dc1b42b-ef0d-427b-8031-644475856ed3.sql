-- Create goal_comments table
CREATE TABLE public.goal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on goal_comments
ALTER TABLE public.goal_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for goal_comments
CREATE POLICY "Users can view comments on visible goals"
ON public.goal_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.goals g
    WHERE g.id = goal_comments.goal_id
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR g.owner_id = get_current_team_member_id()
      OR team_member_has_permission(auth.uid(), 'view_all_goals')
    )
  )
);

CREATE POLICY "Users can add comments to visible goals"
ON public.goal_comments
FOR INSERT
WITH CHECK (
  author_id = get_current_team_member_id()
  AND EXISTS (
    SELECT 1 FROM public.goals g
    WHERE g.id = goal_comments.goal_id
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR g.owner_id = get_current_team_member_id()
      OR team_member_has_permission(auth.uid(), 'view_all_goals')
    )
  )
);

CREATE POLICY "Users can update own comments"
ON public.goal_comments
FOR UPDATE
USING (author_id = get_current_team_member_id())
WITH CHECK (author_id = get_current_team_member_id());

CREATE POLICY "Users can delete own comments or admins"
ON public.goal_comments
FOR DELETE
USING (
  author_id = get_current_team_member_id()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_goal_comments_updated_at
BEFORE UPDATE ON public.goal_comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Update goals RLS: Drop old policy and create new one for visibility control
DROP POLICY IF EXISTS "Team members can view all lists" ON public.goals;

CREATE POLICY "Team members can view own goals or all if permitted"
ON public.goals
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR owner_id = get_current_team_member_id()
  OR team_member_has_permission(auth.uid(), 'view_all_goals')
);