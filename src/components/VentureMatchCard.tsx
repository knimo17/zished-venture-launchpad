import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Briefcase, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface VentureMatchCardProps {
  rank: number;
  ventureName: string;
  industry: string;
  overallScore: number;
  founderTypeScore: number;
  dimensionScore: number;
  compatibilityScore: number;
  matchReasons: string[];
  concerns: string[];
  suggestedRole: string;
  compact?: boolean;
}

export function VentureMatchCard({
  rank,
  ventureName,
  industry,
  overallScore,
  founderTypeScore,
  dimensionScore,
  compatibilityScore,
  matchReasons,
  concerns,
  suggestedRole,
  compact = false,
}: VentureMatchCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-emerald-600';
    if (score >= 55) return 'text-amber-600';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-100 border-green-200';
    if (score >= 70) return 'bg-emerald-50 border-emerald-200';
    if (score >= 55) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
          getScoreBg(overallScore)
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn('text-2xl font-bold', getScoreColor(overallScore))}>
            #{rank}
          </div>
          <div>
            <div className="font-semibold">{ventureName}</div>
            <div className="text-sm text-muted-foreground">{industry}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={cn('text-xl font-bold', getScoreColor(overallScore))}>
              {overallScore}%
            </div>
            <div className="text-xs text-muted-foreground">Fit Score</div>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', getScoreBg(overallScore))}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold border-2',
                getScoreColor(overallScore),
                overallScore >= 85 ? 'border-green-400 bg-green-50' : 
                overallScore >= 70 ? 'border-emerald-400 bg-emerald-50' :
                'border-amber-400 bg-amber-50'
              )}
            >
              {rank}
            </div>
            <div>
              <CardTitle className="text-lg">{ventureName}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {industry}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-3xl font-bold', getScoreColor(overallScore))}>
              {overallScore}%
            </div>
            <div className="text-xs text-muted-foreground">Overall Fit</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Suggested Role */}
        <div className="flex items-center gap-2 p-2 bg-background/60 rounded-md">
          <Briefcase className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Suggested Role:</span>
          <span className="text-sm">{suggestedRole}</span>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Score Breakdown</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-background/60 rounded-md">
              <div className="text-lg font-semibold">{founderTypeScore}%</div>
              <div className="text-xs text-muted-foreground">Founder Type</div>
            </div>
            <div className="p-2 bg-background/60 rounded-md">
              <div className="text-lg font-semibold">{dimensionScore}%</div>
              <div className="text-xs text-muted-foreground">Dimensions</div>
            </div>
            <div className="p-2 bg-background/60 rounded-md">
              <div className="text-lg font-semibold">{compatibilityScore}%</div>
              <div className="text-xs text-muted-foreground">Team Fit</div>
            </div>
          </div>
        </div>

        {/* Match Reasons */}
        {matchReasons.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Why This Fits
            </div>
            <ul className="space-y-1">
              {matchReasons.slice(0, 3).map((reason, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Considerations
            </div>
            <ul className="space-y-1">
              {concerns.slice(0, 2).map((concern, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
