-- Add unique constraint on session_id and question_id for upsert to work
ALTER TABLE public.assessment_responses
ADD CONSTRAINT assessment_responses_session_question_unique 
UNIQUE (session_id, question_id);