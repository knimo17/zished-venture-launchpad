import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Printer, Download, Save } from 'lucide-react';
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

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchApplication();
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
    { label: 'Business you admire & growth strategy', answer: application.question1 },
    { label: 'Time you improved/organized something', answer: application.question2 },
    { label: 'Industry revenue strategy', answer: application.question3 },
    { label: 'Strategic interest area', answer: application.question4 },
  ];

  const generalQuestions = [
    { label: 'Business Growth Experience', answer: application.question1 },
    { label: 'Problem-Solving Example', answer: application.question2 },
    { label: 'Industry Passion', answer: application.question3 },
    { label: 'Revenue Growth Strategy', answer: application.question4 },
    { label: 'Product/Service Ideas', answer: application.question5 },
    { label: 'Equity Motivation', answer: application.question6 },
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

        {questions.map((q, index) => (
          <Card key={index} className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{q.label}</CardTitle>
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
