-- Create function for updating timestamps if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for AI communications logging
CREATE TABLE public.ai_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'text_refinement', 'customer_service')),
  original_input TEXT,
  ai_output TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'copied', 'discarded')),
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_communications ENABLE ROW LEVEL SECURITY;

-- Team members can view their own communications
CREATE POLICY "Team members can view own communications"
ON public.ai_communications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.id = ai_communications.team_member_id
    AND tm.user_id = auth.uid()
  )
);

-- Team members can create their own communications
CREATE POLICY "Team members can create own communications"
ON public.ai_communications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.id = ai_communications.team_member_id
    AND tm.user_id = auth.uid()
  )
);

-- Team members can update their own communications
CREATE POLICY "Team members can update own communications"
ON public.ai_communications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.id = ai_communications.team_member_id
    AND tm.user_id = auth.uid()
  )
);

-- Admins can view all communications
CREATE POLICY "Admins can view all communications"
ON public.ai_communications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users with view_communications permission can view all
CREATE POLICY "Permitted members can view all communications"
ON public.ai_communications
FOR SELECT
USING (has_team_permission(auth.uid(), 'view_communications'::text));

-- Create index for faster queries
CREATE INDEX idx_ai_communications_team_member ON public.ai_communications(team_member_id);
CREATE INDEX idx_ai_communications_type ON public.ai_communications(communication_type);
CREATE INDEX idx_ai_communications_created ON public.ai_communications(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_communications_updated_at
BEFORE UPDATE ON public.ai_communications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();