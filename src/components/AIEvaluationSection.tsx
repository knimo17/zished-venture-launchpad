import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, CheckCircle, Lightbulb, TrendingUp } from 'lucide-react';

interface AIStrength {
  strength: string;
  evidence: string;
  application: string;
}

interface AIGrowthArea {
  area: string;
  observation: string;
  recommendation: string;
}

interface ResponsePatterns {
  consistency: string;
  notable_patterns: string[];
}

interface AIEvaluationSectionProps {
  personalizedSummary: string;
  strengths: AIStrength[];
  growthAreas: AIGrowthArea[];
  responsePatterns: ResponsePatterns;
  redFlags: string[];
  overallRecommendation: string;
  recommendationReasoning: string;
}

const recommendationColors: Record<string, string> = {
  'Strong Recommend': 'bg-green-500',
  'Recommend': 'bg-emerald-500',
  'Consider': 'bg-yellow-500',
  'Concerns': 'bg-red-500',
};

export function AIEvaluationSection({
  personalizedSummary,
  strengths,
  growthAreas,
  responsePatterns,
  redFlags,
  overallRecommendation,
  recommendationReasoning,
}: AIEvaluationSectionProps) {
  return (
    <Card className="mb-6 border-2 border-primary/20">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Analysis</CardTitle>
          </div>
          <Badge className={`${recommendationColors[overallRecommendation] || 'bg-muted'} text-white`}>
            {overallRecommendation}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Personalized Summary */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Summary
          </h4>
          <p className="text-muted-foreground leading-relaxed">{personalizedSummary}</p>
        </div>

        {/* Recommendation Reasoning */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm">{recommendationReasoning}</p>
        </div>

        {/* Strengths */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Key Strengths
          </h4>
          <div className="space-y-3">
            {strengths.map((s, i) => (
              <div key={i} className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="font-medium text-green-800 dark:text-green-300">{s.strength}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.evidence}</p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                  <span className="font-medium">Application:</span> {s.application}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Areas */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Development Areas
          </h4>
          <div className="space-y-3">
            {growthAreas.map((g, i) => (
              <div key={i} className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-800 dark:text-blue-300">{g.area}</p>
                <p className="text-sm text-muted-foreground mt-1">{g.observation}</p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
                  <span className="font-medium">Recommendation:</span> {g.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Response Patterns */}
        {responsePatterns && (
          <div>
            <h4 className="font-semibold mb-2">Response Patterns</h4>
            <p className="text-sm text-muted-foreground mb-2">{responsePatterns.consistency}</p>
            {responsePatterns.notable_patterns?.length > 0 && (
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {responsePatterns.notable_patterns.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Red Flags */}
        {redFlags && redFlags.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Areas of Concern
            </h4>
            <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
              {redFlags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
