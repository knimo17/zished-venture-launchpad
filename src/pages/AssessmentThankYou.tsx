import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssessmentThankYou() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <Card className="max-w-lg w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Thank You!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your Operator Assessment has been submitted successfully.
          </p>
          <p className="text-muted-foreground">
            Our team will review your results and be in touch with next steps.
          </p>
          <div className="pt-4 border-t mt-6">
            <p className="text-sm text-muted-foreground">
              verigo54 Venture Studio
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
