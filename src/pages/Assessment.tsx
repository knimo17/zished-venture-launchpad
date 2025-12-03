import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { calculateAssessmentResults, AssessmentResponse } from '@/lib/assessmentScoring';
import { ChevronLeft, ChevronRight, Save, CheckCircle2 } from 'lucide-react';

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

export default function Assessment() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);

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

      setSession(sessionData);
      setCurrentQuestion(sessionData.current_question || 1);
      setStarted(sessionData.status === 'in_progress');

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

      // Load existing responses
      const { data: responsesData } = await supabase
        .from('assessment_responses')
        .select('question_id, response')
        .eq('session_id', sessionData.id);

      if (responsesData) {
        const responsesMap: Record<string, number> = {};
        responsesData.forEach((r) => {
          responsesMap[r.question_id] = r.response;
        });
        setResponses(responsesMap);
      }
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

  // Save a single response
  const saveResponse = useCallback(async (questionId: string, value: number) => {
    if (!session) return;

    setSaving(true);
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
    } catch (error: any) {
      console.error('Error saving response:', error);
    } finally {
      setSaving(false);
    }
  }, [session]);

  // Update current question position
  const updateCurrentQuestion = useCallback(async (questionNum: number) => {
    if (!session) return;

    try {
      await supabase
        .from('assessment_sessions')
        .update({ current_question: questionNum })
        .eq('id', session.id);
    } catch (error) {
      console.error('Error updating current question:', error);
    }
  }, [session]);

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
      setStarted(true);
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
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    saveResponse(questionId, value);
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestion < 70) {
      const next = currentQuestion + 1;
      setCurrentQuestion(next);
      updateCurrentQuestion(next);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestion > 1) {
      const prev = currentQuestion - 1;
      setCurrentQuestion(prev);
      updateCurrentQuestion(prev);
    }
  };

  // Submit the assessment
  const handleSubmit = async () => {
    if (!session || !application) return;

    const answeredCount = Object.keys(responses).length;
    if (answeredCount < 70) {
      toast({
        title: 'Incomplete Assessment',
        description: `Please answer all questions. ${70 - answeredCount} remaining.`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Prepare responses with question data for scoring
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
      const { error: resultsError } = await supabase
        .from('assessment_results')
        .insert([{
          session_id: session.id,
          dimension_scores: results.dimensionScores as unknown as Record<string, unknown>,
          venture_fit_scores: results.ventureFitScores as unknown as Record<string, unknown>,
          team_compatibility_scores: results.teamCompatibilityScores as unknown as Record<string, unknown>,
          primary_founder_type: results.primaryFounderType,
          secondary_founder_type: results.secondaryFounderType,
          confidence_level: results.confidenceLevel,
          summary: results.summary,
          strengths: results.strengths,
          weaknesses: results.weaknesses,
          weakness_summary: results.weaknessSummary,
        }]);

      if (resultsError) throw resultsError;

      // Update session status
      const { error: sessionError } = await supabase
        .from('assessment_sessions')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      navigate('/assessment-thank-you');
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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

  const currentQ = questions.find((q) => q.question_number === currentQuestion);
  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / 70) * 100;

  // Welcome screen
  if (!started) {
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
                    <span>70 questions designed to understand your founder profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Takes approximately 15-20 minutes to complete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Your progress is saved automatically - you can continue later</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>There are no right or wrong answers - be honest and authentic</span>
                  </li>
                </ul>
              </div>

              <p className="text-center text-muted-foreground">
                This assessment helps us understand how you think, operate, and where you might best fit within our portfolio of ventures.
              </p>

              <Button onClick={handleStart} className="w-full" size="lg">
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion} of 70
            </span>
            <span className="text-sm text-muted-foreground">
              {answeredCount} answered
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {saving && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Save className="h-3 w-3" /> Saving...
            </p>
          )}
        </div>

        {/* Current Question */}
        {currentQ && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {currentQ.dimension}
                  {currentQ.sub_dimension && ` • ${currentQ.sub_dimension}`}
                </span>
              </div>
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
                    onClick={() => handleResponseChange(currentQ.id, item.value)}
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

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestion < 70 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting || answeredCount < 70}
                className="bg-primary"
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            )}
          </div>
        </div>

        {/* Quick navigation hint */}
        {answeredCount < 70 && currentQuestion === 70 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            {70 - answeredCount} questions remaining. Navigate back to answer them.
          </p>
        )}
      </div>
    </div>
  );
}
