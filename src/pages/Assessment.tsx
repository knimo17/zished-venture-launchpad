import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { calculateAssessmentResults, AssessmentResponse } from '@/lib/assessmentScoring';
import { calculateAllVentureMatches, VentureProfile, AssessmentData } from '@/lib/ventureMatching';
import { CheckCircle2, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  dimension: string;
  sub_dimension: string | null;
  is_reverse: boolean;
  is_trap: boolean;
  question_type: 'likert' | 'forced_choice' | 'scenario';
  options: string[] | null;
  option_mappings: Record<string, Record<string, number>> | null;
}

interface Session {
  id: string;
  application_id: string;
  status: string;
  current_question: number;
  interview_status: string;
}

interface Application {
  name: string;
}

const likertLabels = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

// Seeded random shuffle for consistent ordering per session
function seededShuffle<T>(array: T[], seed: string): T[] {
  const result = [...array];
  let seedNum = 0;
  for (let i = 0; i < seed.length; i++) {
    seedNum = ((seedNum << 5) - seedNum) + seed.charCodeAt(i);
    seedNum = seedNum & seedNum;
  }
  
  for (let i = result.length - 1; i > 0; i--) {
    seedNum = (seedNum * 1103515245 + 12345) & 0x7fffffff;
    const j = seedNum % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

type AssessmentPhase = 'welcome' | 'assessment' | 'submitting' | 'ready_to_submit';

export default function Assessment() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, number | string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<AssessmentPhase>('welcome');

  // Shuffle questions based on session ID for consistent ordering
  // Only shuffle likert questions (Q1-60), keep forced choice and scenario in order
  const shuffledQuestions = useMemo(() => {
    if (!session || questions.length === 0) return [];
    
    // Separate by question type
    const likertQuestions = questions.filter(q => q.question_type === 'likert');
    const forcedChoiceQuestions = questions.filter(q => q.question_type === 'forced_choice');
    const scenarioQuestions = questions.filter(q => q.question_type === 'scenario');
    
    // Shuffle only likert questions
    const shuffledLikert = seededShuffle(likertQuestions, session.id);
    
    // Return in order: shuffled likert, then forced choice, then scenarios
    return [...shuffledLikert, ...forcedChoiceQuestions, ...scenarioQuestions];
  }, [questions, session?.id]);

  // Use ref to track total questions for stable closure
  const totalQuestionsRef = useRef(0);
  useEffect(() => {
    totalQuestionsRef.current = shuffledQuestions.length;
  }, [shuffledQuestions.length]);

  // Load session, questions, and existing responses
  useEffect(() => {
    if (token) {
      loadAssessment();
    }
  }, [token]);

  const loadAssessment = async () => {
    try {
      // Get session by token
      const { data: sessionData, error: sessionError } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (sessionError || !sessionData) {
        toast({
          title: 'Invalid Link',
          description: 'This assessment link is invalid or has expired.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      if (sessionData.status === 'completed') {
        navigate('/assessment-thank-you');
        return;
      }

      // If already started, check response status
      if (sessionData.status === 'in_progress') {
        const { data: existingResponses } = await supabase
          .from('assessment_responses')
          .select('id, question_id, response')
          .eq('session_id', sessionData.id);

        const { count: totalQuestions } = await supabase
          .from('assessment_questions')
          .select('*', { count: 'exact', head: true });

        // If all questions answered, allow them to complete submission
        if (existingResponses && totalQuestions && existingResponses.length >= totalQuestions) {
          // First load questions so we can properly convert forced-choice responses
          const { data: questionsData } = await supabase
            .from('assessment_questions')
            .select('*')
            .order('question_number', { ascending: true });
          
          let transformedQuestions: Question[] = [];
          if (questionsData) {
            transformedQuestions = questionsData.map((q) => ({
              id: q.id,
              question_number: q.question_number,
              question_text: q.question_text,
              dimension: q.dimension,
              sub_dimension: q.sub_dimension,
              is_reverse: q.is_reverse || false,
              is_trap: q.is_trap || false,
              question_type: (q.question_type as 'likert' | 'forced_choice' | 'scenario') || 'likert',
              options: q.options ? (q.options as string[]) : null,
              option_mappings: q.option_mappings ? (q.option_mappings as Record<string, Record<string, number>>) : null,
            }));
            setQuestions(transformedQuestions);
          }
          
          // Load responses with proper forced-choice conversion (1/2 → 'A'/'B')
          const loadedResponses: Record<string, number | string> = {};
          existingResponses.forEach(r => {
            const question = transformedQuestions.find(q => q.id === r.question_id);
            if (question?.question_type === 'forced_choice') {
              // Convert numeric back to A/B for scoring
              loadedResponses[r.question_id] = r.response === 1 ? 'A' : 'B';
            } else {
              loadedResponses[r.question_id] = r.response;
            }
          });
          setResponses(loadedResponses);
          setSession(sessionData);
          
          // Load application data
          const { data: appData, error: appError } = await supabase
            .from('applications')
            .select('name')
            .eq('id', sessionData.application_id)
            .maybeSingle();
          
          if (appError) {
            console.error('Error loading application:', appError);
          }
          
          if (appData) {
            setApplication(appData);
          } else {
            // Fallback - set a minimal application object so submission can proceed
            setApplication({ name: 'Applicant' });
          }
          
          // Set phase AFTER all data is loaded
          setPhase('ready_to_submit');
          setLoading(false);
          return;
        }

        if (existingResponses && existingResponses.length > 0) {
          toast({
            title: 'Assessment In Progress',
            description: 'You have already started this assessment. Please complete it in your current browser session.',
            variant: 'destructive',
          });
          return;
        }
      }

      setSession(sessionData);
      if (sessionData.status === 'in_progress') {
        setPhase('assessment');
      }

      // Get application name
      const { data: appData } = await supabase
        .from('applications')
        .select('name')
        .eq('id', sessionData.application_id)
        .single();

      if (appData) {
        setApplication(appData);
      }

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .order('question_number', { ascending: true });

      if (questionsError) throw questionsError;
      
      // Transform the data to match our Question interface
      const transformedQuestions: Question[] = (questionsData || []).map((q) => ({
        id: q.id,
        question_number: q.question_number,
        question_text: q.question_text,
        dimension: q.dimension,
        sub_dimension: q.sub_dimension,
        is_reverse: q.is_reverse || false,
        is_trap: q.is_trap || false,
        question_type: (q.question_type as 'likert' | 'forced_choice' | 'scenario') || 'likert',
        options: q.options ? (q.options as string[]) : null,
        option_mappings: q.option_mappings ? (q.option_mappings as Record<string, Record<string, number>>) : null,
      }));
      
      setQuestions(transformedQuestions);

    } catch (error: any) {
      console.error('Error loading assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Save a single response with retry logic
  const saveResponseWithRetry = async (questionId: string, dbValue: number, retries = 3): Promise<boolean> => {
    if (!session) return false;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { error } = await supabase
          .from('assessment_responses')
          .upsert({
            session_id: session.id,
            question_id: questionId,
            response: dbValue,
          }, {
            onConflict: 'session_id,question_id',
          });

        if (!error) return true;
        
        console.warn(`Save attempt ${attempt} failed:`, error);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt)); // Exponential backoff
        }
      } catch (error) {
        console.warn(`Save attempt ${attempt} error:`, error);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
    }
    return false;
  };

  // Save a single response and auto-advance
  const saveResponseAndAdvance = useCallback(async (questionId: string, value: number | string) => {
    if (!session) return;

    // For the database, we store numeric values
    // For forced choice, convert A/B to 1/2 (constraint requires 1-5 range)
    const dbValue = typeof value === 'string' 
      ? (value === 'A' ? 1 : 2) 
      : value;

    const saved = await saveResponseWithRetry(questionId, dbValue);
    
    if (!saved) {
      toast({
        title: 'Error',
        description: 'Failed to save your response after multiple attempts. Please check your connection and try again.',
        variant: 'destructive',
      });
      return; // Don't advance if save failed
    }

    // Update local state with original value (A/B or number)
    setResponses((prev) => ({ ...prev, [questionId]: value }));

    // Auto-advance to next question after a brief delay using ref for stable value
    setTimeout(() => {
      const maxIndex = totalQuestionsRef.current - 1;
      setCurrentQuestionIndex((prev) => {
        if (prev < maxIndex) {
          return prev + 1;
        }
        return prev;
      });
    }, 300);
  }, [session, toast]);

  // Start the assessment
  const handleStart = async () => {
    if (!session) return;

    try {
      await supabase
        .from('assessment_sessions')
        .update({ 
          status: 'in_progress', 
          started_at: new Date().toISOString() 
        })
        .eq('id', session.id);

      setSession({ ...session, status: 'in_progress' });
      setPhase('assessment');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to start assessment.',
        variant: 'destructive',
      });
    }
  };

  // Handle response selection
  const handleResponseChange = (questionId: string, value: number | string) => {
    saveResponseAndAdvance(questionId, value);
  };

  // Complete assessment and process results
  const completeAssessment = async () => {
    if (!session || !application) {
      console.log('Missing session or application:', { session: !!session, application: !!application });
      toast({
        title: 'Error',
        description: 'Session data not loaded. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    // For ready_to_submit phase, use questions directly since shuffledQuestions may not be populated
    const questionList = phase === 'ready_to_submit' ? questions : shuffledQuestions;
    
    const answeredCount = Object.keys(responses).length;
    if (answeredCount < questionList.length) {
      toast({
        title: 'Incomplete Assessment',
        description: `Please answer all questions. ${questionList.length - answeredCount} remaining.`,
        variant: 'destructive',
      });
      return;
    }

    setPhase('submitting');
    setSubmitting(true);

    // Verify all responses are saved in database before proceeding
    const { data: savedResponses, error: verifyError } = await supabase
      .from('assessment_responses')
      .select('question_id')
      .eq('session_id', session.id);

    if (verifyError || !savedResponses) {
      toast({
        title: 'Verification Error',
        description: 'Failed to verify responses. Please try again.',
        variant: 'destructive',
      });
      setPhase('ready_to_submit');
      setSubmitting(false);
      return;
    }

    const savedQuestionIds = new Set(savedResponses.map(r => r.question_id));
    const missingQuestions = questions.filter(q => !savedQuestionIds.has(q.id));

    if (missingQuestions.length > 0) {
      // Attempt to save missing responses
      console.log('Missing responses detected, attempting to save:', missingQuestions.length);
      
      for (const q of missingQuestions) {
        const value = responses[q.id];
        if (value !== undefined) {
          const dbValue = typeof value === 'string' ? (value === 'A' ? 1 : 2) : value;
          await saveResponseWithRetry(q.id, dbValue);
        }
      }
      
      // Re-verify
      const { data: recheck } = await supabase
        .from('assessment_responses')
        .select('question_id')
        .eq('session_id', session.id);
      
      if (!recheck || recheck.length < questions.length) {
        toast({
          title: 'Incomplete Submission',
          description: 'Some responses could not be saved. Please check your connection and try again.',
          variant: 'destructive',
        });
        setPhase('ready_to_submit');
        setSubmitting(false);
        return;
      }
    }

    try {
      // Prepare responses with question data for scoring (use original question order for scoring)
      const responsesWithData: AssessmentResponse[] = questions.map((q) => {
        const responseValue = responses[q.id];
        return {
          question_id: q.id,
          question_number: q.question_number,
          response: responseValue ?? 0,
          dimension: q.dimension,
          sub_dimension: q.sub_dimension || undefined,
          is_reverse: q.is_reverse,
          is_trap: q.is_trap,
          question_type: q.question_type,
          option_mappings: q.option_mappings || undefined,
        };
      });

      // Calculate results
      const results = calculateAssessmentResults(responsesWithData, application.name);

      // Prepare data for database (excluding new fields that aren't in schema)
      const dbDimensionScores = results.dimensionScores;
      const dbVentureFitScores = results.ventureFitScores;
      const dbTeamCompatibilityScores = results.teamCompatibilityScores;

      // Save results
      const { data: resultData, error: resultsError } = await supabase
        .from('assessment_results')
        .insert({
          session_id: session.id,
          dimension_scores: dbDimensionScores as unknown as Json,
          venture_fit_scores: dbVentureFitScores as unknown as Json,
          team_compatibility_scores: dbTeamCompatibilityScores as unknown as Json,
          primary_operator_type: results.primaryFounderType,
          secondary_operator_type: results.secondaryFounderType,
          confidence_level: results.confidenceLevel,
          summary: results.summary,
          strengths: results.strengths,
          weaknesses: results.weaknesses,
          weakness_summary: results.weaknessSummary,
        })
        .select()
        .single();

      if (resultsError) throw resultsError;

      // Fetch ventures and calculate matches
      const { data: ventures } = await supabase
        .from('ventures')
        .select('*')
        .eq('is_active', true);

      let ventureMatches: any[] = [];
      if (ventures && ventures.length > 0 && resultData) {
        const assessmentData: AssessmentData = {
          dimensionScores: results.dimensionScores,
          ventureFitScores: results.ventureFitScores,
          teamCompatibilityScores: results.teamCompatibilityScores,
          primaryFounderType: results.primaryFounderType,
          secondaryFounderType: results.secondaryFounderType,
        };

        ventureMatches = calculateAllVentureMatches(
          assessmentData,
          ventures as VentureProfile[]
        );

        // Save all venture matches
        const matchInserts = ventureMatches.map((match) => ({
          assessment_result_id: resultData.id,
          venture_id: match.ventureId,
          overall_score: match.overallScore,
          operator_type_score: match.founderTypeScore,
          dimension_score: match.dimensionScore,
          compatibility_score: match.compatibilityScore,
          match_reasons: match.matchReasons,
          concerns: match.concerns,
          suggested_role: match.suggestedRole,
        }));

        await supabase.from('venture_matches').insert(matchInserts);
      }

      // Generate AI interview questions for admins (fire and forget)
      const ventureMatchesForAI = ventureMatches.slice(0, 3).map((m: any) => {
        const venture = ventures?.find((v: any) => v.id === m.ventureId);
        return {
          venture_id: m.ventureId,
          venture_name: venture?.name || 'Unknown',
          industry: venture?.industry || 'Unknown',
          overall_score: m.overallScore,
          match_reasons: m.matchReasons,
          concerns: m.concerns,
        };
      });

      // Generate AI interview questions in background (for admin use only)
      supabase.functions.invoke('generate-interview-questions', {
        body: {
          assessment_result_id: resultData.id,
          applicant_name: application.name,
          dimension_scores: results.dimensionScores,
          venture_fit_scores: results.ventureFitScores,
          primary_operator_type: results.primaryFounderType,
          secondary_operator_type: results.secondaryFounderType,
          confidence_level: results.confidenceLevel,
          venture_matches: ventureMatchesForAI,
          trap_analysis: results.trapAnalysis,
        },
      }).catch((err) => console.error('AI interview questions error:', err));

      // Generate AI evaluation in background
      supabase.functions.invoke('generate-ai-evaluation', {
        body: {
          assessment_result_id: resultData.id,
          applicant_name: application.name,
          dimension_scores: results.dimensionScores,
          venture_fit_scores: results.ventureFitScores,
          team_compatibility_scores: results.teamCompatibilityScores,
          primary_operator_type: results.primaryFounderType,
          secondary_operator_type: results.secondaryFounderType,
          confidence_level: results.confidenceLevel,
          venture_matches: ventureMatchesForAI,
          trap_analysis: results.trapAnalysis,
          style_traits: results.styleTraits,
        },
      }).catch((err) => console.error('AI evaluation error:', err));

      // Update session status
      const { error: sessionError } = await supabase
        .from('assessment_sessions')
        .update({ 
          status: 'completed', 
          interview_status: 'completed',
          completed_at: new Date().toISOString() 
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      navigate('/assessment-thank-you');
    } catch (error: any) {
      console.error('Error completing assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive',
      });
      setSubmitting(false);
      // Stay in ready_to_submit so user can retry, not assessment phase
      setPhase('ready_to_submit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Loading assessment...</div>
      </div>
    );
  }

  if (!session || !questions.length) {
    return null;
  }

  const currentQ = shuffledQuestions[currentQuestionIndex];
  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / shuffledQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === shuffledQuestions.length - 1;
  const allAnswered = answeredCount === shuffledQuestions.length;

  // Get current section label
  const getSectionLabel = () => {
    if (!currentQ) return 'Profile Assessment';
    if (currentQ.question_type === 'forced_choice') return 'Style Preferences';
    if (currentQ.question_type === 'scenario') return 'Situational Assessment';
    return 'Profile Assessment';
  };

  // Welcome screen
  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Operator Assessment</CardTitle>
              <CardDescription className="text-lg mt-2">
                Welcome, {application?.name || 'Applicant'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">About This Assessment</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span><strong>70 questions</strong> about your operator profile (15-20 minutes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Total time: approximately 15-20 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>There are no right or wrong answers - be honest and authentic</span>
                  </li>
                </ul>
              </div>

              <div className="bg-destructive/10 border border-destructive/30 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Important Instructions
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-destructive">•</span>
                    <span><strong>Complete in one session:</strong> You must complete the entire assessment in one sitting.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-destructive">•</span>
                    <span><strong>No going back:</strong> Once you answer a question, you cannot change your response.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-destructive">•</span>
                    <span><strong>One attempt only:</strong> This assessment can only be taken once.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-destructive">•</span>
                    <span><strong>Set aside time:</strong> Make sure you have 20+ minutes of uninterrupted time.</span>
                  </li>
                </ul>
              </div>

              <p className="text-center text-muted-foreground">
                This assessment helps us understand how you think, operate, and where you might best fit within our portfolio of ventures.
              </p>

              <Button onClick={handleStart} className="w-full" size="lg">
                I Understand - Start Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Submitting phase
  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center space-y-6">
              <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
              <div>
                <h2 className="text-2xl font-semibold mb-2">Processing Your Assessment</h2>
                <p className="text-muted-foreground">
                  Please wait while we analyze your responses...
                </p>
              </div>
              <Progress value={66} className="w-64 mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Ready to submit phase (for users returning with all responses already saved)
  if (phase === 'ready_to_submit') {
    // Check if all data is loaded before allowing submission
    const dataReady = session && application && questions.length > 0 && Object.keys(responses).length > 0;
    
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Complete Your Submission</CardTitle>
              <CardDescription className="mt-2">
                Welcome back, {application?.name || 'Applicant'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!dataReady ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin mb-4" />
                  <p className="text-muted-foreground">Loading your assessment data...</p>
                </div>
              ) : (
                <>
                  <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-lg text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">All Questions Answered</h3>
                    <p className="text-muted-foreground">
                      You've answered all {questions.length} questions. Click below to submit your assessment.
                    </p>
                  </div>

                  <Button 
                    onClick={completeAssessment} 
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      completeAssessment();
                    }}
                    className="w-full min-h-[56px] touch-manipulation"
                    size="lg"
                    disabled={submitting || !dataReady}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit My Assessment'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render Likert question
  const renderLikertQuestion = () => (
    <RadioGroup
      key={currentQ.id}
      value={responses[currentQ.id]?.toString() || ''}
      onValueChange={(value) => handleResponseChange(currentQ.id, parseInt(value))}
      className="space-y-3"
    >
      {likertLabels.map((item) => (
        <Label
          key={item.value}
          htmlFor={`option-${currentQ.id}-${item.value}`}
          className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
            responses[currentQ.id] === item.value
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-muted/50'
          }`}
        >
          <RadioGroupItem value={item.value.toString()} id={`option-${currentQ.id}-${item.value}`} />
          <span className="flex-1 font-normal">
            {item.label}
          </span>
        </Label>
      ))}
    </RadioGroup>
  );

  // Render Forced Choice question
  const renderForcedChoiceQuestion = () => {
    if (!currentQ.options || currentQ.options.length < 2) return null;
    
    return (
      <RadioGroup
        key={currentQ.id}
        value={responses[currentQ.id]?.toString() || ''}
        onValueChange={(value) => handleResponseChange(currentQ.id, value)}
        className="space-y-4"
      >
        {['A', 'B'].map((choice, idx) => (
          <Label
            key={choice}
            htmlFor={`choice-${currentQ.id}-${choice}`}
            className={`flex items-start space-x-3 p-5 rounded-lg border-2 transition-all cursor-pointer ${
              responses[currentQ.id] === choice
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:bg-muted/50 hover:border-muted-foreground/30'
            }`}
          >
            <RadioGroupItem value={choice} id={`choice-${currentQ.id}-${choice}`} className="mt-1" />
            <div className="flex-1">
              <span className="font-medium text-sm text-muted-foreground mb-1 block">Option {choice}</span>
              <span className="text-base">
                {currentQ.options[idx]}
              </span>
            </div>
          </Label>
        ))}
      </RadioGroup>
    );
  };

  // Render Scenario question
  const renderScenarioQuestion = () => {
    if (!currentQ.options) return null;
    
    return (
      <RadioGroup
        key={currentQ.id}
        value={responses[currentQ.id]?.toString() || ''}
        onValueChange={(value) => handleResponseChange(currentQ.id, parseInt(value))}
        className="space-y-3"
      >
        {currentQ.options.map((option, idx) => {
          const optionValue = idx + 1; // Use 1-indexed for database (1-5 range)
          return (
            <Label
              key={idx}
              htmlFor={`scenario-${currentQ.id}-${idx}`}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                responses[currentQ.id] === optionValue
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value={optionValue.toString()} id={`scenario-${currentQ.id}-${idx}`} />
              <span className="flex-1 font-normal">
                {option}
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    );
  };

  // Assessment phase
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Phase indicator */}
        <div className="mb-6 text-center">
          <Badge variant="outline" className="mb-2">
            {getSectionLabel()}
          </Badge>
        </div>

        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {answeredCount} answered
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Question */}
        {currentQ && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">
                {currentQ.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentQ.question_type === 'likert' && renderLikertQuestion()}
              {currentQ.question_type === 'forced_choice' && renderForcedChoiceQuestion()}
              {currentQ.question_type === 'scenario' && renderScenarioQuestion()}
            </CardContent>
          </Card>
        )}

        {/* Submit button - shows when all questions answered */}
        {allAnswered && (
          <div className="flex justify-center">
            <Button
              onClick={completeAssessment}
              disabled={submitting}
              size="lg"
              className="px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Assessment'
              )}
            </Button>
          </div>
        )}

        {/* Remaining questions hint */}
        {!allAnswered && (
          <p className="text-center text-sm text-muted-foreground">
            {isLastQuestion 
              ? 'Please answer this question to submit.'
              : `${shuffledQuestions.length - answeredCount} questions remaining`}
          </p>
        )}
      </div>
    </div>
  );
}
