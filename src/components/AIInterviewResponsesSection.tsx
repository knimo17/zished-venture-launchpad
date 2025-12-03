import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

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

interface AIInterviewResponsesSectionProps {
  questions: AIInterviewQuestion[];
  responses: AIInterviewResponse[];
}

const probingAreaLabels: Record<string, { label: string; color: string }> = {
  strength_validation: { label: 'Strength Validation', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  growth_exploration: { label: 'Growth Exploration', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  venture_curiosity: { label: 'Venture Curiosity', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  problem_solving: { label: 'Problem Solving', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  initiative: { label: 'Initiative', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  concern_probing: { label: 'Concern Probing', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  learning_agility: { label: 'Learning Agility', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
};

export function AIInterviewResponsesSection({ questions, responses }: AIInterviewResponsesSectionProps) {
  const responseMap = new Map(responses.map(r => [r.question_id, r.response_text]));
  const sortedQuestions = [...questions].sort((a, b) => a.question_order - b.question_order);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Interview Responses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedQuestions.map((q, index) => {
          const response = responseMap.get(q.id);
          const areaConfig = probingAreaLabels[q.probing_area] || { label: q.probing_area, color: 'bg-muted' };

          return (
            <div key={q.id} className="border-b pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {index + 1}
                </span>
                <Badge className={areaConfig.color} variant="secondary">
                  {areaConfig.label}
                </Badge>
              </div>
              
              <p className="font-medium mb-1">{q.question_text}</p>
              <p className="text-xs text-muted-foreground italic mb-3">{q.question_context}</p>
              
              {response ? (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{response}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No response recorded</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
