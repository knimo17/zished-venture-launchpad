import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertTriangle, Clock, Loader2 } from 'lucide-react';

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

type Phase = 'loading' | 'invalid' | 'welcome' | 'assessment' | 'submitting';

export default function AssessmentV2() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [applicantName, setApplicantName] = useState<string>('Applicant');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, number | string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // Shuffle likert questions, keep forced_choice and scenario at the end
  const orderedQuestions = useMemo(() => {
    if (!sessionId || questions.length === 0) return [];
    const likert = questions.filter(q => q.question_type === 'likert');
    const forcedChoice = questions.filter(q => q.question_type === 'forced_choice');
    const scenario = questions.filter(q => q.question_type === 'scenario');
    return [...seededShuffle(likert, sessionId), ...forcedChoice, ...scenario];
  }, [questions, sessionId]);

  // Load session and questions on mount
  useEffect(() => {
    if (!token) {
      setPhase('invalid');
      return;
    }
    loadSession();
  }, [token]);

  const loadSession = async () => {
    try {
      // Get session by token
      const { data: session, error: sessionError } = await supabase
        .from('assessment_sessions')
        .select('id, application_id, status')
        .eq('token', token)
        .maybeSingle();

      if (sessionError || !session) {
        setPhase('invalid');
        return;
      }

      // If already completed, go to thank you
      if (session.status === 'completed') {
        navigate('/assessment-thank-you');
        return;
      }

      setSessionId(session.id);

      // Get applicant name (may fail due to RLS, use fallback)
      const { data: app } = await supabase
        .from('applications')
        .select('name')
        .eq('id', session.application_id)
        .maybeSingle();
      if (app?.name) setApplicantName(app.name);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('*')
        .order('question_number', { ascending: true });

      if (questionsError || !questionsData) {
        toast({ title: 'Error', description: 'Failed to load questions.', variant: 'destructive' });
        setPhase('invalid');
        return;
      }

      const transformed: Question[] = questionsData.map((q) => ({
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

      setQuestions(transformed);

      // Force restart: delete any existing responses
      await supabase.from('assessment_responses').delete().eq('session_id', session.id);

      // Reset session to in_progress
      await supabase
        .from('assessment_sessions')
        .update({ status: 'in_progress', started_at: new Date().toISOString(), current_question: 1 })
        .eq('id', session.id);

      setPhase('welcome');
    } catch (error) {
      console.error('Load error:', error);
      setPhase('invalid');
    }
  };

  const handleStart = () => {
    setPhase('assessment');
  };

  const handleResponse = async (questionId: string, value: number | string) => {
    if (saving || !sessionId) return;
    setSaving(true);

    // Save to local state immediately
    setResponses((prev) => ({ ...prev, [questionId]: value }));

    // Save to database
    const dbValue = typeof value === 'string' ? (value === 'A' ? 1 : 2) : value;
    const { error } = await supabase.from('assessment_responses').upsert(
      { session_id: sessionId, question_id: questionId, response: dbValue },
      { onConflict: 'session_id,question_id' }
    );

    if (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save response. Please try again.', variant: 'destructive' });
      setSaving(false);
      return;
    }

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentIndex < orderedQuestions.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
      setSaving(false);
    }, 250);
  };

  const handleSubmit = async () => {
    if (!sessionId || !token) return;

    // Check all questions answered
    const answeredCount = Object.keys(responses).length;
    if (answeredCount < orderedQuestions.length) {
      toast({
        title: 'Incomplete',
        description: `Please answer all questions. ${orderedQuestions.length - answeredCount} remaining.`,
        variant: 'destructive',
      });
      return;
    }

    setPhase('submitting');

    try {
      // Prepare responses data for backend scoring
      const responsesWithMeta = questions.map((q) => ({
        question_id: q.id,
        question_number: q.question_number,
        response: responses[q.id] ?? 0,
        dimension: q.dimension,
        sub_dimension: q.sub_dimension || null,
        is_reverse: q.is_reverse,
        is_trap: q.is_trap,
        question_type: q.question_type,
        option_mappings: q.option_mappings || null,
      }));

      // Call backend to score and save everything
      const { data, error } = await supabase.functions.invoke('submit-assessment-v2', {
        body: {
          token,
          applicant_name: applicantName,
          responses: responsesWithMeta,
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Submission failed');
      }

      // Success - navigate to thank you
      navigate('/assessment-thank-you');
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Submission Error',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setPhase('assessment');
    }
  };

  // --- Render phases ---

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This assessment link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Operator Assessment</CardTitle>
              <CardDescription className="text-lg mt-2">Welcome, {applicantName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">About This Assessment</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span><strong>70 questions</strong> about your operator profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>Takes approximately 15-20 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>No right or wrong answers - be honest</span>
                  </li>
                </ul>
              </div>

              <div className="bg-destructive/10 border border-destructive/30 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Important
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>• Complete in one session</li>
                  <li>• Once answered, you cannot change responses</li>
                  <li>• This assessment can only be taken once</li>
                </ul>
              </div>

              <Button onClick={handleStart} className="w-full" size="lg">
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12 space-y-6">
            <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
            <div>
              <h2 className="text-xl font-semibold">Submitting Assessment</h2>
              <p className="text-muted-foreground mt-2">Please wait while we process your results...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Assessment phase ---
  const currentQ = orderedQuestions[currentIndex];
  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / orderedQuestions.length) * 100;
  const allAnswered = answeredCount >= orderedQuestions.length;

  const getSectionLabel = () => {
    if (!currentQ) return 'Assessment';
    if (currentQ.question_type === 'forced_choice') return 'Style Preferences';
    if (currentQ.question_type === 'scenario') return 'Situational Assessment';
    return 'Profile Assessment';
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress header */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{getSectionLabel()}</span>
            <span>{answeredCount} / {orderedQuestions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium leading-relaxed">
              {currentQ?.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentQ?.question_type === 'likert' && (
              <RadioGroup
                value={responses[currentQ.id]?.toString() || ''}
                onValueChange={(val) => handleResponse(currentQ.id, parseInt(val, 10))}
                className="space-y-3"
                disabled={saving}
              >
                {likertLabels.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={opt.value.toString()} id={`opt-${opt.value}`} />
                    <Label htmlFor={`opt-${opt.value}`} className="cursor-pointer flex-1">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQ?.question_type === 'forced_choice' && currentQ.options && (
              <RadioGroup
                value={(responses[currentQ.id] as string) || ''}
                onValueChange={(val) => handleResponse(currentQ.id, val)}
                className="space-y-3"
                disabled={saving}
              >
                {currentQ.options.map((opt, idx) => {
                  const val = idx === 0 ? 'A' : 'B';
                  return (
                    <div key={val} className="flex items-start space-x-3">
                      <RadioGroupItem value={val} id={`fc-${val}`} className="mt-1" />
                      <Label htmlFor={`fc-${val}`} className="cursor-pointer flex-1 leading-relaxed">
                        {opt}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            )}

            {currentQ?.question_type === 'scenario' && currentQ.options && (
              <RadioGroup
                value={responses[currentQ.id]?.toString() || ''}
                onValueChange={(val) => handleResponse(currentQ.id, parseInt(val, 10))}
                className="space-y-3"
                disabled={saving}
              >
                {currentQ.options.map((opt, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <RadioGroupItem value={(idx + 1).toString()} id={`sc-${idx}`} className="mt-1" />
                    <Label htmlFor={`sc-${idx}`} className="cursor-pointer flex-1 leading-relaxed">
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0 || saving}
          >
            Previous
          </Button>

          {allAnswered ? (
            <Button onClick={handleSubmit} disabled={saving}>
              Submit Assessment
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex((i) => Math.min(orderedQuestions.length - 1, i + 1))}
              disabled={currentIndex >= orderedQuestions.length - 1 || saving}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
