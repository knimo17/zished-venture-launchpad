-- Create ai_evaluation table for AI-generated assessment analysis
CREATE TABLE public.ai_evaluation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_result_id UUID NOT NULL REFERENCES public.assessment_results(id) ON DELETE CASCADE,
  personalized_summary TEXT NOT NULL,
  personalized_strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  personalized_growth_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  response_patterns JSONB NOT NULL DEFAULT '{}'::jsonb,
  red_flags TEXT[] NOT NULL DEFAULT '{}'::text[],
  overall_recommendation TEXT NOT NULL,
  recommendation_reasoning TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_venture_analysis table for venture-specific AI insights
CREATE TABLE public.ai_venture_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_result_id UUID NOT NULL REFERENCES public.assessment_results(id) ON DELETE CASCADE,
  venture_id UUID NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  fit_narrative TEXT NOT NULL,
  role_recommendation TEXT NOT NULL,
  onboarding_suggestions TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_interview_questions table for AI-generated follow-up questions
CREATE TABLE public.ai_interview_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_result_id UUID NOT NULL REFERENCES public.assessment_results(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_context TEXT NOT NULL,
  related_venture_id UUID REFERENCES public.ventures(id) ON DELETE SET NULL,
  probing_area TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_interview_responses table for candidate responses to AI questions
CREATE TABLE public.ai_interview_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.ai_interview_questions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add interview_status to assessment_sessions
ALTER TABLE public.assessment_sessions 
ADD COLUMN interview_status TEXT NOT NULL DEFAULT 'pending';

-- Enable RLS on new tables
ALTER TABLE public.ai_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_venture_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interview_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_evaluation
CREATE POLICY "Admins can view ai evaluations" ON public.ai_evaluation
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert ai evaluations" ON public.ai_evaluation
  FOR INSERT WITH CHECK (true);

-- RLS policies for ai_venture_analysis
CREATE POLICY "Admins can view ai venture analysis" ON public.ai_venture_analysis
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert ai venture analysis" ON public.ai_venture_analysis
  FOR INSERT WITH CHECK (true);

-- RLS policies for ai_interview_questions
CREATE POLICY "Admins can view ai interview questions" ON public.ai_interview_questions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view own interview questions" ON public.ai_interview_questions
  FOR SELECT USING (true);

CREATE POLICY "Public can insert ai interview questions" ON public.ai_interview_questions
  FOR INSERT WITH CHECK (true);

-- RLS policies for ai_interview_responses
CREATE POLICY "Admins can view ai interview responses" ON public.ai_interview_responses
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert ai interview responses" ON public.ai_interview_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view own interview responses" ON public.ai_interview_responses
  FOR SELECT USING (true);