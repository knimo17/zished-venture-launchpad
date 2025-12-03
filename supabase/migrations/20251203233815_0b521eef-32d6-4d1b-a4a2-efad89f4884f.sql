-- Rename founder terminology to operator terminology

-- Rename columns in assessment_results table
ALTER TABLE public.assessment_results 
  RENAME COLUMN primary_founder_type TO primary_operator_type;

ALTER TABLE public.assessment_results 
  RENAME COLUMN secondary_founder_type TO secondary_operator_type;

-- Rename column in venture_matches table
ALTER TABLE public.venture_matches 
  RENAME COLUMN founder_type_score TO operator_type_score;

-- Rename columns in ventures table
ALTER TABLE public.ventures 
  RENAME COLUMN ideal_founder_type TO ideal_operator_type;

ALTER TABLE public.ventures 
  RENAME COLUMN secondary_founder_type TO secondary_operator_type;