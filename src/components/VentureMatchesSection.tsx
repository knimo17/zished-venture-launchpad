import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VentureMatchCard } from './VentureMatchCard';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';

export interface VentureMatch {
  venture_id: string;
  venture_name: string;
  industry: string;
  overall_score: number;
  operator_type_score: number;
  dimension_score: number;
  compatibility_score: number;
  match_reasons: string[];
  concerns: string[];
  suggested_role: string | null;
}

interface VentureMatchesSectionProps {
  matches: VentureMatch[];
  showAllInitially?: boolean;
}

export function VentureMatchesSection({
  matches,
  showAllInitially = false,
}: VentureMatchesSectionProps) {
  const [showAll, setShowAll] = useState(showAllInitially);

  if (!matches || matches.length === 0) {
    return null;
  }

  // Sort by overall score descending
  const sortedMatches = [...matches].sort((a, b) => b.overall_score - a.overall_score);
  const topMatches = sortedMatches.slice(0, 3);
  const remainingMatches = sortedMatches.slice(3);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Top Venture Matches</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on operator type, core traits, and team compatibility scores
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top 3 Matches - Full Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {topMatches.map((match, index) => (
            <VentureMatchCard
              key={match.venture_id}
              rank={index + 1}
              ventureName={match.venture_name}
              industry={match.industry}
              overallScore={Math.round(match.overall_score)}
              founderTypeScore={Math.round(match.operator_type_score)}
              dimensionScore={Math.round(match.dimension_score)}
              compatibilityScore={Math.round(match.compatibility_score)}
              matchReasons={match.match_reasons}
              concerns={match.concerns}
              suggestedRole={match.suggested_role || 'General Operator'}
            />
          ))}
        </div>

        {/* Remaining Matches - Collapsed */}
        {remainingMatches.length > 0 && (
          <>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Other Matches
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  View All {sortedMatches.length} Matches
                </>
              )}
            </Button>

            {showAll && (
              <div className="space-y-3 pt-2">
                {remainingMatches.map((match, index) => (
                  <VentureMatchCard
                    key={match.venture_id}
                    rank={index + 4}
                    ventureName={match.venture_name}
                    industry={match.industry}
                    overallScore={Math.round(match.overall_score)}
                    founderTypeScore={Math.round(match.operator_type_score)}
                    dimensionScore={Math.round(match.dimension_score)}
                    compatibilityScore={Math.round(match.compatibility_score)}
                    matchReasons={match.match_reasons}
                    concerns={match.concerns}
                    suggestedRole={match.suggested_role || 'General Operator'}
                    compact
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
