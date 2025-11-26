import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
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
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
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
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log({
      ...values,
      resumeName: values.resume.name,
      resumeSize: values.resume.size,
    });
    
    toast({
      title: "Application Submitted!",
      description: "We'll review your application and get back to you soon.",
    });
    
    form.reset();
    setIsSubmitting(false);
  };

  const questions = [
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
      label: "4. Pick a venture idea from our list. How would you grow revenue in the first 90 days?",
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
                name="resume"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Resume / CV *</FormLabel>
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
                      PDF, DOC, or DOCX (max 5MB)
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
