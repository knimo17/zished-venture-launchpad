import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Lightbulb } from 'lucide-react';

interface AIVentureAnalysisCardProps {
  ventureName: string;
  industry: string;
  fitNarrative: string;
  roleRecommendation: string;
  onboardingSuggestions: string[];
}

export function AIVentureAnalysisCard({
  ventureName,
  industry,
  fitNarrative,
  roleRecommendation,
  onboardingSuggestions,
}: AIVentureAnalysisCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {ventureName}
          </CardTitle>
          <Badge variant="outline">{industry}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h5 className="text-sm font-medium mb-1 text-muted-foreground">Fit Analysis</h5>
          <p className="text-sm">{fitNarrative}</p>
        </div>

        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <h5 className="text-sm font-medium">Recommended Role</h5>
            <p className="text-sm text-muted-foreground">{roleRecommendation}</p>
          </div>
        </div>

        {onboardingSuggestions && onboardingSuggestions.length > 0 && (
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium">Onboarding Suggestions</h5>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                {onboardingSuggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
