-- Fix RLS Security Vulnerabilities
-- This migration addresses critical security issues where USING (true) policies
-- allowed anyone to access all records in sensitive tables.

-- ============================================================================
-- PART 1: Fix assessment_sessions RLS
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can read own session via token" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Public can update own session via token" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Edge functions can insert sessions" ON public.assessment_sessions;

-- Create secure function for token-based session access
CREATE OR REPLACE FUNCTION public.get_assessment_session_by_token(session_token TEXT)
RETURNS TABLE (
  id UUID,
  application_id UUID,
  token TEXT,
  status TEXT,
  sent_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  current_question INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.application_id,
    s.token,
    s.status,
    s.sent_at,
    s.started_at,
    s.completed_at,
    s.current_question,
    s.created_at,
    s.updated_at
  FROM public.assessment_sessions s
  WHERE s.token = session_token;
END;
$$;

-- Create secure function to update session (validates token)
CREATE OR REPLACE FUNCTION public.update_assessment_session(
  session_token TEXT,
  new_status TEXT DEFAULT NULL,
  new_started_at TIMESTAMPTZ DEFAULT NULL,
  new_completed_at TIMESTAMPTZ DEFAULT NULL,
  new_current_question INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  current_question INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- Find session by token
  SELECT * INTO session_record
  FROM public.assessment_sessions s
  WHERE s.token = session_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  -- Update only provided fields
  UPDATE public.assessment_sessions s
  SET
    status = COALESCE(new_status, s.status),
    started_at = COALESCE(new_started_at, s.started_at),
    completed_at = COALESCE(new_completed_at, s.completed_at),
    current_question = COALESCE(new_current_question, s.current_question),
    updated_at = now()
  WHERE s.token = session_token
  RETURNING s.id, s.status, s.current_question INTO id, status, current_question;

  RETURN NEXT;
END;
$$;

-- ============================================================================
-- PART 2: Fix assessment_responses RLS
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can insert responses" ON public.assessment_responses;
DROP POLICY IF EXISTS "Public can update own responses" ON public.assessment_responses;
DROP POLICY IF EXISTS "Public can read own responses" ON public.assessment_responses;

-- Create secure function to save response (validates token)
CREATE OR REPLACE FUNCTION public.save_assessment_response(
  session_token TEXT,
  p_question_id UUID,
  p_response INTEGER
)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  question_id UUID,
  response INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Validate token and get session_id
  SELECT s.id INTO v_session_id
  FROM public.assessment_sessions s
  WHERE s.token = session_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  -- Upsert response
  INSERT INTO public.assessment_responses (session_id, question_id, response)
  VALUES (v_session_id, p_question_id, p_response)
  ON CONFLICT (session_id, question_id)
  DO UPDATE SET response = EXCLUDED.response, updated_at = now()
  RETURNING
    assessment_responses.id,
    assessment_responses.session_id,
    assessment_responses.question_id,
    assessment_responses.response
  INTO id, session_id, question_id, response;

  RETURN NEXT;
END;
$$;

-- Create secure function to get responses for a session (validates token)
CREATE OR REPLACE FUNCTION public.get_assessment_responses_by_token(session_token TEXT)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  question_id UUID,
  response INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Validate token and get session_id
  SELECT s.id INTO v_session_id
  FROM public.assessment_sessions s
  WHERE s.token = session_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.session_id,
    r.question_id,
    r.response,
    r.created_at,
    r.updated_at
  FROM public.assessment_responses r
  WHERE r.session_id = v_session_id;
END;
$$;

-- ============================================================================
-- PART 3: Fix weekly_report_sessions RLS
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can read own session via token" ON public.weekly_report_sessions;
DROP POLICY IF EXISTS "Public can update own session" ON public.weekly_report_sessions;
DROP POLICY IF EXISTS "Edge functions can insert sessions" ON public.weekly_report_sessions;

-- Create secure function for token-based session access
CREATE OR REPLACE FUNCTION public.get_weekly_report_session_by_token(session_token TEXT)
RETURNS TABLE (
  id UUID,
  token TEXT,
  operator_email TEXT,
  operator_name TEXT,
  status TEXT,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.token,
    s.operator_email,
    s.operator_name,
    s.status,
    s.sent_at,
    s.completed_at,
    s.created_at
  FROM public.weekly_report_sessions s
  WHERE s.token = session_token;
END;
$$;

-- Create secure function to update session (validates token)
CREATE OR REPLACE FUNCTION public.update_weekly_report_session(
  session_token TEXT,
  new_status TEXT DEFAULT NULL,
  new_completed_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- Find session by token
  SELECT * INTO session_record
  FROM public.weekly_report_sessions s
  WHERE s.token = session_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  -- Update only provided fields
  UPDATE public.weekly_report_sessions s
  SET
    status = COALESCE(new_status, s.status),
    completed_at = COALESCE(new_completed_at, s.completed_at)
  WHERE s.token = session_token
  RETURNING s.id, s.status INTO id, status;

  RETURN NEXT;
END;
$$;

-- ============================================================================
-- PART 4: Fix weekly_reports RLS
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can insert reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Public can view own reports" ON public.weekly_reports;

-- Create secure function to save weekly report (validates token)
CREATE OR REPLACE FUNCTION public.save_weekly_report(
  session_token TEXT,
  p_week_ending DATE,
  p_assigned_businesses UUID[],
  p_leadership_role TEXT,
  p_strategy_changed BOOLEAN,
  p_strategy_change_details TEXT,
  p_problem_definition TEXT,
  p_problem_changed BOOLEAN,
  p_problem_change_details TEXT,
  p_solution_description TEXT,
  p_personal_execution TEXT,
  p_approach_viability TEXT,
  p_no_action_reason TEXT,
  p_active_users TEXT,
  p_revenue_ghs NUMERIC,
  p_costs_ghs NUMERIC,
  p_leads_partnerships TEXT,
  p_qualitative_traction TEXT,
  p_used_ai_tools BOOLEAN,
  p_ai_tools_details JSONB,
  p_key_insight TEXT,
  p_challenges_risks TEXT,
  p_biggest_blocker TEXT,
  p_key_decisions TEXT,
  p_trade_offs_evaluated TEXT,
  p_decisions_owned_escalated TEXT,
  p_delayed_decisions TEXT,
  p_unconstrained_decision TEXT,
  p_talent_capability_gaps TEXT,
  p_capital_needed_ghs NUMERIC,
  p_capital_use TEXT,
  p_next_week_priorities TEXT,
  p_support_needed TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_report_id UUID;
BEGIN
  -- Validate token and get session
  SELECT * INTO v_session
  FROM public.weekly_report_sessions s
  WHERE s.token = session_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  -- Insert report
  INSERT INTO public.weekly_reports (
    session_id,
    operator_name,
    operator_email,
    week_ending,
    assigned_businesses,
    leadership_role,
    strategy_changed,
    strategy_change_details,
    problem_definition,
    problem_changed,
    problem_change_details,
    solution_description,
    personal_execution,
    approach_viability,
    no_action_reason,
    active_users,
    revenue_ghs,
    costs_ghs,
    leads_partnerships,
    qualitative_traction,
    used_ai_tools,
    ai_tools_details,
    key_insight,
    challenges_risks,
    biggest_blocker,
    key_decisions,
    trade_offs_evaluated,
    decisions_owned_escalated,
    delayed_decisions,
    unconstrained_decision,
    talent_capability_gaps,
    capital_needed_ghs,
    capital_use,
    next_week_priorities,
    support_needed
  ) VALUES (
    v_session.id,
    v_session.operator_name,
    v_session.operator_email,
    p_week_ending,
    p_assigned_businesses,
    p_leadership_role,
    p_strategy_changed,
    p_strategy_change_details,
    p_problem_definition,
    p_problem_changed,
    p_problem_change_details,
    p_solution_description,
    p_personal_execution,
    p_approach_viability,
    p_no_action_reason,
    p_active_users,
    p_revenue_ghs,
    p_costs_ghs,
    p_leads_partnerships,
    p_qualitative_traction,
    p_used_ai_tools,
    p_ai_tools_details,
    p_key_insight,
    p_challenges_risks,
    p_biggest_blocker,
    p_key_decisions,
    p_trade_offs_evaluated,
    p_decisions_owned_escalated,
    p_delayed_decisions,
    p_unconstrained_decision,
    p_talent_capability_gaps,
    p_capital_needed_ghs,
    p_capital_use,
    p_next_week_priorities,
    p_support_needed
  )
  RETURNING id INTO v_report_id;

  -- Update session status
  UPDATE public.weekly_report_sessions
  SET status = 'completed', completed_at = now()
  WHERE token = session_token;

  RETURN v_report_id;
END;
$$;

-- ============================================================================
-- PART 5: Fix weekly_report_activities RLS
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can insert activities" ON public.weekly_report_activities;
DROP POLICY IF EXISTS "Public can view own activities" ON public.weekly_report_activities;

-- Create secure function to save activities (validates via report -> session -> token)
CREATE OR REPLACE FUNCTION public.save_weekly_report_activities(
  session_token TEXT,
  p_report_id UUID,
  p_activities JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_report_session_id UUID;
  activity JSONB;
BEGIN
  -- Validate token and get session_id
  SELECT id INTO v_session_id
  FROM public.weekly_report_sessions
  WHERE token = session_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  -- Verify report belongs to this session
  SELECT session_id INTO v_report_session_id
  FROM public.weekly_reports
  WHERE id = p_report_id;

  IF v_report_session_id IS NULL OR v_report_session_id != v_session_id THEN
    RAISE EXCEPTION 'Report does not belong to this session';
  END IF;

  -- Insert activities
  FOR activity IN SELECT * FROM jsonb_array_elements(p_activities)
  LOOP
    INSERT INTO public.weekly_report_activities (
      report_id,
      action_taken,
      outcome_insight,
      status
    ) VALUES (
      p_report_id,
      activity->>'action_taken',
      activity->>'outcome_insight',
      activity->>'status'
    );
  END LOOP;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- PART 6: Create function to save assessment results (validates token)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.save_assessment_results(
  session_token TEXT,
  p_dimension_scores JSONB,
  p_venture_fit_scores JSONB,
  p_team_compatibility_scores JSONB,
  p_primary_founder_type TEXT,
  p_secondary_founder_type TEXT,
  p_confidence_level TEXT,
  p_summary TEXT,
  p_strengths TEXT[],
  p_weaknesses TEXT[],
  p_weakness_summary TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_result_id UUID;
BEGIN
  -- Validate token and get session_id
  SELECT id INTO v_session_id
  FROM public.assessment_sessions
  WHERE token = session_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid session token';
  END IF;

  -- Insert results
  INSERT INTO public.assessment_results (
    session_id,
    dimension_scores,
    venture_fit_scores,
    team_compatibility_scores,
    primary_founder_type,
    secondary_founder_type,
    confidence_level,
    summary,
    strengths,
    weaknesses,
    weakness_summary
  ) VALUES (
    v_session_id,
    p_dimension_scores,
    p_venture_fit_scores,
    p_team_compatibility_scores,
    p_primary_founder_type,
    p_secondary_founder_type,
    p_confidence_level,
    p_summary,
    p_strengths,
    p_weaknesses,
    p_weakness_summary
  )
  RETURNING id INTO v_result_id;

  RETURN v_result_id;
END;
$$;

-- ============================================================================
-- PART 7: Grant execute permissions on functions to anon role
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_assessment_session_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_assessment_session(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.save_assessment_response(TEXT, UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_assessment_responses_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_report_session_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_weekly_report_session(TEXT, TEXT, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.save_weekly_report(TEXT, DATE, UUID[], TEXT, BOOLEAN, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, BOOLEAN, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.save_weekly_report_activities(TEXT, UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.save_assessment_results(TEXT, JSONB, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT) TO anon;

-- Also grant to authenticated users
GRANT EXECUTE ON FUNCTION public.get_assessment_session_by_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_assessment_session(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_assessment_response(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_assessment_responses_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_report_session_by_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_weekly_report_session(TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_weekly_report(TEXT, DATE, UUID[], TEXT, BOOLEAN, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, BOOLEAN, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_weekly_report_activities(TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_assessment_results(TEXT, JSONB, JSONB, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT) TO authenticated;

-- ============================================================================
-- SUMMARY OF CHANGES:
-- ============================================================================
-- 1. Removed all "USING (true)" policies that allowed unrestricted access
-- 2. Created SECURITY DEFINER functions that validate tokens before allowing access
-- 3. Direct table access is now restricted to admins only (existing admin policies remain)
-- 4. Anonymous users must use the RPC functions which validate tokens
-- 5. This ensures:
--    - Job applicant data can only be accessed with valid assessment token
--    - Business operator data can only be accessed with valid weekly report token
--    - Session tokens cannot be enumerated or hijacked
