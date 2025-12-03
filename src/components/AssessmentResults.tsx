import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, Target, Users, Lightbulb, TrendingUp } from 'lucide-react';

interface DimensionScores {
  ownership: number;
  execution: number;
  hustle: number;
  problemSolving: number;
  leadership: number;
}

interface VentureFitScores {
  operator: number;
  product: number;
  growth: number;
  vision: number;
}

interface TeamCompatibilityScores {
  workingStyle: number;
  communication: number;
  conflictResponse: number;
  decisionMaking: number;
  collaboration: number;
}

interface AssessmentResultsProps {
  dimensionScores: DimensionScores;
  ventureFitScores: VentureFitScores;
  teamCompatibilityScores: TeamCompatibilityScores;
  primaryFounderType: string;
  secondaryFounderType: string | null;
  confidenceLevel: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  weaknessSummary: string;
}

const operatorTypeIcons: Record<string, React.ReactNode> = {
  'Operational Leader': <Target className="h-5 w-5" />,
  'Product Architect': <Lightbulb className="h-5 w-5" />,
  'Growth Catalyst': <TrendingUp className="h-5 w-5" />,
  'Visionary Builder': <Users className="h-5 w-5" />,
};

const confidenceBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  'Strong': 'default',
  'Moderate': 'secondary',
  'Emerging': 'outline',
};

export function AssessmentResults({
  dimensionScores,
  ventureFitScores,
  teamCompatibilityScores,
  primaryFounderType,
  secondaryFounderType,
  confidenceLevel,
  summary,
  strengths,
  weaknesses,
  weaknessSummary,
}: AssessmentResultsProps) {
  // Convert dimension scores to percentage (max is 50 for 10 questions * 5 points)
  const dimensionPercentage = (score: number) => (score / 50) * 100;
  
  // Convert venture fit/team scores to percentage (already on 1-5 scale)
  const scalePercentage = (score: number) => (score / 5) * 100;

  return (
    <div className="space-y-6">
      {/* Founder Type Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {operatorTypeIcons[primaryFounderType] || <Target className="h-6 w-6" />}
            </div>
            <div>
              <CardTitle className="text-2xl">{primaryFounderType}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={confidenceBadgeVariant[confidenceLevel] || 'outline'}>
                  {confidenceLevel}
                </Badge>
                {secondaryFounderType && (
                  <span className="text-sm text-muted-foreground">
                    with {secondaryFounderType} tendencies
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{summary}</p>
        </CardContent>
      </Card>

      {/* Core Dimension Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Core Operator Traits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Ownership & Responsibility', score: dimensionScores.ownership, max: 50 },
            { label: 'Execution & Action Bias', score: dimensionScores.execution, max: 50 },
            { label: 'Hustle & Initiative', score: dimensionScores.hustle, max: 50 },
            { label: 'Problem-Solving & Adaptability', score: dimensionScores.problemSolving, max: 50 },
            { label: 'Leadership & Influence', score: dimensionScores.leadership, max: 50 },
          ].map((dim) => (
            <div key={dim.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{dim.label}</span>
                <span className="text-muted-foreground">{dim.score}/{dim.max}</span>
              </div>
              <Progress value={dimensionPercentage(dim.score)} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Venture Fit Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Venture Fit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Operator (Systems & Process)', score: ventureFitScores.operator },
            { label: 'Product (UX & Features)', score: ventureFitScores.product },
            { label: 'Growth (Sales & Distribution)', score: ventureFitScores.growth },
            { label: 'Vision (Strategy & Direction)', score: ventureFitScores.vision },
          ].map((fit) => (
            <div key={fit.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{fit.label}</span>
                <span className="text-muted-foreground">{fit.score.toFixed(1)}/5.0</span>
              </div>
              <Progress value={scalePercentage(fit.score)} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team Compatibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Compatibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Working Style', score: teamCompatibilityScores.workingStyle },
            { label: 'Communication', score: teamCompatibilityScores.communication },
            { label: 'Conflict Response', score: teamCompatibilityScores.conflictResponse },
            { label: 'Decision-Making', score: teamCompatibilityScores.decisionMaking },
            { label: 'Collaboration', score: teamCompatibilityScores.collaboration },
          ].map((compat) => (
            <div key={compat.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{compat.label}</span>
                <span className="text-muted-foreground">{compat.score.toFixed(1)}/5.0</span>
              </div>
              <Progress value={scalePercentage(compat.score)} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 mt-1">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Development Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Weakness Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Growth Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{weaknessSummary}</p>
        </CardContent>
      </Card>
    </div>
  );
}
