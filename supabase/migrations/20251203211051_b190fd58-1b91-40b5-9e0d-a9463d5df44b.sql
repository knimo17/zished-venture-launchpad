-- Create ventures table
CREATE TABLE public.ventures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT NOT NULL,
  ideal_founder_type TEXT NOT NULL,
  secondary_founder_type TEXT,
  dimension_weights JSONB NOT NULL DEFAULT '{}',
  team_profile JSONB NOT NULL DEFAULT '{}',
  suggested_roles TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create venture_matches table
CREATE TABLE public.venture_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_result_id UUID NOT NULL REFERENCES public.assessment_results(id) ON DELETE CASCADE,
  venture_id UUID NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  overall_score DECIMAL NOT NULL,
  founder_type_score DECIMAL NOT NULL,
  dimension_score DECIMAL NOT NULL,
  compatibility_score DECIMAL NOT NULL,
  match_reasons TEXT[] NOT NULL DEFAULT '{}',
  concerns TEXT[] NOT NULL DEFAULT '{}',
  suggested_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_result_id, venture_id)
);

-- Enable RLS on ventures
ALTER TABLE public.ventures ENABLE ROW LEVEL SECURITY;

-- Anyone can view active ventures
CREATE POLICY "Anyone can view active ventures"
ON public.ventures
FOR SELECT
USING (is_active = true);

-- Admins can manage ventures
CREATE POLICY "Admins can manage ventures"
ON public.ventures
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on venture_matches
ALTER TABLE public.venture_matches ENABLE ROW LEVEL SECURITY;

-- Public can insert matches (during assessment submission)
CREATE POLICY "Public can insert venture matches"
ON public.venture_matches
FOR INSERT
WITH CHECK (true);

-- Admins can view all matches
CREATE POLICY "Admins can view venture matches"
ON public.venture_matches
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on ventures
CREATE TRIGGER update_ventures_updated_at
BEFORE UPDATE ON public.ventures
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed the 8 ventures
INSERT INTO public.ventures (name, description, industry, ideal_founder_type, secondary_founder_type, dimension_weights, team_profile, suggested_roles) VALUES
(
  'NuraBowls',
  'Delivery-only healthy food brand operating through ghost kitchens',
  'Food & Consumer Products',
  'Operational Leader',
  NULL,
  '{"ownership": 1.0, "execution": 1.0, "hustle": 0.8, "problemSolving": 0.9, "leadership": 0.7}',
  '{"workingStyle": "structured", "communication": "direct", "conflictResponse": "solution_focused", "decisionMaking": "analytical", "collaboration": "high_initiative"}',
  ARRAY['Operations Lead', 'Kitchen Operations Manager', 'Supply Chain Lead']
),
(
  'Lilo Foods',
  'Snack company focused on local food processing including smoked mackerel and groundnut brittle',
  'Food & Consumer Products',
  'Operational Leader',
  NULL,
  '{"ownership": 1.0, "execution": 0.9, "hustle": 1.0, "problemSolving": 0.8, "leadership": 0.7}',
  '{"workingStyle": "structured", "communication": "direct", "conflictResponse": "calm_methodical", "decisionMaking": "analytical", "collaboration": "team_player"}',
  ARRAY['Production Manager', 'Operations Lead', 'Distribution Manager']
),
(
  'Faith',
  'Shea butter skincare brand in the beauty and CPG space',
  'Beauty & CPG',
  'Visionary Builder',
  'Growth Catalyst',
  '{"ownership": 0.8, "execution": 0.7, "hustle": 1.0, "problemSolving": 0.7, "leadership": 0.9}',
  '{"workingStyle": "creative_flexible", "communication": "storytelling", "conflictResponse": "collaborative", "decisionMaking": "instinct_based", "collaboration": "high_initiative"}',
  ARRAY['Brand Lead', 'Growth Marketing Lead', 'Creative Director']
),
(
  'Sendbox',
  'Door-to-door shipping service connecting US to Ghana',
  'Logistics',
  'Operational Leader',
  NULL,
  '{"ownership": 0.9, "execution": 1.0, "hustle": 0.8, "problemSolving": 1.0, "leadership": 0.7}',
  '{"workingStyle": "structured", "communication": "direct", "conflictResponse": "solution_focused", "decisionMaking": "analytical", "collaboration": "team_player"}',
  ARRAY['Operations Manager', 'Logistics Coordinator', 'Customer Success Lead']
),
(
  'RedRose Lens',
  'Production, media, and creative studio',
  'Media & Creative',
  'Growth Catalyst',
  'Product Architect',
  '{"ownership": 0.7, "execution": 0.8, "hustle": 1.0, "problemSolving": 0.8, "leadership": 0.9}',
  '{"workingStyle": "creative_flexible", "communication": "direct", "conflictResponse": "collaborative", "decisionMaking": "instinct_based", "collaboration": "high_initiative"}',
  ARRAY['Business Development Lead', 'Producer', 'Creative Strategy Lead']
),
(
  'GoZetu',
  'Airbnb Experiences-style platform for African travel experiences',
  'Travel & Experiences',
  'Growth Catalyst',
  'Product Architect',
  '{"ownership": 0.7, "execution": 0.7, "hustle": 1.0, "problemSolving": 0.8, "leadership": 0.9}',
  '{"workingStyle": "high_autonomy", "communication": "frequent", "conflictResponse": "collaborative", "decisionMaking": "instinct_based", "collaboration": "high_initiative"}',
  ARRAY['Growth Lead', 'Partnerships Manager', 'Community Lead']
),
(
  'Verigo Travel',
  'Lifestyle travel and ticketing platform',
  'Travel & Experiences',
  'Product Architect',
  'Visionary Builder',
  '{"ownership": 0.8, "execution": 0.8, "hustle": 0.8, "problemSolving": 0.9, "leadership": 0.9}',
  '{"workingStyle": "balanced", "communication": "structured", "conflictResponse": "solution_focused", "decisionMaking": "analytical", "collaboration": "team_player"}',
  ARRAY['Product Lead', 'Operations Manager', 'Partnerships Lead']
),
(
  'SikaPoints',
  'Universal rewards ecosystem for commerce and fintech',
  'Commerce & Fintech',
  'Product Architect',
  'Growth Catalyst',
  '{"ownership": 0.8, "execution": 0.8, "hustle": 0.9, "problemSolving": 0.9, "leadership": 1.0}',
  '{"workingStyle": "high_autonomy", "communication": "structured", "conflictResponse": "solution_focused", "decisionMaking": "data_driven", "collaboration": "high_initiative"}',
  ARRAY['Product Strategist', 'Growth Lead', 'Partnerships Manager']
);