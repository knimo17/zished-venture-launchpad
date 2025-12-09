import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// Schema for internship applications (4 questions + optional file)
const internshipSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").or(z.literal("")).optional(),
  phone: z.string().min(10, "Please enter a valid phone number"),
  expectedSalary: z.string().min(1, "Please enter your expected monthly salary"),
  resume: z.instanceof(File, { message: "Please upload your proof of thinking" })
    .refine((file) => file.size <= 5000000, "File size must be less than 5MB")
    .refine(
      (file) => ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type),
      "Only PDF, DOC, and DOCX files are allowed"
    )
    .optional(),
  question1: z.string().min(50, "Please provide a detailed answer (at least 50 characters)"),
  question2: z.string().min(50, "Please provide a detailed answer (at least 50 characters)"),
  question3: z.string().min(50, "Please provide a detailed answer (at least 50 characters)"),
  question4: z.string().min(50, "Please provide a detailed answer (at least 50 characters)"),
  question5: z.string().optional().default("N/A"),
  question6: z.string().optional().default("N/A"),
});

// Schema for general applications (6 questions + required resume)
const generalSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").or(z.literal("")).optional(),
  phone: z.string().min(10, "Please enter a valid phone number"),
  expectedSalary: z.string().min(1, "Please enter your expected monthly salary"),
  resume: z.instanceof(File, { message: "Please upload your resume" })
    .refine((file) => file.size <= 5000000, "File size must be less than 5MB")
    .refine(
      (file) => ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type),
      "Only PDF, DOC, and DOCX files are allowed"
    ),
  question1: z.string().min(50, "Please provide a detailed answer (at least 50 characters)"),
  question2: z.string().min(50, "Please provide a detailed answer (at least 50 characters)"),
  question3: z.string().min(50, "Please provide a detailed answer (at least 50 characters)"),
  question4: z.string().min(50, "Please provide a detailed answer (at least 50 characters)"),
  question5: z.string().min(50, "Please provide a detailed answer (at least 50 characters)"),
  question6: z.string().min(50, "Please provide a detailed answer (at least 50 characters)"),
});

export const ApplicationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const internshipId = searchParams.get('internship');
  const [internshipInfo, setInternshipInfo] = useState<{ title: string; portfolio_company: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (internshipId) {
      fetchInternshipInfo();
    }
  }, [internshipId]);

  const fetchInternshipInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('internships')
        .select('title, portfolio_company')
        .eq('id', internshipId)
        .single();

      if (error) throw error;
      setInternshipInfo(data);
    } catch (error) {
      console.error('Error fetching internship:', error);
    }
  };

  const formSchema = internshipId ? internshipSchema : generalSchema;
  
  const form = useForm<z.infer<typeof internshipSchema> | z.infer<typeof generalSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      linkedinUrl: "",
      phone: "",
      expectedSalary: "",
      question1: "",
      question2: "",
      question3: "",
      question4: "",
      question5: "",
      question6: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      let filePath = null;
      let fileName = null;

      // Upload file to storage if provided
      if (values.resume) {
        const fileExt = values.resume.name.split('.').pop();
        fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, values.resume);

        if (uploadError) {
          throw uploadError;
        }
      }

      // Save application to database
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          name: values.name,
          email: values.email,
          linkedin_url: values.linkedinUrl || null,
          phone: values.phone,
          expected_salary: values.expectedSalary,
          resume_file_name: fileName,
          resume_file_path: filePath,
          question1: values.question1,
          question2: values.question2,
          question3: values.question3,
          question4: values.question4,
          question5: values.question5 || "N/A",
          question6: values.question6 || "N/A",
          internship_id: internshipId || null,
        });

      if (insertError) {
        throw insertError;
      }

      // Send email notifications
      try {
        await supabase.functions.invoke('send-application-notification', {
          body: {
            applicantName: values.name,
            applicantEmail: values.email,
            phone: values.phone,
            linkedinUrl: values.linkedinUrl || undefined,
            expectedSalary: values.expectedSalary,
            applicationType: internshipId ? 'internship' : 'general',
            internshipTitle: internshipInfo?.title,
            portfolioCompany: internshipInfo?.portfolio_company,
          },
        });
      } catch (emailError) {
        console.error('Failed to send notification emails:', emailError);
        // Don't fail the submission if email fails
      }

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you soon.",
      });
      
      form.reset();
    } catch (error: unknown) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const internshipQuestions = [
    {
      name: "question1" as const,
      label: "1. Name a business you admire. What strategic move could help it grow faster?",
    },
    {
      name: "question2" as const,
      label: "2. Share a time you improved or organized something. What decision did you make and why?",
    },
    {
      name: "question3" as const,
      label: "3. Choose one industry we operate in (food, travel, logistics, media, agriculture). Suggest one strategy that could boost revenue in that industry.",
    },
    {
      name: "question4" as const,
      label: "4. What interests you more and why: Pricing strategy, Content strategy, Funnel strategy, or Data-driven decision-making?",
    },
  ];

  const generalQuestions = [
    {
      name: "question1" as const,
      label: "1. What business have you helped grow or run? Describe your role.",
    },
    {
      name: "question2" as const,
      label: "2. Tell us a time you solved a messy operational problem.",
    },
    {
      name: "question3" as const,
      label: "3. Which industry are you most excited to build in, and why?",
    },
    {
      name: "question4" as const,
      label: "4. Pick a venture idea from our list OR suggest your own if you're passionate about building something specific. How would you grow revenue in the first 90 days?",
    },
    {
      name: "question5" as const,
      label: "5. What's one product you think we should launch?",
    },
    {
      name: "question6" as const,
      label: "6. Why do you want equity?",
    },
  ];

  const questions = internshipId ? internshipQuestions : generalQuestions;

  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="space-y-6">
          <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
            APPLICATION
          </div>
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight">
            Ready to build?
          </h2>
          <p className="text-xl text-muted-foreground">
            Tell us about yourself and how you think.
          </p>
          {internshipInfo && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-4 py-1">
                Applying for: {internshipInfo.title} at {internshipInfo.portfolio_company}
              </Badge>
            </div>
          )}
        </div>

        <Card className="p-8 md:p-12 border-0 shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+233 XXX XXX XXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Monthly Salary *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., GHS 3,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resume"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>
                      {internshipId 
                        ? "(Optional) Upload any proof of your thinking" 
                        : "Resume / CV *"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {internshipId 
                        ? "Document, spreadsheet, campaign idea, content, report, school project, etc. - PDF, DOC, or DOCX (max 5MB)"
                        : "PDF, DOC, or DOCX (max 5MB)"}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-8 mt-8">
                <h3 className="text-2xl font-bold mb-6">Application Questions</h3>
                <div className="space-y-6">
                  {questions.map((question) => (
                    <FormField
                      key={question.name}
                      control={form.control}
                      name={question.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">{question.label}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Your detailed answer here..." 
                              className="min-h-32 resize-y"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full text-lg py-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </section>
  );
};
