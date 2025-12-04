import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, CheckCircle, Lightbulb, TrendingUp, Shield, User } from 'lucide-react';

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

interface HonestyAssessment {
  reliability: 'High' | 'Moderate' | 'Low';
  notes: string;
}

interface StyleProfile {
  decision_style: string;
  work_preference: string;
  communication_approach: string;
  primary_focus: string;
}

interface AIEvaluationSectionProps {
  personalizedSummary: string;
  strengths: AIStrength[];
  growthAreas: AIGrowthArea[];
  responsePatterns: ResponsePatterns;
  redFlags: string[];
  overallRecommendation: string;
  recommendationReasoning: string;
  honestyAssessment?: HonestyAssessment;
  styleProfile?: StyleProfile;
}

const recommendationColors: Record<string, string> = {
  'Strong Recommend': 'bg-green-500',
  'Recommend': 'bg-emerald-500',
  'Consider': 'bg-yellow-500',
  'Concerns': 'bg-red-500',
};

const reliabilityColors: Record<string, string> = {
  'High': 'bg-green-500',
  'Moderate': 'bg-yellow-500',
  'Low': 'bg-red-500',
};

export function AIEvaluationSection({
  personalizedSummary,
  strengths,
  growthAreas,
  responsePatterns,
  redFlags,
  overallRecommendation,
  recommendationReasoning,
  honestyAssessment,
  styleProfile,
}: AIEvaluationSectionProps) {
  return (
    <Card className="mb-6 border-2 border-primary/20">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Analysis</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {honestyAssessment && (
              <Badge 
                className={`${reliabilityColors[honestyAssessment.reliability] || 'bg-muted'} text-white`}
                title={honestyAssessment.notes}
              >
                <Shield className="h-3 w-3 mr-1" />
                {honestyAssessment.reliability} Reliability
              </Badge>
            )}
            <Badge className={`${recommendationColors[overallRecommendation] || 'bg-muted'} text-white`}>
              {overallRecommendation}
            </Badge>
          </div>
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

        {/* Style Profile */}
        {styleProfile && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-purple-500" />
              Behavioral Style Profile
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Decision Style</p>
                <p className="text-sm mt-1">{styleProfile.decision_style}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Work Preference</p>
                <p className="text-sm mt-1">{styleProfile.work_preference}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Communication</p>
                <p className="text-sm mt-1">{styleProfile.communication_approach}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Primary Focus</p>
                <p className="text-sm mt-1">{styleProfile.primary_focus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Honesty Assessment Note */}
        {honestyAssessment && honestyAssessment.reliability !== 'High' && (
          <div className={`p-4 rounded-lg border ${
            honestyAssessment.reliability === 'Low' 
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
              : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <h4 className={`font-semibold mb-1 flex items-center gap-2 ${
              honestyAssessment.reliability === 'Low' 
                ? 'text-red-700 dark:text-red-400' 
                : 'text-yellow-700 dark:text-yellow-400'
            }`}>
              <Shield className="h-4 w-4" />
              Response Reliability Note
            </h4>
            <p className={`text-sm ${
              honestyAssessment.reliability === 'Low' 
                ? 'text-red-700 dark:text-red-400' 
                : 'text-yellow-700 dark:text-yellow-400'
            }`}>
              {honestyAssessment.notes}
            </p>
          </div>
        )}

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
