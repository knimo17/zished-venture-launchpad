-- Create assessment_questions table
CREATE TABLE public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL UNIQUE,
  question_text TEXT NOT NULL,
  dimension TEXT NOT NULL,
  sub_dimension TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessment_sessions table
CREATE TABLE public.assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  current_question INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessment_responses table
CREATE TABLE public.assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  response INTEGER NOT NULL CHECK (response >= 1 AND response <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, question_id)
);

-- Create assessment_results table
CREATE TABLE public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  dimension_scores JSONB NOT NULL,
  venture_fit_scores JSONB NOT NULL,
  team_compatibility_scores JSONB NOT NULL,
  primary_founder_type TEXT NOT NULL,
  secondary_founder_type TEXT,
  confidence_level TEXT NOT NULL,
  summary TEXT NOT NULL,
  strengths TEXT[] NOT NULL,
  weaknesses TEXT[] NOT NULL,
  weakness_summary TEXT NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessment_questions (public read)
CREATE POLICY "Anyone can view assessment questions"
ON public.assessment_questions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage assessment questions"
ON public.assessment_questions FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assessment_sessions
CREATE POLICY "Public can read own session via token"
ON public.assessment_sessions FOR SELECT
USING (true);

CREATE POLICY "Public can update own session via token"
ON public.assessment_sessions FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can manage assessment sessions"
ON public.assessment_sessions FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Edge functions can insert sessions"
ON public.assessment_sessions FOR INSERT
WITH CHECK (true);

-- RLS Policies for assessment_responses
CREATE POLICY "Public can insert responses"
ON public.assessment_responses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update own responses"
ON public.assessment_responses FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can read own responses"
ON public.assessment_responses FOR SELECT
USING (true);

CREATE POLICY "Admins can view all responses"
ON public.assessment_responses FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assessment_results (admin only read, public insert for calculation)
CREATE POLICY "Admins can view assessment results"
ON public.assessment_results FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can insert results on completion"
ON public.assessment_results FOR INSERT
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_assessment_sessions_updated_at
BEFORE UPDATE ON public.assessment_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_assessment_responses_updated_at
BEFORE UPDATE ON public.assessment_responses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed the 70 questions
INSERT INTO public.assessment_questions (question_number, question_text, dimension, sub_dimension) VALUES
-- Dimension 1: Ownership & Responsibility (Q1-10)
(1, 'I take responsibility for outcomes even when they''re difficult.', 'Ownership', NULL),
(2, 'When things go wrong, I focus on fixing instead of blaming.', 'Ownership', NULL),
(3, 'I naturally take charge without waiting for permission.', 'Ownership', NULL),
(4, 'I feel uncomfortable when I''m not fully responsible for a task.', 'Ownership', NULL),
(5, 'I proactively look for ways to improve processes.', 'Ownership', NULL),
(6, 'I follow through even when motivation dips.', 'Ownership', NULL),
(7, 'I prefer to be judged on results.', 'Ownership', NULL),
(8, 'I take on extra tasks to move projects forward.', 'Ownership', NULL),
(9, 'I feel strong ownership over anything I work on.', 'Ownership', NULL),
(10, 'I rarely need reminders to complete tasks I''ve committed to.', 'Ownership', NULL),

-- Dimension 2: Execution & Action Bias (Q11-20)
(11, 'I make decisions quickly, even without all the information.', 'Execution', NULL),
(12, 'I prefer starting fast over perfect planning.', 'Execution', NULL),
(13, 'I enjoy building MVPs or first versions to test ideas.', 'Execution', NULL),
(14, 'I''m comfortable acting without full clarity.', 'Execution', NULL),
(15, 'I value speed and iteration over getting it right the first time.', 'Execution', NULL),
(16, 'I act on promising ideas within 24–48 hours.', 'Execution', NULL),
(17, 'I work well under tight deadlines.', 'Execution', NULL),
(18, 'I break big goals into smaller tasks and start immediately.', 'Execution', NULL),
(19, 'I stay calm and focused when executing under pressure.', 'Execution', NULL),
(20, 'I often push myself to finish tasks earlier than required.', 'Execution', NULL),

-- Dimension 3: Hustle & Initiative (Q21-30)
(21, 'I believe there''s always a way to make progress.', 'Hustle', NULL),
(22, 'I''m resourceful when I have limited tools or support.', 'Hustle', NULL),
(23, 'I''m comfortable reaching out cold to people who can help.', 'Hustle', NULL),
(24, 'I usually search for answers myself before asking for help.', 'Hustle', NULL),
(25, 'I can motivate myself without external pressure.', 'Hustle', NULL),
(26, 'I often deliver more than what was asked of me.', 'Hustle', NULL),
(27, 'I enjoy solving problems that others avoid.', 'Hustle', NULL),
(28, 'I still make progress even when conditions are not ideal.', 'Hustle', NULL),
(29, 'I learn new skills quickly when the situation demands it.', 'Hustle', NULL),
(30, 'I rarely give up on a challenge once I''ve committed.', 'Hustle', NULL),

-- Dimension 4: Problem-Solving & Adaptability (Q31-40)
(31, 'I enjoy working on open-ended problems with no clear instructions.', 'Problem-Solving', NULL),
(32, 'I stay calm when things don''t go as planned.', 'Problem-Solving', NULL),
(33, 'I can pivot quickly when new information appears.', 'Problem-Solving', NULL),
(34, 'I come up with creative solutions under pressure.', 'Problem-Solving', NULL),
(35, 'I prefer dynamic, changing environments over routine.', 'Problem-Solving', NULL),
(36, 'I treat failures as data and adjust my approach.', 'Problem-Solving', NULL),
(37, 'I often anticipate problems before they happen.', 'Problem-Solving', NULL),
(38, 'I adjust my strategy when something isn''t working.', 'Problem-Solving', NULL),
(39, 'I''m comfortable taking calculated risks.', 'Problem-Solving', NULL),
(40, 'I enjoy figuring things out on my own.', 'Problem-Solving', NULL),

-- Dimension 5: Leadership & Influence (Q41-50)
(41, 'I naturally influence people to move toward a goal.', 'Leadership', NULL),
(42, 'People often come to me for direction or advice.', 'Leadership', NULL),
(43, 'I communicate my ideas clearly and persuasively.', 'Leadership', NULL),
(44, 'I stay composed and solution-oriented in tough situations.', 'Leadership', NULL),
(45, 'I give constructive feedback even when it''s uncomfortable.', 'Leadership', NULL),
(46, 'I feel comfortable delegating important tasks to others.', 'Leadership', NULL),
(47, 'I can motivate people even when morale is low.', 'Leadership', NULL),
(48, 'I prefer leading a team over working only as an individual contributor.', 'Leadership', NULL),
(49, 'I help bring structure and order to chaotic situations.', 'Leadership', NULL),
(50, 'I hold both myself and others to high standards.', 'Leadership', NULL),

-- Dimension 6: Venture Fit (Q51-60)
(51, 'I enjoy creating structure, processes, and repeatable systems.', 'Venture Fit', 'Operator'),
(52, 'I feel satisfied when I streamline or optimize a workflow.', 'Venture Fit', 'Operator'),
(53, 'I naturally track details, timelines, and follow-ups.', 'Venture Fit', 'Operator'),
(54, 'I often think about how everyday problems could be solved with better products.', 'Venture Fit', 'Product'),
(55, 'I can clearly visualize user journeys and pain points.', 'Venture Fit', 'Product'),
(56, 'I enjoy building prototypes or mockups, even if they''re rough.', 'Venture Fit', 'Product'),
(57, 'I''m comfortable promoting a product or idea to strangers.', 'Venture Fit', 'Growth'),
(58, 'I get energy from pitching, networking, and connecting with people.', 'Venture Fit', 'Growth'),
(59, 'I naturally look for ways to tell compelling stories about ideas.', 'Venture Fit', 'Growth'),
(60, 'I often imagine where a company could be 3–5 years from now and plan backwards from that vision.', 'Venture Fit', 'Vision'),

-- Dimension 7: Team Compatibility (Q61-70)
(61, 'I prefer working with high autonomy rather than tight supervision.', 'Team Compatibility', 'Working Style'),
(62, 'I feel comfortable giving direct, honest feedback.', 'Team Compatibility', 'Working Style'),
(63, 'I adapt quickly when plans or priorities change.', 'Team Compatibility', 'Working Style'),
(64, 'I speak up in group discussions, even if others disagree.', 'Team Compatibility', 'Communication'),
(65, 'I usually communicate in concise, bullet-point style rather than long explanations.', 'Team Compatibility', 'Communication'),
(66, 'In conflict situations, I focus more on solving the issue than preserving comfort.', 'Team Compatibility', 'Conflict Response'),
(67, 'I remain calm and solution-focused when others are stressed or emotional.', 'Team Compatibility', 'Conflict Response'),
(68, 'I prefer to make decisions quickly rather than wait for full consensus.', 'Team Compatibility', 'Decision-Making'),
(69, 'When time is short, I''m comfortable relying on instinct more than complete data.', 'Team Compatibility', 'Decision-Making'),
(70, 'I work best with teammates who take initiative and don''t need step-by-step instructions.', 'Team Compatibility', 'Collaboration');