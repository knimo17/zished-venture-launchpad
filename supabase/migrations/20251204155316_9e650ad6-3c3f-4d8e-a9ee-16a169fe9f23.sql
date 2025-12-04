-- Add new columns to assessment_questions for the enhanced structure
ALTER TABLE public.assessment_questions 
ADD COLUMN IF NOT EXISTS is_reverse boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_trap boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'likert',
ADD COLUMN IF NOT EXISTS options jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS option_mappings jsonb DEFAULT NULL;

-- Add constraint for question_type
ALTER TABLE public.assessment_questions 
ADD CONSTRAINT valid_question_type CHECK (question_type IN ('likert', 'forced_choice', 'scenario'));

-- Clear existing questions to replace with new structure
DELETE FROM public.assessment_questions;

-- Insert all 70 questions with proper metadata

-- A. CORE TRAITS (Q1-36) - 18 forward, 18 reverse

-- OWNERSHIP (Q1-8: 4 forward, 4 reverse)
INSERT INTO public.assessment_questions (question_number, dimension, sub_dimension, question_text, is_reverse, is_trap, question_type) VALUES
(1, 'ownership', NULL, 'I take responsibility for outcomes even when circumstances are difficult.', false, false, 'likert'),
(2, 'ownership', NULL, 'When projects become chaotic, I sometimes step back and wait for direction.', true, false, 'likert'),
(3, 'ownership', NULL, 'I follow up on tasks even when no one checks on me.', false, false, 'likert'),
(4, 'ownership', NULL, 'I often rely on others to make final decisions so I don''t make mistakes.', true, false, 'likert'),
(5, 'ownership', NULL, 'I feel accountable for the success or failure of projects I touch.', false, false, 'likert'),
(6, 'ownership', NULL, 'When something goes wrong, I tend to blame external factors first.', true, false, 'likert'),
(7, 'ownership', NULL, 'I take initiative even when a task falls outside my formal responsibilities.', false, false, 'likert'),
(8, 'ownership', NULL, 'I sometimes avoid taking ownership when an outcome feels uncertain.', true, false, 'likert'),

-- EXECUTION (Q9-16: 4 forward, 4 reverse)
(9, 'execution', NULL, 'I make decisions even when all information isn''t available.', false, false, 'likert'),
(10, 'execution', NULL, 'I often postpone starting tasks until I feel completely ready.', true, false, 'likert'),
(11, 'execution', NULL, 'I break big goals into action steps quickly.', false, false, 'likert'),
(12, 'execution', NULL, 'I struggle to take action when instructions are unclear.', true, false, 'likert'),
(13, 'execution', NULL, 'I can make meaningful progress even without full clarity.', false, false, 'likert'),
(14, 'execution', NULL, 'I often postpone important tasks because I''m unsure how to begin.', true, false, 'likert'),
(15, 'execution', NULL, 'I work efficiently under tight deadlines.', false, false, 'likert'),
(16, 'execution', NULL, 'I tend to overthink decisions to avoid making the wrong one.', true, false, 'likert'),

-- HUSTLE & INITIATIVE (Q17-24: 4 forward, 4 reverse)
(17, 'hustle', NULL, 'I actively look for solutions even when resources are limited.', false, false, 'likert'),
(18, 'hustle', NULL, 'I sometimes avoid tasks that require significant effort or discomfort.', true, false, 'likert'),
(19, 'hustle', NULL, 'I actively seek out ways to add value, even when not asked.', false, false, 'likert'),
(20, 'hustle', NULL, 'I slow down when tasks become repetitive or tiring.', true, false, 'likert'),
(21, 'hustle', NULL, 'If I don''t know something, I try to learn it immediately.', false, false, 'likert'),
(22, 'hustle', NULL, 'I slow down significantly after facing rejection or setbacks.', true, false, 'likert'),
(23, 'hustle', NULL, 'I usually push beyond minimum expectations.', false, false, 'likert'),
(24, 'hustle', NULL, 'I sometimes wait for better conditions before taking action.', true, false, 'likert'),

-- PROBLEM-SOLVING & ADAPTABILITY (Q25-30: 3 forward, 3 reverse)
(25, 'problem_solving', NULL, 'I adjust my plans quickly when new information appears.', false, false, 'likert'),
(26, 'problem_solving', NULL, 'Unexpected obstacles tend to overwhelm me.', true, false, 'likert'),
(27, 'problem_solving', NULL, 'I enjoy solving problems without clear instructions.', false, false, 'likert'),
(28, 'problem_solving', NULL, 'I stick to my original strategy even when it''s clearly not working.', true, false, 'likert'),
(29, 'problem_solving', NULL, 'I think creatively even under pressure.', false, false, 'likert'),
(30, 'problem_solving', NULL, 'I find it difficult to pivot when a plan fails.', true, false, 'likert'),

-- LEADERSHIP (Q31-36: 3 forward, 3 reverse)
(31, 'leadership', NULL, 'People often look to me for direction even when I''m not in charge.', false, false, 'likert'),
(32, 'leadership', NULL, 'I avoid giving constructive feedback because it can cause tension.', true, false, 'likert'),
(33, 'leadership', NULL, 'I can motivate people when morale is low.', false, false, 'likert'),
(34, 'leadership', NULL, 'I hesitate to delegate because I''m unsure others will perform well.', true, false, 'likert'),
(35, 'leadership', NULL, 'I communicate clearly and persuasively.', false, false, 'likert'),
(36, 'leadership', NULL, 'I tend to wait for someone else to step up before I lead.', true, false, 'likert'),

-- B. SOCIAL DESIRABILITY & HONESTY INDEX (Q37-40) - All traps
(37, 'trap', NULL, 'I perform well under pressure in every situation.', false, true, 'likert'),
(38, 'trap', NULL, 'I rarely make mistakes at work.', false, true, 'likert'),
(39, 'trap', NULL, 'I am always motivated and never procrastinate.', false, true, 'likert'),
(40, 'trap', NULL, 'People often say I have no weaknesses.', false, true, 'likert'),

-- C. MIXED CONSTRUCT (Q41-50: 5 forward, 5 reverse)
(41, 'mixed', NULL, 'I sometimes lose focus when tasks become repetitive.', true, false, 'likert'),
(42, 'mixed', NULL, 'I enjoy creating new processes that make work easier.', false, false, 'likert'),
(43, 'mixed', NULL, 'I stay calm when others are panicking.', false, false, 'likert'),
(44, 'mixed', NULL, 'I avoid stepping into leadership roles unless someone asks me to.', true, false, 'likert'),
(45, 'mixed', NULL, 'I naturally take initiative when something needs to be done.', false, false, 'likert'),
(46, 'mixed', NULL, 'I prefer complete clarity before acting, even if that delays progress.', true, false, 'likert'),
(47, 'mixed', NULL, 'I can manage multiple demands without reducing quality.', false, false, 'likert'),
(48, 'mixed', NULL, 'I sometimes prioritize comfort over resolving issues quickly.', true, false, 'likert'),
(49, 'mixed', NULL, 'I am comfortable making fast decisions with imperfect information.', false, false, 'likert'),
(50, 'mixed', NULL, 'I struggle to stay consistent on long-term tasks.', true, false, 'likert'),

-- D. VENTURE FIT (Q51-60)
(51, 'venture_fit', 'operator', 'I enjoy building operational systems and workflows.', false, false, 'likert'),
(52, 'venture_fit', 'operator', 'I get satisfaction from making processes more reliable.', false, false, 'likert'),
(53, 'venture_fit', 'operator', 'I notice small details others often miss.', false, false, 'likert'),
(54, 'venture_fit', 'product', 'I frequently imagine better product designs or improvements.', false, false, 'likert'),
(55, 'venture_fit', 'product', 'I naturally think from a user or customer''s perspective.', false, false, 'likert'),
(56, 'venture_fit', 'product', 'I like turning abstract ideas into prototypes or drafts.', false, false, 'likert'),
(57, 'venture_fit', 'growth', 'I feel energized by pitching, selling, or promoting ideas.', false, false, 'likert'),
(58, 'venture_fit', 'growth', 'Building partnerships and networking comes naturally to me.', false, false, 'likert'),
(59, 'venture_fit', 'growth', 'I can craft compelling narratives around ideas or products.', false, false, 'likert'),
(60, 'venture_fit', 'vision', 'I often think several years ahead when planning or ideating.', false, false, 'likert');

-- E. FORCED-CHOICE PAIRS (Q61-65)
INSERT INTO public.assessment_questions (question_number, dimension, sub_dimension, question_text, is_reverse, is_trap, question_type, options, option_mappings) VALUES
(61, 'forced_choice', 'decision_style', 'Which describes you more?', false, false, 'forced_choice', 
  '["I make decisions quickly.", "I make decisions carefully."]'::jsonb,
  '{"A": {"action_bias": 1}, "B": {"deliberation_bias": 1}}'::jsonb),
(62, 'forced_choice', 'work_style', 'Which describes you more?', false, false, 'forced_choice',
  '["I prefer autonomy with minimal oversight.", "I prefer collaboration with regular check-ins."]'::jsonb,
  '{"A": {"autonomy": 1}, "B": {"collaboration": 1}}'::jsonb),
(63, 'forced_choice', 'conflict_style', 'Which describes you more?', false, false, 'forced_choice',
  '["I directly confront issues early.", "I use a diplomatic, gradual approach."]'::jsonb,
  '{"A": {"direct": 1}, "B": {"diplomatic": 1}}'::jsonb),
(64, 'forced_choice', 'action_style', 'Which describes you more?', false, false, 'forced_choice',
  '["I start tasks immediately, even if unclear.", "I gather more information before starting."]'::jsonb,
  '{"A": {"action_bias": 1}, "B": {"deliberation_bias": 1}}'::jsonb),
(65, 'forced_choice', 'focus_style', 'Which describes you more?', false, false, 'forced_choice',
  '["I focus on long-term vision and direction.", "I focus on immediate execution and results."]'::jsonb,
  '{"A": {"vision_focus": 1}, "B": {"execution_focus": 1}}'::jsonb);

-- F. SCENARIO-BASED (Q66-70)
INSERT INTO public.assessment_questions (question_number, dimension, sub_dimension, question_text, is_reverse, is_trap, question_type, options, option_mappings) VALUES
(66, 'scenario', 'team_management', 'Your teammate has missed two deadlines. What do you do?', false, false, 'scenario',
  '["Step in and help", "Have a direct conversation", "Reassign tasks", "Wait to see if they improve", "Escalate"]'::jsonb,
  '{"0": {"ownership": 1, "hustle": 1}, "1": {"leadership": 1, "communication": 1}, "2": {"leadership": 1}, "3": {}, "4": {"structure": 1}}'::jsonb),
(67, 'scenario', 'crisis_response', 'You spot a major mistake before launch. What do you do first?', false, false, 'scenario',
  '["Fix it yourself", "Notify the team and propose a fix", "Delay launch", "Find a quick workaround", "Escalate to leadership"]'::jsonb,
  '{"0": {"ownership": 1, "execution": 1}, "1": {"leadership": 1, "communication": 1}, "2": {"deliberation": 1}, "3": {"problem_solving": 1, "hustle": 1}, "4": {"structure": 1}}'::jsonb),
(68, 'scenario', 'ambiguity_handling', 'You receive unclear instructions for an urgent task. You:', false, false, 'scenario',
  '["Start immediately and figure it out", "Ask for clarity", "Delegate parts", "Wait until clear", "Create your own plan"]'::jsonb,
  '{"0": {"action_bias": 1, "hustle": 1}, "1": {"communication": 1}, "2": {"leadership": 1}, "3": {}, "4": {"ownership": 1, "problem_solving": 1}}'::jsonb),
(69, 'scenario', 'customer_handling', 'A customer complains angrily. You:', false, false, 'scenario',
  '["Stay calm and gather facts", "Try to fix it immediately", "Escalate", "Follow standard protocol", "Offer compensation"]'::jsonb,
  '{"0": {"problem_solving": 1, "composure": 1}, "1": {"ownership": 1, "action_bias": 1}, "2": {"structure": 1}, "3": {"structure": 1}, "4": {"customer_focus": 1}}'::jsonb),
(70, 'scenario', 'failure_response', 'A strategy you created fails. You:', false, false, 'scenario',
  '["Revise the strategy", "Seek feedback", "Try again with adjustments", "Move to another idea", "Wait for direction"]'::jsonb,
  '{"0": {"problem_solving": 1, "ownership": 1}, "1": {"communication": 1, "collaboration": 1}, "2": {"hustle": 1, "adaptability": 1}, "3": {"adaptability": 1}, "4": {}}'::jsonb);