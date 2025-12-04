import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Printer, Download, Save, Send, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { AssessmentResults } from '@/components/AssessmentResults';
import { VentureMatchesSection, VentureMatch } from '@/components/VentureMatchesSection';
import { AIEvaluationSection } from '@/components/AIEvaluationSection';
import { AIVentureAnalysisCard } from '@/components/AIVentureAnalysisCard';
import { AIInterviewResponsesSection } from '@/components/AIInterviewResponsesSection';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Application {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  linkedin_url: string | null;
  expected_salary: string;
  status: string;
  question1: string;
  question2: string;
  question3: string;
  question4: string;
  question5: string;
  question6: string;
  resume_file_name: string | null;
  resume_file_path: string | null;
  admin_notes: string | null;
  internship_id: string | null;
  internships: {
    title: string;
    portfolio_company: string;
  } | null;
}

interface AssessmentSession {
  id: string;
  status: string;
  sent_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface AssessmentResultData {
  id: string;
  dimension_scores: {
    ownership: number;
    execution: number;
    hustle: number;
    problemSolving: number;
    leadership: number;
  };
  venture_fit_scores: {
    operator: number;
    product: number;
    growth: number;
    vision: number;
  };
  team_compatibility_scores: {
    workingStyle: number;
    communication: number;
    conflictResponse: number;
    decisionMaking: number;
    collaboration: number;
  };
  primary_operator_type: string;
  secondary_operator_type: string | null;
  confidence_level: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  weakness_summary: string;
}

interface AIEvaluation {
  personalized_summary: string;
  personalized_strengths: Array<{ strength: string; evidence: string; application: string }>;
  personalized_growth_areas: Array<{ area: string; observation: string; recommendation: string }>;
  response_patterns: { consistency: string; notable_patterns: string[] };
  red_flags: string[];
  overall_recommendation: string;
  recommendation_reasoning: string;
  honesty_assessment?: { reliability: 'High' | 'Moderate' | 'Low'; notes: string };
  style_profile?: { decision_style: string; work_preference: string; communication_approach: string; primary_focus: string };
}

interface AIVentureAnalysis {
  venture_id: string;
  fit_narrative: string;
  role_recommendation: string;
  onboarding_suggestions: string[];
}

interface AIInterviewQuestion {
  id: string;
  question_text: string;
  question_context: string;
  probing_area: string;
  question_order: number;
}

interface AIInterviewResponse {
  question_id: string;
  response_text: string;
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [assessmentSession, setAssessmentSession] = useState<AssessmentSession | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResultData | null>(null);
  const [ventureMatches, setVentureMatches] = useState<VentureMatch[]>([]);
  const [sendingAssessment, setSendingAssessment] = useState(false);
  
  // AI data states
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [aiVentureAnalyses, setAiVentureAnalyses] = useState<(AIVentureAnalysis & { venture_name: string; industry: string })[]>([]);
  const [aiInterviewQuestions, setAiInterviewQuestions] = useState<AIInterviewQuestion[]>([]);
  const [aiInterviewResponses, setAiInterviewResponses] = useState<AIInterviewResponse[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchApplication();
      fetchAssessmentData();
    }
  }, [id]);

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          internships (
            title,
            portfolio_company
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setApplication(data);
      setNotes(data.admin_notes || '');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentData = async () => {
    try {
      // Fetch assessment session
      const { data: sessionData } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('application_id', id)
        .maybeSingle();

      if (sessionData) {
        setAssessmentSession(sessionData);

        // If completed, fetch results and venture matches
        if (sessionData.status === 'completed') {
          const { data: resultsData } = await supabase
            .from('assessment_results')
            .select('*')
            .eq('session_id', sessionData.id)
            .maybeSingle();

          if (resultsData) {
            setAssessmentResults(resultsData as unknown as AssessmentResultData);

            // Fetch venture matches with venture details
            const { data: matchesData } = await supabase
              .from('venture_matches')
              .select(`
                *,
                ventures (
                  name,
                  industry
                )
              `)
              .eq('assessment_result_id', resultsData.id)
              .order('overall_score', { ascending: false });

            if (matchesData) {
              const formattedMatches: VentureMatch[] = matchesData.map((m: any) => ({
                venture_id: m.venture_id,
                venture_name: m.ventures?.name || 'Unknown',
                industry: m.ventures?.industry || 'Unknown',
                overall_score: m.overall_score,
                operator_type_score: m.operator_type_score,
                dimension_score: m.dimension_score,
                compatibility_score: m.compatibility_score,
                match_reasons: m.match_reasons || [],
                concerns: m.concerns || [],
                suggested_role: m.suggested_role,
              }));
              setVentureMatches(formattedMatches);
            }

            // Fetch AI evaluation
            const { data: aiEvalData } = await supabase
              .from('ai_evaluation')
              .select('*')
              .eq('assessment_result_id', resultsData.id)
              .maybeSingle();

            if (aiEvalData) {
              setAiEvaluation({
                personalized_summary: aiEvalData.personalized_summary,
                personalized_strengths: aiEvalData.personalized_strengths as any,
                personalized_growth_areas: aiEvalData.personalized_growth_areas as any,
                response_patterns: aiEvalData.response_patterns as any,
                red_flags: aiEvalData.red_flags || [],
                overall_recommendation: aiEvalData.overall_recommendation,
                recommendation_reasoning: aiEvalData.recommendation_reasoning,
                honesty_assessment: (aiEvalData as any).honesty_assessment as any,
                style_profile: (aiEvalData as any).style_profile as any,
              });
            }

            // Fetch AI venture analyses
            const { data: aiVentureData } = await supabase
              .from('ai_venture_analysis')
              .select('*, ventures(name, industry)')
              .eq('assessment_result_id', resultsData.id);

            if (aiVentureData) {
              setAiVentureAnalyses(aiVentureData.map((v: any) => ({
                venture_id: v.venture_id,
                fit_narrative: v.fit_narrative,
                role_recommendation: v.role_recommendation,
                onboarding_suggestions: v.onboarding_suggestions || [],
                venture_name: v.ventures?.name || 'Unknown',
                industry: v.ventures?.industry || 'Unknown',
              })));
            }

            // Fetch AI interview questions and responses
            const { data: aiQuestionsData } = await supabase
              .from('ai_interview_questions')
              .select('*')
              .eq('assessment_result_id', resultsData.id)
              .order('question_order', { ascending: true });

            if (aiQuestionsData && aiQuestionsData.length > 0) {
              setAiInterviewQuestions(aiQuestionsData);

              // Fetch responses for these questions
              const questionIds = aiQuestionsData.map((q: any) => q.id);
              const { data: responsesData } = await supabase
                .from('ai_interview_responses')
                .select('*')
                .in('question_id', questionIds);

              if (responsesData) {
                setAiInterviewResponses(responsesData);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching assessment data:', error);
    }
  };

  const sendAssessment = async () => {
    if (!application) return;

    setSendingAssessment(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-assessment', {
        body: { application_id: application.id },
      });

      if (error) throw error;

      toast({
        title: 'Assessment Sent',
        description: `Assessment email sent to ${application.email}`,
      });

      // Refresh assessment data
      fetchAssessmentData();
    } catch (error: any) {
      console.error('Error sending assessment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send assessment',
        variant: 'destructive',
      });
    } finally {
      setSendingAssessment(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setApplication((prev) => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: 'Success',
        description: 'Application status updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const downloadResume = async () => {
    if (!application?.resume_file_path) return;

    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(application.resume_file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = application.resume_file_name || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to download resume',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const saveNotes = async () => {
    try {
      setSavingNotes(true);
      const { error } = await supabase
        .from('applications')
        .update({ admin_notes: notes })
        .eq('id', id);

      if (error) throw error;
      
      setApplication((prev) => prev ? { ...prev, admin_notes: notes } : null);
      toast({
        title: 'Success',
        description: 'Notes saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const getAssessmentStatusBadge = () => {
    if (!assessmentSession) return null;

    const statusConfig = {
      pending: { label: 'Sent - Pending', icon: Clock, variant: 'outline' as const },
      in_progress: { label: 'In Progress', icon: AlertCircle, variant: 'secondary' as const },
      completed: { label: 'Completed', icon: CheckCircle, variant: 'default' as const },
    };

    const config = statusConfig[assessmentSession.status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading application...</div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const isInternship = application.internship_id !== null;
  
  const internshipQuestions = [
    { 
      label: 'Question 1',
      question: 'Name a business you admire. What strategic move could help it grow faster?',
      answer: application.question1 
    },
    { 
      label: 'Question 2',
      question: 'Share a time you improved or organized something. What decision did you make and why?',
      answer: application.question2 
    },
    { 
      label: 'Question 3',
      question: 'Choose one industry we operate in (food, travel, logistics, media, agriculture). Suggest one strategy that could boost revenue in that industry.',
      answer: application.question3 
    },
    { 
      label: 'Question 4',
      question: 'What interests you more and why: Pricing strategy, Content strategy, Funnel strategy, or Data-driven decision-making?',
      answer: application.question4 
    },
  ];

  const generalQuestions = [
    { 
      label: 'Question 1',
      question: 'What business have you helped grow or run? Describe your role.',
      answer: application.question1 
    },
    { 
      label: 'Question 2',
      question: 'Tell us a time you solved a messy operational problem.',
      answer: application.question2 
    },
    { 
      label: 'Question 3',
      question: 'Which industry are you most excited to build in, and why?',
      answer: application.question3 
    },
    { 
      label: 'Question 4',
      question: 'Pick a venture idea from our list OR suggest your own if you\'re passionate about building something specific. How would you grow revenue in the first 90 days?',
      answer: application.question4 
    },
    { 
      label: 'Question 5',
      question: 'What\'s one product you think we should launch?',
      answer: application.question5 
    },
    { 
      label: 'Question 6',
      question: 'Why do you want equity?',
      answer: application.question6 
    },
  ];

  const questions = isInternship ? internshipQuestions : generalQuestions;

  return (
    <div className="min-h-screen bg-background">
      {/* Print Header (hidden on screen) */}
      <div className="print:block hidden text-center mb-8">
        <h1 className="text-2xl font-bold">verigo54 - {isInternship ? 'Internship' : 'Venture Operator'} Application</h1>
        <p className="text-sm text-muted-foreground">Application ID: {application.id}</p>
        {isInternship && application.internships && (
          <p className="text-sm text-muted-foreground">
            {application.internships.title} at {application.internships.portfolio_company}
          </p>
        )}
      </div>

      {/* Screen-only controls */}
      <div className="print:hidden sticky top-0 bg-background border-b z-10 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            {application.resume_file_path && (
              <Button onClick={downloadResume} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Resume
              </Button>
            )}
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-3xl">{application.name}</CardTitle>
                  {isInternship ? (
                    <Badge variant="secondary">Internship</Badge>
                  ) : (
                    <Badge variant="outline">General</Badge>
                  )}
                </div>
                {isInternship && application.internships && (
                  <p className="text-base font-medium mb-1">
                    {application.internships.title} at {application.internships.portfolio_company}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Submitted: {new Date(application.created_at).toLocaleString()}
                </p>
              </div>
              <div className="print:hidden">
                <Select value={application.status} onValueChange={updateStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="print:block hidden">
                <Badge>{application.status}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{application.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{application.phone}</p>
              </div>
              {application.linkedin_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                  <a
                    href={application.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline print:text-foreground"
                  >
                    {application.linkedin_url}
                  </a>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Salary</p>
                <p>{application.expected_salary}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Section */}
        <Card className="mb-6 print:hidden">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Operator Assessment</CardTitle>
              {getAssessmentStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            {!assessmentSession ? (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  Send a 70-question assessment to evaluate this applicant's operator profile.
                </p>
                <Button onClick={sendAssessment} disabled={sendingAssessment}>
                  <Send className="mr-2 h-4 w-4" />
                  {sendingAssessment ? 'Sending...' : 'Send Assessment'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Sent: {new Date(assessmentSession.sent_at).toLocaleString()}</span>
                  {assessmentSession.started_at && (
                    <span>Started: {new Date(assessmentSession.started_at).toLocaleString()}</span>
                  )}
                  {assessmentSession.completed_at && (
                    <span>Completed: {new Date(assessmentSession.completed_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {aiEvaluation && (
          <AIEvaluationSection
            personalizedSummary={aiEvaluation.personalized_summary}
            strengths={aiEvaluation.personalized_strengths}
            growthAreas={aiEvaluation.personalized_growth_areas}
            responsePatterns={aiEvaluation.response_patterns}
            redFlags={aiEvaluation.red_flags}
            overallRecommendation={aiEvaluation.overall_recommendation}
            recommendationReasoning={aiEvaluation.recommendation_reasoning}
            honestyAssessment={aiEvaluation.honesty_assessment}
            styleProfile={aiEvaluation.style_profile}
          />
        )}

        {/* AI Venture Analyses */}
        {aiVentureAnalyses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Venture Fit Analysis
            </h2>
            {aiVentureAnalyses.map((analysis) => (
              <AIVentureAnalysisCard
                key={analysis.venture_id}
                ventureName={analysis.venture_name}
                industry={analysis.industry}
                fitNarrative={analysis.fit_narrative}
                roleRecommendation={analysis.role_recommendation}
                onboardingSuggestions={analysis.onboarding_suggestions}
              />
            ))}
          </div>
        )}

        {/* Venture Matches */}
        {ventureMatches.length > 0 && (
          <VentureMatchesSection matches={ventureMatches} />
        )}

        {/* AI Interview Responses */}
        {aiInterviewQuestions.length > 0 && (
          <AIInterviewResponsesSection
            questions={aiInterviewQuestions}
            responses={aiInterviewResponses}
          />
        )}

        {/* Assessment Results */}
        {assessmentResults && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Assessment Results</h2>
            <AssessmentResults
              dimensionScores={assessmentResults.dimension_scores}
              ventureFitScores={assessmentResults.venture_fit_scores}
              teamCompatibilityScores={assessmentResults.team_compatibility_scores}
              primaryFounderType={assessmentResults.primary_operator_type}
              secondaryFounderType={assessmentResults.secondary_operator_type}
              confidenceLevel={assessmentResults.confidence_level}
              summary={assessmentResults.summary}
              strengths={assessmentResults.strengths}
              weaknesses={assessmentResults.weaknesses}
              weaknessSummary={assessmentResults.weakness_summary}
            />
          </div>
        )}

        {questions.map((q, index) => (
          <Card key={index} className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{q.label}</CardTitle>
              <p className="text-sm text-muted-foreground font-normal mt-2">{q.question}</p>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{q.answer}</p>
            </CardContent>
          </Card>
        ))}

        {application.resume_file_name && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {isInternship ? 'Proof of Thinking (Optional)' : 'Resume'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{application.resume_file_name}</p>
              <p className="text-xs text-muted-foreground mt-1 print:hidden">
                Use the download button above to view the full file
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">Admin Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this application..."
              className="min-h-[150px]"
            />
            <Button 
              onClick={saveNotes} 
              disabled={savingNotes}
              className="w-full sm:w-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
          }
        }
      `}} />
    </div>
  );
}
