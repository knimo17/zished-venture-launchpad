import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WeeklyReportThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Report Submitted</CardTitle>
          <CardDescription>
            Thank you for submitting your weekly business report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your report has been received and will be reviewed by the verigo54 team.
            Keep up the excellent work building and scaling ventures!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
