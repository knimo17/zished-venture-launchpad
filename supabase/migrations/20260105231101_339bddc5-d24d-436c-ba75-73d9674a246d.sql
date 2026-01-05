-- Allow team members with view_applications permission to view assessment-related tables

-- assessment_results
CREATE POLICY "Team members with permission can view assessment results"
ON public.assessment_results
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_applications'));

-- assessment_sessions
CREATE POLICY "Team members with permission can view assessment sessions"
ON public.assessment_sessions
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_applications'));

-- assessment_responses
CREATE POLICY "Team members with permission can view assessment responses"
ON public.assessment_responses
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_applications'));

-- ai_evaluation
CREATE POLICY "Team members with permission can view ai evaluations"
ON public.ai_evaluation
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_applications'));

-- ai_interview_questions
CREATE POLICY "Team members with permission can view ai interview questions"
ON public.ai_interview_questions
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_applications'));

-- ai_interview_responses
CREATE POLICY "Team members with permission can view ai interview responses"
ON public.ai_interview_responses
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_applications'));

-- ai_venture_analysis
CREATE POLICY "Team members with permission can view ai venture analysis"
ON public.ai_venture_analysis
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_applications'));

-- venture_matches
CREATE POLICY "Team members with permission can view venture matches"
ON public.venture_matches
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_applications'));

-- Allow team members with view_weekly_reports permission to view weekly report tables

-- weekly_reports
CREATE POLICY "Team members with permission can view weekly reports"
ON public.weekly_reports
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_weekly_reports'));

-- weekly_report_sessions
CREATE POLICY "Team members with permission can view weekly report sessions"
ON public.weekly_report_sessions
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_weekly_reports'));

-- weekly_report_activities
CREATE POLICY "Team members with permission can view weekly report activities"
ON public.weekly_report_activities
FOR SELECT
USING (public.has_team_permission(auth.uid(), 'view_weekly_reports'));