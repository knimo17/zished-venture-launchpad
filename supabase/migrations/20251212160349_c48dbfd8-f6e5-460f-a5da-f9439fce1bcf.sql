
-- Create weekly report sessions table
CREATE TABLE public.weekly_report_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  operator_email TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly reports table
CREATE TABLE public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.weekly_report_sessions(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  operator_email TEXT NOT NULL,
  week_ending DATE NOT NULL,
  assigned_businesses UUID[] NOT NULL DEFAULT '{}',
  leadership_role TEXT NOT NULL,
  strategy_changed BOOLEAN NOT NULL DEFAULT false,
  strategy_change_details TEXT,
  problem_definition TEXT NOT NULL,
  problem_changed BOOLEAN NOT NULL DEFAULT false,
  problem_change_details TEXT,
  solution_description TEXT NOT NULL,
  personal_execution TEXT NOT NULL,
  approach_viability TEXT NOT NULL,
  no_action_reason TEXT,
  active_users TEXT,
  revenue_ghs NUMERIC,
  costs_ghs NUMERIC,
  leads_partnerships TEXT,
  qualitative_traction TEXT,
  used_ai_tools BOOLEAN NOT NULL DEFAULT false,
  ai_tools_details JSONB DEFAULT '[]'::jsonb,
  key_insight TEXT NOT NULL,
  challenges_risks TEXT NOT NULL,
  biggest_blocker TEXT NOT NULL,
  key_decisions TEXT NOT NULL,
  trade_offs_evaluated TEXT NOT NULL,
  decisions_owned_escalated TEXT NOT NULL,
  delayed_decisions TEXT,
  unconstrained_decision TEXT NOT NULL,
  talent_capability_gaps TEXT NOT NULL,
  capital_needed_ghs NUMERIC,
  capital_use TEXT,
  next_week_priorities TEXT NOT NULL,
  support_needed TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly report activities table
CREATE TABLE public.weekly_report_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  action_taken TEXT NOT NULL,
  outcome_insight TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'in_progress', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_report_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_report_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_report_sessions
CREATE POLICY "Public can read own session via token" ON public.weekly_report_sessions
FOR SELECT USING (true);

CREATE POLICY "Public can update own session" ON public.weekly_report_sessions
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Edge functions can insert sessions" ON public.weekly_report_sessions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage weekly report sessions" ON public.weekly_report_sessions
FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for weekly_reports
CREATE POLICY "Public can insert reports" ON public.weekly_reports
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view own reports" ON public.weekly_reports
FOR SELECT USING (true);

CREATE POLICY "Admins can manage weekly reports" ON public.weekly_reports
FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for weekly_report_activities
CREATE POLICY "Public can insert activities" ON public.weekly_report_activities
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view own activities" ON public.weekly_report_activities
FOR SELECT USING (true);

CREATE POLICY "Admins can manage activities" ON public.weekly_report_activities
FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_weekly_reports_updated_at
BEFORE UPDATE ON public.weekly_reports
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
