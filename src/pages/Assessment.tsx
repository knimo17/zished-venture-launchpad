import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { calculateAssessmentResults, AssessmentResponse } from '@/lib/assessmentScoring';
import { calculateAllVentureMatches, VentureProfile, AssessmentData } from '@/lib/ventureMatching';
import { CheckCircle2, AlertTriangle, Clock, Sparkles, Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  dimension: string;
  sub_dimension: string | null;
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

interface AIInterviewQuestion {
  id: string;
  question_text: string;
  question_context: string;
  probing_area: string;
  question_order: number;
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

type AssessmentPhase = 'welcome' | 'likert' | 'generating_ai' | 'ai_interview' | 'submitting';

export default function Assessment() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  // AI Interview state
  const [phase, setPhase] = useState<AssessmentPhase>('welcome');
  const [aiQuestions, setAiQuestions] = useState<AIInterviewQuestion[]>([]);
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [currentAiQuestionIndex, setCurrentAiQuestionIndex] = useState(0);
  const [assessmentResultId, setAssessmentResultId] = useState<string | null>(null);

  // Shuffle questions based on session ID for consistent ordering
  const shuffledQuestions = useMemo(() => {
    if (!session || questions.length === 0) return [];
    return seededShuffle(questions, session.id);
  }, [questions, session?.id]);

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

      // If already started, check if they have responses - if so, they can't continue
      if (sessionData.status === 'in_progress') {
        const { data: existingResponses } = await supabase
          .from('assessment_responses')
          .select('id')
          .eq('session_id', sessionData.id)
          .limit(1);

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
        setPhase('likert');
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
      setQuestions(questionsData || []);

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

  // Save a single response and auto-advance
  const saveResponseAndAdvance = useCallback(async (questionId: string, value: number) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('assessment_responses')
        .upsert({
          session_id: session.id,
          question_id: questionId,
          response: value,
        }, {
          onConflict: 'session_id,question_id',
        });

      if (error) throw error;

      // Update local state
      setResponses((prev) => ({ ...prev, [questionId]: value }));

      // Auto-advance to next question after a brief delay
      setTimeout(() => {
        if (currentQuestionIndex < shuffledQuestions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        }
      }, 300);

    } catch (error: any) {
      console.error('Error saving response:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your response. Please try again.',
        variant: 'destructive',
      });
    }
  }, [session, currentQuestionIndex, shuffledQuestions.length, toast]);

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
      setPhase('likert');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to start assessment.',
        variant: 'destructive',
      });
    }
  };

  // Handle response selection
  const handleResponseChange = (questionId: string, value: number) => {
    saveResponseAndAdvance(questionId, value);
  };

  // Complete Likert phase and generate AI questions
  const completeLikertPhase = async () => {
    if (!session || !application) return;

    const answeredCount = Object.keys(responses).length;
    if (answeredCount < shuffledQuestions.length) {
      toast({
        title: 'Incomplete Assessment',
        description: `Please answer all questions. ${shuffledQuestions.length - answeredCount} remaining.`,
        variant: 'destructive',
      });
      return;
    }

    setPhase('generating_ai');

    try {
      // Prepare responses with question data for scoring (use original question order for scoring)
      const responsesWithData: AssessmentResponse[] = questions.map((q) => ({
        question_id: q.id,
        question_number: q.question_number,
        response: responses[q.id] || 0,
        dimension: q.dimension,
        sub_dimension: q.sub_dimension || undefined,
      }));

      // Calculate results
      const results = calculateAssessmentResults(responsesWithData, application.name);

      // Save results
      const { data: resultData, error: resultsError } = await supabase
        .from('assessment_results')
        .insert({
          session_id: session.id,
          dimension_scores: results.dimensionScores as any,
          venture_fit_scores: results.ventureFitScores as any,
          team_compatibility_scores: results.teamCompatibilityScores as any,
          primary_founder_type: results.primaryFounderType,
          secondary_founder_type: results.secondaryFounderType,
          confidence_level: results.confidenceLevel,
          summary: results.summary,
          strengths: results.strengths,
          weaknesses: results.weaknesses,
          weakness_summary: results.weaknessSummary,
        })
        .select()
        .single();

      if (resultsError) throw resultsError;
      setAssessmentResultId(resultData.id);

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
          founder_type_score: match.founderTypeScore,
          dimension_score: match.dimensionScore,
          compatibility_score: match.compatibilityScore,
          match_reasons: match.matchReasons,
          concerns: match.concerns,
          suggested_role: match.suggestedRole,
        }));

        await supabase.from('venture_matches').insert(matchInserts);
      }

      // Generate AI interview questions
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

      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-interview-questions', {
        body: {
          assessment_result_id: resultData.id,
          applicant_name: application.name,
          dimension_scores: results.dimensionScores,
          venture_fit_scores: results.ventureFitScores,
          primary_founder_type: results.primaryFounderType,
          secondary_founder_type: results.secondaryFounderType,
          confidence_level: results.confidenceLevel,
          venture_matches: ventureMatchesForAI,
        },
      });

      if (aiError) {
        console.error('Error generating AI questions:', aiError);
        // If AI fails, skip to completion
        await completeAssessment(resultData.id, ventureMatchesForAI);
        return;
      }

      if (aiData?.questions && aiData.questions.length > 0) {
        setAiQuestions(aiData.questions);
        setPhase('ai_interview');
        
        // Update session interview status
        await supabase
          .from('assessment_sessions')
          .update({ interview_status: 'in_progress' })
          .eq('id', session.id);
      } else {
        // No AI questions, complete assessment
        await completeAssessment(resultData.id, ventureMatchesForAI);
      }

    } catch (error: any) {
      console.error('Error completing Likert phase:', error);
      toast({
        title: 'Error',
        description: 'Failed to process assessment. Please try again.',
        variant: 'destructive',
      });
      setPhase('likert');
    }
  };

  // Save AI interview response
  const saveAiResponse = async (questionId: string, responseText: string) => {
    if (!session) return;

    setAiResponses((prev) => ({ ...prev, [questionId]: responseText }));

    try {
      await supabase.from('ai_interview_responses').upsert({
        question_id: questionId,
        session_id: session.id,
        response_text: responseText,
      }, {
        onConflict: 'question_id,session_id',
      });
    } catch (error) {
      console.error('Error saving AI response:', error);
    }
  };

  // Move to next AI question
  const nextAiQuestion = () => {
    const currentQuestion = aiQuestions[currentAiQuestionIndex];
    const currentResponse = aiResponses[currentQuestion.id] || '';

    if (currentResponse.trim().length < 50) {
      toast({
        title: 'Response Too Short',
        description: 'Please provide a more detailed response (at least 50 characters).',
        variant: 'destructive',
      });
      return;
    }

    if (currentAiQuestionIndex < aiQuestions.length - 1) {
      setCurrentAiQuestionIndex((prev) => prev + 1);
    }
  };

  // Complete the entire assessment
  const completeAssessment = async (resultId?: string, ventureMatches?: any[]) => {
    if (!session) return;

    setPhase('submitting');
    setSubmitting(true);

    try {
      const finalResultId = resultId || assessmentResultId;

      // Generate AI evaluation in background (don't wait for it)
      if (finalResultId && application) {
        const { data: resultData } = await supabase
          .from('assessment_results')
          .select('*')
          .eq('id', finalResultId)
          .single();

        if (resultData) {
          // Fetch venture matches if not provided
          let matches = ventureMatches;
          if (!matches) {
            const { data: matchesData } = await supabase
              .from('venture_matches')
              .select('*, ventures(name, industry)')
              .eq('assessment_result_id', finalResultId)
              .order('overall_score', { ascending: false });
            
            matches = matchesData?.map((m: any) => ({
              venture_id: m.venture_id,
              venture_name: m.ventures?.name || 'Unknown',
              industry: m.ventures?.industry || 'Unknown',
              overall_score: m.overall_score,
              match_reasons: m.match_reasons || [],
              concerns: m.concerns || [],
            })) || [];
          }

          // Fire and forget - don't await
          supabase.functions.invoke('generate-ai-evaluation', {
            body: {
              assessment_result_id: finalResultId,
              applicant_name: application.name,
              dimension_scores: resultData.dimension_scores,
              venture_fit_scores: resultData.venture_fit_scores,
              team_compatibility_scores: resultData.team_compatibility_scores,
              primary_founder_type: resultData.primary_founder_type,
              secondary_founder_type: resultData.secondary_founder_type,
              confidence_level: resultData.confidence_level,
              venture_matches: matches,
            },
          }).catch((err) => console.error('AI evaluation error:', err));
        }
      }

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
    }
  };

  // Handle final submission
  const handleFinalSubmit = async () => {
    const currentQuestion = aiQuestions[currentAiQuestionIndex];
    const currentResponse = aiResponses[currentQuestion?.id] || '';

    if (currentQuestion && currentResponse.trim().length < 50) {
      toast({
        title: 'Response Too Short',
        description: 'Please provide a more detailed response (at least 50 characters).',
        variant: 'destructive',
      });
      return;
    }

    await completeAssessment();
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
  const isLastLikertQuestion = currentQuestionIndex === shuffledQuestions.length - 1;
  const allLikertAnswered = answeredCount === shuffledQuestions.length;

  // Welcome screen
  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Founder Assessment</CardTitle>
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
                    <span><strong>Part 1:</strong> 70 questions about your founder profile (15-20 minutes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span><strong>Part 2:</strong> 5-7 personalized follow-up questions generated based on your profile (5-10 minutes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Total time: approximately 20-30 minutes</span>
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
                    <span><strong>Set aside time:</strong> Make sure you have 30+ minutes of uninterrupted time.</span>
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

  // Generating AI questions
  if (phase === 'generating_ai') {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center space-y-6">
              <Sparkles className="h-12 w-12 text-primary mx-auto animate-pulse" />
              <div>
                <h2 className="text-2xl font-semibold mb-2">Analyzing Your Profile</h2>
                <p className="text-muted-foreground">
                  We're generating personalized follow-up questions based on your responses...
                </p>
              </div>
              <Progress value={66} className="w-64 mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // AI Interview phase
  if (phase === 'ai_interview' && aiQuestions.length > 0) {
    const currentAiQ = aiQuestions[currentAiQuestionIndex];
    const currentResponse = aiResponses[currentAiQ.id] || '';
    const isLastAiQuestion = currentAiQuestionIndex === aiQuestions.length - 1;
    const aiProgress = ((currentAiQuestionIndex + 1) / aiQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Phase indicator */}
          <div className="mb-6 text-center">
            <Badge variant="secondary" className="mb-2">
              <Sparkles className="h-3 w-3 mr-1" />
              Part 2: Personalized Questions
            </Badge>
          </div>

          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Question {currentAiQuestionIndex + 1} of {aiQuestions.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(aiProgress)}% complete
              </span>
            </div>
            <Progress value={aiProgress} className="h-2" />
          </div>

          {/* Current AI Question */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">
                {currentAiQ.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={currentResponse}
                onChange={(e) => saveAiResponse(currentAiQ.id, e.target.value)}
                placeholder="Share your thoughts in 150-400 words..."
                className="min-h-[200px]"
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{currentResponse.length} characters</span>
                <span className={currentResponse.length >= 50 ? 'text-green-500' : ''}>
                  {currentResponse.length >= 50 ? '✓ Minimum met' : 'Minimum: 50 characters'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-end">
            {isLastAiQuestion ? (
              <Button
                onClick={handleFinalSubmit}
                disabled={submitting || currentResponse.length < 50}
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
            ) : (
              <Button
                onClick={nextAiQuestion}
                disabled={currentResponse.length < 50}
                size="lg"
              >
                Next Question
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Likert questions phase
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Phase indicator */}
        <div className="mb-6 text-center">
          <Badge variant="outline" className="mb-2">
            Part 1: Profile Assessment
          </Badge>
        </div>

        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Question {answeredCount + 1} of {shuffledQuestions.length}
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
              <RadioGroup
                value={responses[currentQ.id]?.toString() || ''}
                onValueChange={(value) => handleResponseChange(currentQ.id, parseInt(value))}
                className="space-y-3"
              >
                {likertLabels.map((item) => (
                  <div
                    key={item.value}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                      responses[currentQ.id] === item.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={item.value.toString()} id={`option-${item.value}`} />
                    <Label 
                      htmlFor={`option-${item.value}`} 
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {item.label}
                    </Label>
                    <span className="text-muted-foreground text-sm">{item.value}</span>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Continue to Part 2 button (only shows on last question when all answered) */}
        {isLastLikertQuestion && allLikertAnswered && (
          <div className="flex justify-center">
            <Button
              onClick={completeLikertPhase}
              disabled={submitting}
              size="lg"
              className="px-8"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Continue to Part 2
            </Button>
          </div>
        )}

        {/* Remaining questions hint */}
        {isLastLikertQuestion && !allLikertAnswered && (
          <p className="text-center text-sm text-muted-foreground">
            Please answer this question to continue.
          </p>
        )}
      </div>
    </div>
  );
}
