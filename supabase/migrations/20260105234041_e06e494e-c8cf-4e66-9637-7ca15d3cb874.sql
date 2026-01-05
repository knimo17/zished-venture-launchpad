-- Step 1: Rename todo_lists to goals and add new columns
ALTER TABLE public.todo_lists RENAME TO goals;

-- Add new columns to goals
ALTER TABLE public.goals 
ADD COLUMN target_date timestamp with time zone,
ADD COLUMN is_completed boolean NOT NULL DEFAULT false;

-- Step 2: Add new columns to tasks for ordering and dependencies
ALTER TABLE public.tasks 
ADD COLUMN order_index integer NOT NULL DEFAULT 0,
ADD COLUMN depends_on uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
ADD COLUMN is_required boolean NOT NULL DEFAULT true,
ADD COLUMN completion_criteria text;

-- Rename list_id to goal_id in tasks
ALTER TABLE public.tasks RENAME COLUMN list_id TO goal_id;

-- Step 3: Create goal_templates table
CREATE TABLE public.goal_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES public.team_members(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 4: Create task_templates table
CREATE TABLE public.task_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_template_id uuid NOT NULL REFERENCES public.goal_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  depends_on_order integer, -- references order_index of another task in same template
  is_required boolean NOT NULL DEFAULT true,
  completion_criteria text,
  default_priority text NOT NULL DEFAULT 'medium',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 5: Enable RLS on new tables
ALTER TABLE public.goal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS policies for goal_templates
CREATE POLICY "Admins can manage all goal templates"
ON public.goal_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view active templates"
ON public.goal_templates FOR SELECT
USING (is_active = true AND has_role(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Team members can create templates"
ON public.goal_templates FOR INSERT
WITH CHECK (has_role(auth.uid(), 'team_member'::app_role));

-- Step 7: RLS policies for task_templates
CREATE POLICY "Admins can manage all task templates"
ON public.task_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view task templates"
ON public.task_templates FOR SELECT
USING (has_role(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Team members can insert task templates"
ON public.task_templates FOR INSERT
WITH CHECK (has_role(auth.uid(), 'team_member'::app_role));

-- Step 8: Insert the RGD Business Registration template
INSERT INTO public.goal_templates (id, name, description, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Register a Business with RGD',
  'Complete process to register a new business with the Registrar General''s Department in Ghana',
  true
);

-- Step 9: Insert task templates for RGD registration
INSERT INTO public.task_templates (goal_template_id, title, description, order_index, depends_on_order, is_required, completion_criteria, default_priority) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Choose Business Name', 'Select 3-5 potential business names for registration', 1, NULL, true, 'List of 3-5 unique business names prepared', 'high'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Name Search at RGD', 'Submit name search application to verify availability', 2, 1, true, 'Name search completed and at least one name approved', 'high'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Prepare Incorporation Documents', 'Draft regulations/constitution and other required documents', 3, 2, true, 'All incorporation documents drafted and reviewed', 'high'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Complete Registration Forms', 'Fill out all RGD registration forms accurately', 4, 3, true, 'All forms completed with correct information', 'medium'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pay Registration Fees', 'Pay all required fees at RGD', 5, 4, true, 'Payment receipt obtained', 'medium'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Submit Documents to RGD', 'Submit complete application package to RGD office', 6, 5, true, 'Submission acknowledgment received', 'high'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Await Processing', 'Wait for RGD to process the application', 7, 6, true, 'Processing notification received', 'low'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Collect Certificate', 'Pick up business registration certificate from RGD', 8, 7, true, 'Certificate of Incorporation received', 'high'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Apply for TIN', 'Register for Tax Identification Number at GRA', 9, 8, false, 'TIN certificate obtained', 'medium'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Open Business Bank Account', 'Open a corporate bank account with registration documents', 10, 8, false, 'Business bank account opened and active', 'medium');

-- Step 10: Create function to calculate goal progress
CREATE OR REPLACE FUNCTION public.calculate_goal_progress(goal_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    CASE 
      WHEN COUNT(*) FILTER (WHERE is_required = true) = 0 THEN 100
      ELSE (COUNT(*) FILTER (WHERE status = 'completed' AND is_required = true) * 100 / 
            NULLIF(COUNT(*) FILTER (WHERE is_required = true), 0))::integer
    END,
    0
  )
  FROM public.tasks
  WHERE goal_id = goal_uuid;
$$;